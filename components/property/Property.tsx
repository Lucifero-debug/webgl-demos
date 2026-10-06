"use client";

import { lazy, useMemo, useRef, type CSSProperties, type ReactNode } from "react";
import CanvasStage, { type CameraSetup } from "@/components/CanvasStage";
import Details from "@/components/property/Details";
import type { PropertyConfig } from "@/lib/property/types";
import { useDirector } from "@/lib/stage/director";
import { usePinned } from "@/lib/stage/pinned";
import { useScrollStory } from "@/lib/stage/useScrollStory";

/**
 * The tower, fetched only when the canvas mounts, after the poster has
 * painted. A plain import would pull Three.js into the first download.
 */
const TowerScene = lazy(() => import("@/components/property/TowerScene"));

/*
  The page half of a property explainer. Same shape as the clinic: fixed
  text panels that swap as the camera settles, labels pinned to the
  building, and cost last.
*/

const theme = {
  "--ink": "#1B1A17",
  "--muted": "#6A695F",
  "--accent": "#3F5B45",
  "--hairline": "rgba(27, 26, 23, 0.14)",
  "--ground": "#EFEDE8",
} as CSSProperties;

const serif = "font-[family-name:var(--font-serif)]";

const SCRIM = {
  left:
    "landscape:bg-[linear-gradient(90deg,rgba(239,237,232,0.92)_0%,rgba(239,237,232,0.6)_30%,rgba(239,237,232,0)_55%)] " +
    "portrait:bg-[linear-gradient(0deg,rgba(239,237,232,0.95)_0%,rgba(239,237,232,0.7)_40%,rgba(239,237,232,0)_65%)]",
  right:
    "landscape:bg-[linear-gradient(270deg,rgba(239,237,232,0.92)_0%,rgba(239,237,232,0.6)_30%,rgba(239,237,232,0)_55%)] " +
    "portrait:bg-[linear-gradient(0deg,rgba(239,237,232,0.95)_0%,rgba(239,237,232,0.7)_40%,rgba(239,237,232,0)_65%)]",
};

function Panel({
  active,
  align,
  wide = false,
  children,
}: {
  active: boolean;
  align: "left" | "right";
  wide?: boolean;
  children: ReactNode;
}) {
  const right = align === "right";
  return (
    <div className="absolute inset-0 flex items-end px-6 pb-14 landscape:items-center landscape:px-10 landscape:pb-0">
      <div
        aria-hidden="true"
        className={`absolute inset-0 transition-opacity duration-700 ${SCRIM[align]} ${
          active ? "opacity-100" : "opacity-0"
        }`}
      />
      <div
        data-reveal
        data-shown={active ? "true" : "false"}
        aria-hidden={!active}
        className={`relative w-full max-w-[520px] ${
          wide ? "landscape:max-w-[min(560px,36vw)]" : "landscape:max-w-[min(480px,30vw)]"
        } ${right ? "landscape:ml-auto landscape:text-right" : ""}`}
      >
        {children}
      </div>
    </div>
  );
}

/** A label drawn to one band of the building while it is separated. */
function BandLabel({
  id,
  label,
  detail,
  index,
  active,
}: {
  id: string;
  label: string;
  detail: string;
  index: number;
  active: boolean;
}) {
  const el = useRef<HTMLDivElement>(null);
  usePinned(el, `prop:band:${id}`, active);
  return (
    <div
      ref={el}
      className="pointer-events-none absolute left-0 top-0 hidden opacity-0 transition-opacity duration-500 landscape:block"
      style={{ transitionDelay: active ? `${220 + index * 110}ms` : "0ms" }}
    >
      <div className="absolute right-0 top-0 flex -translate-y-1/2 items-center gap-3">
        <span className="whitespace-nowrap text-right leading-tight">
          <span className="block text-[14px]">{label}</span>
          <span className="block text-[12px] text-[color:var(--muted)]">{detail}</span>
        </span>
        <span className="h-px w-10 bg-[color:var(--ink)] opacity-35" />
      </div>
    </div>
  );
}

/** A home on the floor being explained. */
function UnitLabel({
  index,
  label,
  size,
  active,
}: {
  index: number;
  label: string;
  size: string;
  active: boolean;
}) {
  const el = useRef<HTMLDivElement>(null);
  usePinned(el, `prop:unit:${index}`, active);
  return (
    <div
      ref={el}
      className="pointer-events-none absolute left-0 top-0 hidden opacity-0 transition-opacity duration-500 landscape:block"
      style={{ transitionDelay: active ? `${260 + index * 140}ms` : "0ms" }}
    >
      <span className="absolute left-0 top-0 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-[2px] border border-[color:var(--hairline)] bg-[rgba(239,237,232,0.9)] px-3 py-1.5 text-center backdrop-blur-sm">
        <span className="block text-[13px]">{label}</span>
        <span className="block text-[11px] text-[color:var(--muted)]">{size}</span>
      </span>
    </div>
  );
}

export default function Property({ config }: { config: PropertyConfig }) {
  const { brand, project, hero, stack, beats, pricing, tower } = config;
  const stackIndex = 1;
  const pricingIndex = 2 + beats.length;
  const sections = pricingIndex + 1;

  /*
    Scoped to the story's own height: the page carries ordinary sections
    below it (plans, specifications, location, enquiry), and the camera
    should finish its story before those arrive rather than being stretched
    across the whole document.
  */
  const { section, settled, atEnd } = useScrollStory(sections, true, true);

  /*
    The story's layers are fixed, so they would otherwise sit on top of
    the sections that scroll up beneath them. Once the last beat is
    reached they fade out and stop taking clicks.
  */
  const storyLayer = `transition-opacity duration-500 ${atEnd ? "pointer-events-none opacity-0" : "opacity-100"}`;
  const shows = (index: number) => section === index && settled;
  const heroShown = shows(0);
  const pricingShown = shows(pricingIndex);
  const planIndex = beats.findIndex((beat) => beat.kind === "floor");
  const planUnits = planIndex >= 0 ? beats[planIndex] : undefined;

  // Start further out, so the tower drifts in.
  const camera = useMemo<CameraSetup>(() => ({ position: [26, 14, 38], fov: 30 }), []);

  const button =
    "inline-flex h-12 items-center bg-[color:var(--ink)] px-6 text-[14px] font-medium text-white outline-offset-4 transition-colors hover:bg-[#33322C] focus-visible:outline-2 focus-visible:outline-[color:var(--ink)]";

  /* Recording mode (?record, then Space): every beat at reading pace. */
  useDirector(async ({ wait, toBeat }) => {
    await wait(2500);
    for (let i = 1; i < sections; i++) {
      await toBeat(i, 2400);
      await wait(3000);
    }
    await wait(1500);
  });

  return (
    <main className="relative text-[color:var(--ink)]" style={theme}>
      {/* Fixed stage: a pale site with the model standing on it. */}
      <div className={`fixed inset-0 ${storyLayer}`}>
        <div className="pointer-events-none absolute inset-0 bg-[color:var(--ground)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_60%_35%,#FAF8F4_0%,rgba(250,248,244,0)_100%)]" />
        <div className="pointer-events-none absolute inset-0 z-10">
          <CanvasStage
            camera={camera}
            frameloop="always"
            posterFit="cover"
            poster={config.poster}
            posterAlt={`${project}: the building in 3D`}
          >
            <TowerScene config={config} />
          </CanvasStage>
        </div>
      </div>

      {/* Pinned to the building. */}
      <div className={`pointer-events-none fixed inset-0 z-[15] ${storyLayer}`}>
        {tower.bands.map((band, i) => (
          <BandLabel
            key={band.id}
            id={band.id}
            label={band.label}
            detail={band.detail}
            index={i}
            active={shows(stackIndex)}
          />
        ))}
        {planUnits?.kind === "floor" &&
          planUnits.units.map((unit, i) => (
            <UnitLabel
              key={unit.label}
              index={i}
              label={unit.label}
              size={unit.size}
              active={shows(2 + planIndex)}
            />
          ))}
      </div>

      {/* Fixed text. */}
      <div className={`pointer-events-none fixed inset-0 z-20 ${storyLayer}`}>
        <Panel active={heroShown} align="left" wide>
          <p className="text-[13px] text-[color:var(--accent)]">{hero.eyebrow}</p>
          <h1 className={`${serif} mt-4 text-[clamp(2.6rem,5vw,5.25rem)] leading-[1.02]`}>
            {hero.title}
          </h1>
          <p className="mt-6 max-w-[40ch] text-[17px] leading-relaxed text-[color:var(--muted)]">
            {hero.tagline}
          </p>
          <a
            href={config.ctaHref}
            tabIndex={heroShown ? 0 : -1}
            className={`mt-8 ${button} ${heroShown ? "pointer-events-auto" : ""}`}
          >
            {hero.cta}
          </a>
        </Panel>

        <Panel active={shows(stackIndex)} align="right">
          <p className="text-[13px] text-[color:var(--accent)]">{stack.label}</p>
          <h2 className={`${serif} mt-4 text-[clamp(2.2rem,3.8vw,4rem)] leading-[1.05]`}>
            {stack.title}
          </h2>
          <p className="mt-5 text-[16px] leading-relaxed text-[color:var(--muted)] landscape:ml-auto landscape:max-w-[38ch]">
            {stack.body}
          </p>
        </Panel>

        {beats.map((beat, i) => (
          <Panel key={beat.label} active={shows(2 + i)} align={beat.align}>
            <p className="text-[13px] text-[color:var(--accent)]">{beat.label}</p>
            <h2 className={`${serif} mt-4 text-[clamp(2.2rem,3.8vw,4rem)] leading-[1.05]`}>
              {beat.title}
            </h2>
            <p
              className={`mt-5 max-w-[38ch] text-[16px] leading-relaxed text-[color:var(--muted)] ${
                beat.align === "right" ? "landscape:ml-auto" : ""
              }`}
            >
              {beat.body}
            </p>
            {beat.kind === "amenities" && (
              <ul
                className={`mt-6 flex flex-wrap gap-x-5 gap-y-1 text-[13px] ${
                  beat.align === "right" ? "landscape:justify-end" : ""
                }`}
              >
                {beat.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
            {beat.kind === "floor" && (
              <ul
                className={`mt-6 flex flex-wrap gap-x-5 gap-y-1 text-[13px] tabular-nums ${
                  beat.align === "right" ? "landscape:justify-end" : ""
                }`}
              >
                {beat.units.map((unit) => (
                  <li key={unit.label}>
                    {unit.label}: {unit.size}
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        ))}

        <Panel active={pricingShown} align="right">
          <p className="text-[13px] text-[color:var(--accent)]">{pricing.eyebrow}</p>
          <h2 className={`${serif} mt-4 text-[clamp(2.2rem,3.8vw,4rem)] leading-[1.05]`}>
            {pricing.title}
          </h2>
          <ul className="mt-7 border-t border-[color:var(--hairline)]">
            {pricing.rows.map((row) => (
              <li
                key={row.label}
                className="flex items-baseline justify-between gap-6 border-b border-[color:var(--hairline)] py-3 text-left"
              >
                <span>
                  <span className="block text-[15px]">{row.label}</span>
                  {row.detail && (
                    <span className="block text-[13px] text-[color:var(--muted)]">
                      {row.detail}
                    </span>
                  )}
                </span>
                <span className="shrink-0 text-[15px] tabular-nums">{row.price}</span>
              </li>
            ))}
          </ul>
          <a
            href={config.ctaHref}
            tabIndex={pricingShown ? 0 : -1}
            className={`mt-8 ${button} ${pricingShown ? "pointer-events-auto" : ""}`}
          >
            {pricing.cta}
          </a>
          <p className="mt-6 text-[11px] leading-snug text-[color:var(--muted)]">
            {pricing.note}
          </p>
          <p className="mt-3 text-[11px] leading-snug text-[color:var(--muted)]">{config.note}</p>
        </Panel>

        <p
          className={`absolute bottom-10 right-6 flex items-center gap-3 text-[12px] text-[color:var(--muted)] transition-opacity duration-500 md:right-10 ${
            heroShown ? "opacity-100" : "opacity-0"
          }`}
        >
          Scroll
          <span className="scroll-line" aria-hidden="true" />
        </p>
      </div>

      <header
        className={`pointer-events-none fixed inset-x-0 top-0 z-30 flex items-baseline justify-between px-6 pt-6 md:px-10 md:pt-8 ${storyLayer}`}
      >
        <span className={`${serif} text-[22px] leading-none`}>{project}</span>
        <span className="text-[12px] text-[color:var(--muted)]">By {brand}</span>
      </header>

      {/* The scroll's length: one empty screen per beat. */}
      <div aria-hidden="true">
        {Array.from({ length: sections }, (_, i) => (
          <div key={i} className="h-svh" />
        ))}
      </div>

      {/* The rest of the page, scrolling up over the 3D stage. */}
      <Details config={config} serif={serif} />
    </main>
  );
}
