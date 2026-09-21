"use client";

import Lenis from "lenis";
import { useEffect, useState } from "react";
import { runtime } from "@/lib/showcase/runtime";

/*
  Page-side plumbing shared by every 3D scroll story. No three imports, so
  these are safe in page components.
*/

/**
 * Smooth scrolling, plus scroll progress fed to the 3D scene through
 * runtime.progress. Lenis still scrolls the real page, so native scroll
 * events and IntersectionObservers keep working. Skipped for reduced motion.
 *
 * Returns the nearest section (0 to sections - 1), whether the scroll is
 * settled on it (within the stretch where the camera rests on that
 * section's shot rather than travelling), and whether the page is at the
 * very bottom. All are React state, but they only change when their value
 * does, not on every scroll event.
 */
export function useScrollStory(sections: number, enabled = true) {
  const [section, setSection] = useState(0);
  const [settled, setSettled] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const lenis = reduce ? null : new Lenis({ autoRaf: true, lerp: 0.085 });

    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progress = max > 0 ? window.scrollY / max : 0;
      runtime.progress = progress;
      const x = progress * (sections - 1);
      const nearest = Math.round(x);
      setSection(nearest);
      // The camera rests within 0.15 of each shot (see dwell in lens.ts);
      // a little wider here so text is up just as it settles.
      setSettled(Math.abs(x - nearest) < 0.3);
      setAtEnd(progress > 0.985);
    };

    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();

    return () => {
      lenis?.destroy();
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      runtime.progress = 0;
    };
  }, [enabled, sections]);

  return { section, settled, atEnd };
}

/**
 * A section's text shows while that section fills at least half the
 * screen. Sections are a screen tall, so exactly one qualifies at a time.
 *
 * Mark each section with data-chapter and its text block with data-reveal;
 * the rise-in styles live in globals.css. intersectionRatio, not
 * isIntersecting, which is true for any overlap at all.
 */
export function useReveal(enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          entry.target
            .querySelector("[data-reveal]")
            ?.setAttribute("data-shown", String(entry.intersectionRatio >= 0.5));
        }
      },
      { threshold: [0, 0.5, 1] },
    );
    document.querySelectorAll("[data-chapter]").forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [enabled]);
}
