"use client";

import { type ComponentType, useEffect, useMemo, useRef, useState } from "react";
import CanvasStage, { type CameraSetup } from "@/components/CanvasStage";
import type { PricedStoryConfig } from "@/lib/clinic/types";

/*
  A 3D scroll story with its price building up beside it -- the shape the
  X-Nav section (NavStory) and the full-mouth robotic section
  (RoboticStory) share. The section is several screens tall, its inside is
  sticky, and scrolling through it moves the scene through its steps while
  the steps beside it light up, each price row lights when its step is
  reached, and the total arrives with the last step.

  The page half only: it measures scroll into `runtime`, which the scene
  reads every frame. Must not import three (see the boundary in
  PROJECT-CONTEXT.md); the caller passes the scene in, already lazy().
*/

const serif = "font-[family-name:var(--font-serif)]";

/** What every priced story needs from the scene side: where the scroll is. */
export type StoryRuntime = { progress: number; visible: boolean };

export default function PricedStory({
  story: nav,
  ctaHref,
  Scene,
  runtime,
  steps,
  camera: cameraSetup,
  posterAlt,
}: {
  story: PricedStoryConfig;
  ctaHref: string;
  /** The 3D half, already wrapped in lazy() by the caller. */
  Scene: ComponentType;
  /** Shared with the scene, which reads it every frame. */
  runtime: StoryRuntime;
  /** Where each step starts, 0 to 1; the scene poses to the same. */
  steps: number[];
  camera: CameraSetup;
  posterAlt: string;
}) {
  const section = useRef<HTMLElement>(null);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const node = section.current;
    if (!node) return;
    let frame = 0;
    const measure = () => {
      frame = 0;
      const rect = node.getBoundingClientRect();
      const room = rect.height - window.innerHeight;
      const p = room > 0 ? Math.min(1, Math.max(0, -rect.top / room)) : 0;
      runtime.progress = p;
      let current = 0;
      steps.forEach((start, i) => {
        if (p >= start) current = i;
      });
      setStep(current); // React skips the render when it is unchanged
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    const observer = new IntersectionObserver(([entry]) => {
      runtime.visible = entry.isIntersecting;
    });
    observer.observe(node);
    measure();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      observer.disconnect();
      runtime.visible = false;
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [runtime, steps]);

  const camera = useMemo<CameraSetup>(() => cameraSetup, [cameraSetup]);
  const lastStep = nav.steps.length - 1;
  const totalShown = step >= lastStep;

  return (
    <section
      ref={section}
      aria-label={nav.title}
      className="relative border-t border-[color:var(--hairline)]"
      // One screen to arrive, then one per step: long enough to read each.
      style={{ height: `${100 + nav.steps.length * 70}svh` }}
    >
      <div className="sticky top-0 grid h-svh grid-rows-[1fr_auto] overflow-hidden landscape:grid-cols-[1.2fr_0.8fr] landscape:grid-rows-1">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(45%_55%_at_35%_50%,rgba(217,179,108,0.13)_0%,rgba(217,179,108,0)_70%)]" />
        <div className="relative min-h-0">
          <CanvasStage
            camera={camera}
            frameloop="demand"
            posterFit="contain"
            poster={nav.poster}
            posterAlt={posterAlt}
          >
            <Scene />
          </CanvasStage>
        </div>

        {/* Bottom room on a phone for the fixed WhatsApp / Call bar, or the
            total -- the line this section ends on -- sits under it. */}
        <div className="relative px-6 pb-24 landscape:flex landscape:flex-col landscape:justify-center landscape:px-10 landscape:pb-16">
          <p className="text-[13px] tracking-wide text-[color:var(--accent)]">{nav.label}</p>
          <h2 className={`${serif} mt-3 text-[clamp(1.9rem,3.4vw,3.1rem)] font-light leading-[1.04]`}>
            {nav.title}
          </h2>
          {/* The intro, the note and the button give way on a short screen
              (a 768px laptop): the steps and the price are what this
              section is for, and the contact bar is always there. */}
          <p className="mt-4 max-w-[44ch] text-[15px] leading-relaxed text-[color:var(--muted)] portrait:hidden [@media(max-height:860px)]:hidden">
            {nav.body}
          </p>
          <ol className="mt-5 space-y-1 landscape:mt-7 landscape:space-y-2.5">
            {nav.steps.map((s, i) => {
              const active = i === step;
              const done = i < step;
              return (
                <li
                  key={s.title}
                  aria-current={active ? "step" : undefined}
                  className={`border-l-2 py-1 pl-4 transition-colors duration-500 ${
                    active
                      ? "border-[color:var(--accent)]"
                      : done
                        ? "border-[color:var(--accent)]/40"
                        : "border-[color:var(--hairline)]"
                  } ${active ? "" : "portrait:hidden"}`}
                >
                  <span
                    className={`block text-[12px] tabular-nums transition-colors duration-500 ${
                      active ? "text-[color:var(--accent)]" : "text-[color:var(--muted)]"
                    }`}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className={`block text-[16px] transition-opacity duration-500 ${active ? "opacity-100" : "opacity-55"}`}>
                    {s.title}
                  </span>
                  <span
                    className={`block overflow-hidden text-[14px] leading-relaxed text-[color:var(--muted)] transition-all duration-500 ${
                      active ? "max-h-24 opacity-100" : "max-h-0 opacity-0"
                    }`}
                  >
                    {s.detail}
                  </span>
                </li>
              );
            })}
          </ol>

          {/* The price, built up as the story reaches each part of it. Every
              row is in the page from the start, dimmed until its step, so it
              is readable without scrolling and to a screen reader. */}
          <dl className="mt-6 max-w-[30rem] border-t border-[color:var(--hairline)] pt-4 text-[14px] landscape:mt-8">
            {nav.prices.map((row) => {
              const lit = step >= row.from;
              return (
                <div
                  key={row.item}
                  className={`flex items-baseline justify-between gap-4 py-1.5 transition-opacity duration-500 ${
                    lit ? "opacity-100" : "opacity-35"
                  } ${lit && !totalShown ? "" : "portrait:hidden"}`}
                >
                  <dt>
                    {row.item}
                    {row.note && <span className="block text-[12px] text-[color:var(--muted)]">{row.note}</span>}
                  </dt>
                  <dd className="shrink-0 tabular-nums text-[color:var(--accent)]">{row.price}</dd>
                </div>
              );
            })}
            <div
              className={`mt-2 flex items-baseline justify-between gap-4 border-t border-[color:var(--hairline)] pt-3 transition-opacity duration-500 ${
                totalShown ? "opacity-100" : "opacity-35 portrait:hidden"
              }`}
            >
              <dt className="font-semibold">{nav.total.item}</dt>
              <dd className={`${serif} shrink-0 text-[clamp(1.4rem,2.2vw,1.9rem)] tabular-nums text-[color:var(--accent)]`}>
                {nav.total.price}
              </dd>
            </div>
          </dl>
          {nav.note && (
            <p className="mt-3 max-w-[44ch] text-[12px] leading-relaxed text-[color:var(--muted)] portrait:hidden [@media(max-height:860px)]:hidden">{nav.note}</p>
          )}

          {nav.cta && (
            <a
              href={ctaHref}
              className="mt-6 inline-flex h-12 w-fit items-center bg-[color:var(--accent)] px-6 text-[14px] font-semibold text-[#14161A] transition-colors hover:bg-[#E8C68A] portrait:hidden [@media(max-height:860px)]:hidden"
            >
              {nav.cta}
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
