"use client";

import { useEffect, useRef } from "react";

/*
  Recording mode: a page that performs itself, for demo videos.

  Open any demo with ?record in the URL and press Space. The page then
  plays its own choreographed take: it glides to each beat at a steady,
  readable pace, pauses on it, and performs its interactions (colourways,
  drags, picks) by itself. The cursor and scrollbar are hidden. Every take
  is identical, so a recording is just: start the recorder, press Space,
  stop the recorder.

  Works in production too, which is where recordings should be made: the
  development build runs slower and can show its own overlay.
*/

/** Thrown to stop a performance when the page is left mid-take. */
class Stopped extends Error {}

export type Director = {
  wait(ms: number): Promise<void>;
  /** Glides to beat i (one screen per beat), eased in and out. */
  toBeat(i: number, ms?: number): Promise<void>;
  /**
   * A smooth horizontal drag across the middle of an element, sent as a
   * stream of small pointer moves the way a real mouse drag arrives.
   */
  drag(el: Element, dx: number, ms?: number): Promise<void>;
};

const ease = (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);

function makeDirector(stopped: () => boolean): Director {
  const frame = () =>
    new Promise<number>((resolve, reject) =>
      requestAnimationFrame((now) => (stopped() ? reject(new Stopped()) : resolve(now))),
    );

  const wait = (ms: number) =>
    new Promise<void>((resolve, reject) =>
      window.setTimeout(() => (stopped() ? reject(new Stopped()) : resolve()), ms),
    );

  const toBeat = async (i: number, ms = 1900) => {
    const from = window.scrollY;
    const to = i * window.innerHeight;
    const start = await frame();
    for (let now = start; now - start < ms; now = await frame()) {
      window.scrollTo(0, from + (to - from) * ease((now - start) / ms));
    }
    window.scrollTo(0, to);
  };

  const drag = async (el: Element, dx: number, ms = 2200) => {
    const box = el.getBoundingClientRect();
    const x0 = box.left + box.width / 2 - dx / 2;
    const y = box.top + box.height / 2;
    const send = (type: string, x: number, buttons: number) =>
      el.dispatchEvent(
        new PointerEvent(type, {
          clientX: x,
          clientY: y,
          pointerId: 1,
          pointerType: "mouse",
          isPrimary: true,
          button: 0,
          buttons,
          bubbles: true,
        }),
      );
    send("pointerdown", x0, 1);
    const start = await frame();
    let now = start;
    for (; now - start < ms; now = await frame()) {
      send("pointermove", x0 + dx * ease((now - start) / ms), 1);
    }
    send("pointerup", x0 + dx, 0);
  };

  return { wait, toBeat, drag };
}

/**
 * Arms recording mode for this page when ?record is in the URL. The
 * performance starts on Space, so the recorder can be running first.
 */
export function useDirector(perform: (director: Director) => Promise<void>) {
  const latest = useRef(perform);
  latest.current = perform;

  useEffect(() => {
    if (!new URLSearchParams(window.location.search).has("record")) return;
    const root = document.documentElement;
    root.classList.add("recording");
    let stopped = false;
    let running = false;

    const onKey = (event: KeyboardEvent) => {
      if (event.code !== "Space") return;
      // Space would otherwise scroll the page a screen down.
      event.preventDefault();
      if (running) return;
      running = true;
      window.scrollTo(0, 0);
      latest.current(makeDirector(() => stopped)).catch((error) => {
        if (!(error instanceof Stopped)) console.error("[director]", error);
      });
    };

    window.addEventListener("keydown", onKey);
    return () => {
      stopped = true;
      window.removeEventListener("keydown", onKey);
      root.classList.remove("recording");
    };
  }, []);
}
