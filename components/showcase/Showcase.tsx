"use client";

import { lazy, useEffect, useMemo, useState, type CSSProperties } from "react";
import CanvasStage, { type CameraSetup } from "@/components/CanvasStage";
import ShotHelper from "@/components/showcase/ShotHelper";
import { runtime } from "@/lib/showcase/runtime";
import type { Chapter, Colorway, ShowcaseConfig } from "@/lib/showcase/types";
import { useReveal, useScrollStory } from "@/lib/stage/useScrollStory";

/**
 * The 3D scene, fetched only when the canvas mounts, after the poster has
 * painted. A plain import here would pull Three.js, drei and GSAP into the
 * page's first download and block the page while they load.
 */
const Scene = lazy(() => import("@/components/showcase/Scene"));

/*
  The page half of a product showcase: opening, one section per chapter,
  and the colourway finale, over a fixed 3D stage. Everything it shows
  comes from the ShowcaseConfig.
*/

/** The colourway's mood as CSS variables; every element eases between moods. */
function mood(way: Colorway): CSSProperties {
  const dark = way.mood.tone === "dark";
  return {
    "--bg": way.mood.backdrop,
    "--ink": way.mood.ink,
    "--muted": way.mood.muted,
    "--rule": way.mood.rule,
    "--chip": dark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.6)",
    "--hairline": dark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.22)",
    "--swatch-edge": dark ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.15)",
  } as CSSProperties;
}

/**
 * Chapter text. On landscape screens it sits in a side column capped at
 * 27.5% of the width, so text and product keep the same proportions on
 * every screen size; the shot helper's dashed boxes match these columns.
 * On portrait screens it sits at the bottom.
 */
function ChapterSection({ chapter }: { chapter: Chapter }) {
  const right = chapter.align === "right";
  return (
    <section
      data-chapter
      className="pointer-events-none relative flex h-svh items-end px-6 pb-16 landscape:items-center landscape:px-10 landscape:pb-0"
    >
      <div
        data-reveal
        className={`w-full max-w-[520px] landscape:max-w-[min(520px,27.5vw)] ${
          right ? "landscape:ml-auto landscape:text-right" : ""
        }`}
      >
        <p className="text-[13px] font-medium tracking-[0.08em] text-[color:var(--muted)]">
          {chapter.label}
        </p>
        <h2 className="mt-4 text-[clamp(2.25rem,4vw,4.75rem)] font-semibold leading-[0.95] tracking-[-0.03em]">
          {chapter.title}
        </h2>
        <p
          className={`mt-5 max-w-[34ch] text-[16px] leading-relaxed text-[color:var(--muted)] ${
            right ? "landscape:ml-auto" : ""
          }`}
        >
          {chapter.body}
        </p>
      </div>
    </section>
  );
}

/** Dashed boxes where the page puts text, for framing shots around. */
function Guides() {
  const box = "absolute border border-dashed border-[#E3414E]";
  const label = "absolute left-2 top-1 text-[11px] text-[#E3414E]";
  return (
    <div className="pointer-events-none fixed inset-0 z-40">
      <div className="hidden landscape:block">
        <div className={`${box} left-10 top-1/2 h-[280px] w-[min(520px,27.5vw)] -translate-y-1/2`}>
          <span className={label}>Text, left chapters</span>
        </div>
        <div className={`${box} right-10 top-1/2 h-[280px] w-[min(520px,27.5vw)] -translate-y-1/2`}>
          <span className={label}>Text, right chapters</span>
        </div>
      </div>
      <div className={`${box} hidden portrait:block inset-x-6 bottom-16 h-[270px]`}>
        <span className={label}>Chapter text</span>
      </div>
      <div className={`${box} right-6 top-6 h-[56px] w-[230px] md:right-10`}>
        <span className={label}>Header</span>
      </div>
    </div>
  );
}

export default function Showcase({ config }: { config: ShowcaseConfig }) {
  const { brand, product, chapters, colorways, finale, credit } = config;
  const sections = chapters.length + 2;

  const [active, setActive] = useState(colorways[0]);
  const [helper, setHelper] = useState(false);

  const camera = useMemo<CameraSetup>(
    () => ({ position: config.hero.landscape.position, fov: config.hero.landscape.fov }),
    [config],
  );

  /* Shot helper: development only, ?shots in the URL. */
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    const on = new URLSearchParams(window.location.search).has("shots");
    runtime.helper.active = on;
    setHelper(on);
    return () => {
      runtime.helper.active = false;
    };
  }, []);

  /* Smooth scrolling, progress for the scene, and text reveals. Off in the helper. */
  const { section, atEnd } = useScrollStory(sections, !helper);
  useReveal(!helper);

  const quiet = section > 0 && section < sections - 1;
  const interactive = helper || atEnd;

  return (
    <main
      className="relative text-[color:var(--ink)] transition-colors duration-700"
      style={mood(active)}
    >
      {/* Fixed stage: backdrop, giant number and the 3D scene. */}
      <div className="fixed inset-0">
        <div className="pointer-events-none absolute inset-0 bg-[color:var(--bg)] transition-colors duration-700" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(110%_75%_at_50%_30%,rgba(255,255,255,0.28)_0%,rgba(255,255,255,0)_50%,rgba(0,0,0,0.14)_100%)]" />

        {/* Giant colourway number behind the product; steps back in close-ups. */}
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-0 z-[5] flex items-center justify-center overflow-hidden transition-opacity duration-700 ${
            quiet || helper ? "opacity-0" : "opacity-100"
          }`}
        >
          <span className="opacity-[0.07]">
            <span
              key={active.id}
              className="numeral-rise block select-none text-[min(64vh,50vw)] font-semibold leading-none tracking-[-0.06em] tabular-nums"
            >
              {active.code}
            </span>
          </span>
        </div>

        {/* The canvas only takes the pointer in the finale (or the helper). */}
        <div
          className={`absolute inset-0 z-10 ${
            interactive ? "pointer-events-auto" : "pointer-events-none"
          }`}
        >
          <CanvasStage
            camera={camera}
            frameloop="always"
            posterFit="contain"
            poster={config.poster}
            posterAlt={`${product.name} in ${active.name}`}
          >
            <Scene config={config} colorway={active} helper={helper} />
          </CanvasStage>
        </div>
      </div>

      <header className="pointer-events-none fixed inset-x-0 top-0 z-30 flex items-baseline justify-between px-6 pt-6 md:px-10 md:pt-8">
        <span className="text-[15px] font-semibold tracking-[0.14em]">{brand}</span>
        <span className="text-right">
          <span className="block text-[13px] tabular-nums text-[color:var(--muted)] transition-colors duration-700">
            {product.line} {active.code}
          </span>
          {credit && (
            <span className="mt-1 block text-[11px] text-[color:var(--muted)] opacity-80 transition-colors duration-700">
              {credit}
            </span>
          )}
        </span>
      </header>

      {helper ? (
        <>
          <Guides />
          <ShotHelper config={config} />
        </>
      ) : (
        /*
          pointer-events-none on the wrapper, not just its sections: a
          transparent element still catches clicks, and this one covers the
          whole page, so without it nothing on the 3D stage beneath (the
          canvas drag, the poster button) could ever be reached. The chips
          opt back in with pointer-events-auto.
        */
        <div className="pointer-events-none relative z-20">
          {/* Opening */}
          <section data-chapter className="pointer-events-none relative h-svh">
            <div data-reveal className="absolute bottom-24 left-6 md:bottom-10 md:left-10">
              <p className="text-[13px] font-medium tracking-[0.08em] text-[color:var(--muted)]">
                {product.eyebrow}
              </p>
              <h1 className="mt-3 text-[clamp(3rem,8vw,6.5rem)] font-semibold leading-[0.9] tracking-[-0.035em]">
                {product.name}
              </h1>
              <p className="mt-4 max-w-[34ch] text-[16px] leading-relaxed text-[color:var(--muted)]">
                {product.tagline}
              </p>
            </div>
            <p className="absolute bottom-10 right-6 flex items-center gap-3 text-[12px] text-[color:var(--muted)] md:right-10">
              Scroll
              <span className="scroll-line" aria-hidden="true" />
            </p>
          </section>

          {chapters.map((chapter) => (
            <ChapterSection key={chapter.label} chapter={chapter} />
          ))}

          {/* Finale: the colourway picker */}
          <section className="pointer-events-none relative h-svh">
            <div className="absolute bottom-24 left-6 md:bottom-10 md:left-10">
              <p className="mb-4 text-[13px] font-medium tracking-[0.08em] text-[color:var(--muted)] transition-colors duration-700">
                {finale.eyebrow}
              </p>
              <span
                className="mb-4 block h-1 w-16 transition-colors duration-700"
                style={{ backgroundColor: "var(--rule)" }}
              />
              <p
                key={active.id}
                className="rise text-[clamp(2.75rem,7vw,5rem)] font-semibold leading-[0.9] tracking-[-0.03em]"
              >
                {active.name}
              </p>
              <p className="mt-2 text-[13px] tabular-nums text-[color:var(--muted)] transition-colors duration-700">
                Colourway {active.code} of {String(colorways.length).padStart(2, "0")}
              </p>
            </div>

            <div className="pointer-events-auto absolute inset-x-0 bottom-0 flex gap-3 overflow-x-auto px-6 pb-6 md:inset-x-auto md:bottom-auto md:right-10 md:top-1/2 md:w-auto md:-translate-y-1/2 md:flex-col md:overflow-visible md:px-0 md:pb-0">
              {colorways.map((way) => {
                const selected = way.id === active.id;
                return (
                  <button
                    key={way.id}
                    type="button"
                    onClick={() => setActive(way)}
                    aria-label={`${way.name} ${way.code}`}
                    aria-pressed={selected}
                    className={`flex shrink-0 items-center gap-3 border px-3 py-2 text-left outline-offset-4 transition-colors duration-700 focus-visible:outline-2 focus-visible:outline-[color:var(--ink)] ${
                      selected
                        ? "border-[color:var(--ink)] bg-[color:var(--chip)]"
                        : "border-transparent hover:border-[color:var(--hairline)]"
                    }`}
                  >
                    <span
                      className="h-7 w-7 shrink-0 border border-[color:var(--swatch-edge)]"
                      style={{
                        background: `linear-gradient(135deg, ${way.swatch} 0 62%, ${way.accent} 62% 100%)`,
                      }}
                    />
                    <span className="hidden md:block">
                      <span className="block text-[13px] font-medium leading-tight">{way.name}</span>
                      <span className="block text-[12px] tabular-nums text-[color:var(--muted)] transition-colors duration-700">
                        {way.code}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            <p className="absolute bottom-10 right-6 hidden text-[12px] text-[color:var(--muted)] transition-colors duration-700 md:right-10 md:block">
              Drag to rotate
            </p>
          </section>
        </div>
      )}
    </main>
  );
}
