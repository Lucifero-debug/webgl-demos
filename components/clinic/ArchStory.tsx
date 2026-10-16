"use client";

import { lazy, useEffect, useMemo, useRef, useState } from "react";
import CanvasStage, { type CameraSetup } from "@/components/CanvasStage";
import type { ClinicConfig } from "@/lib/clinic/types";
import { ARCH_STEPS, archRuntime } from "@/lib/clinic/archRuntime";

/**
 * The full-arch scene, fetched only when its canvas mounts. A plain import
 * would pull Three.js into the page's first download.
 */
const ArchScene = lazy(() => import("@/components/clinic/ArchScene"));

/*
  The full-arch story ("All-on-4"), as its own scroll section below the
  single-implant story: the section is several screens tall, its inside is
  sticky, and scrolling through it builds the arch in 3D while the steps
  beside it light up in turn.

  The page half: measures scroll into archRuntime, which the scene reads.
  Must not import three (see the boundary in PROJECT-CONTEXT.md).
*/

const serif = "font-[family-name:var(--font-serif)]";

export default function ArchStory({
  arch,
  ctaHref,
}: {
  arch: NonNullable<ClinicConfig["arch"]>;
  ctaHref: string;
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
      archRuntime.progress = p;
      let current = 0;
      ARCH_STEPS.forEach((start, i) => {
        if (p >= start) current = i;
      });
      setStep(current); // React skips the render when it is unchanged
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    const observer = new IntersectionObserver(([entry]) => {
      archRuntime.visible = entry.isIntersecting;
    });
    observer.observe(node);
    measure();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      observer.disconnect();
      archRuntime.visible = false;
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  const camera = useMemo<CameraSetup>(() => ({ position: [5, 6, 8], fov: 30 }), []);

  return (
    <section
      ref={section}
      aria-label={arch.title}
      className="relative border-t border-[color:var(--hairline)]"
      // One screen to arrive, then one per step: long enough to read each.
      style={{ height: `${100 + arch.steps.length * 70}svh` }}
    >
      <div className="sticky top-0 grid h-svh grid-rows-[1fr_auto] overflow-hidden landscape:grid-cols-[1.2fr_0.8fr] landscape:grid-rows-1">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(45%_55%_at_35%_50%,rgba(217,179,108,0.13)_0%,rgba(217,179,108,0)_70%)]" />
        <div className="relative min-h-0">
          <CanvasStage
            camera={camera}
            frameloop="demand"
            deferUntilNear
            posterFit="contain"
            poster={arch.poster}
            posterAlt="Full-arch implants in 3D: four implants and a fixed bridge"
          >
            <ArchScene />
          </CanvasStage>
        </div>

        <div className="relative px-6 pb-10 landscape:flex landscape:flex-col landscape:justify-center landscape:px-10 landscape:pb-0">
          <p className="text-[13px] tracking-wide text-[color:var(--accent)]">{arch.label}</p>
          <h2 className={`${serif} mt-3 text-[clamp(1.9rem,3.4vw,3.1rem)] font-light leading-[1.04]`}>
            {arch.title}
          </h2>
          <p className="mt-4 max-w-[44ch] text-[15px] leading-relaxed text-[color:var(--muted)] portrait:hidden">
            {arch.body}
          </p>
          <ol className="mt-6 space-y-1 landscape:mt-9 landscape:space-y-3">
            {arch.steps.map((s, i) => {
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
          {arch.cta && (
            <a
              href={ctaHref}
              className="mt-8 inline-flex h-12 w-fit items-center bg-[color:var(--accent)] px-6 text-[14px] font-semibold text-[#14161A] transition-colors hover:bg-[#E8C68A] portrait:hidden"
            >
              {arch.cta}
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
