"use client";

import { useEffect, useRef, type RefObject } from "react";
import { anchors } from "./anchors";

/*
  Page-side hooks for HTML pinned to 3D points. No three imports, so they
  are safe in page components.
*/

/** Runs a callback every animation frame, for as long as the component lives. */
export function useFrameLoop(callback: () => void) {
  const latest = useRef(callback);
  latest.current = callback;
  useEffect(() => {
    let id = 0;
    const loop = () => {
      latest.current();
      id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, []);
}

/**
 * Keeps an element on an anchor: moved there every frame, and shown only
 * while `active` and while the point is visible. With `clickable`, it also
 * only takes clicks while shown. Give the element a CSS opacity transition
 * to smooth the showing and hiding.
 */
export function usePinned(
  el: RefObject<HTMLElement | null>,
  key: string,
  active: boolean,
  clickable = false,
) {
  useFrameLoop(() => {
    const node = el.current;
    const anchor = anchors.get(key);
    if (!node || !anchor) return;
    const shown = active && anchor.visible;
    node.style.transform = `translate3d(${anchor.x}px, ${anchor.y}px, 0)`;
    node.style.opacity = shown ? "1" : "0";
    if (clickable) node.style.pointerEvents = shown ? "auto" : "none";
  });
}
