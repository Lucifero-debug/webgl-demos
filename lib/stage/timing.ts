/*
  Story timing in plain numbers. No three imports, so page components can
  use it too; lens.ts re-exports dwell for the scenes.
*/

/**
 * Holds still near each shot and moves between them: the camera rests on a
 * subject while its text is read, then glides on. Smoothstep, so it eases
 * out of one shot and into the next.
 */
export function dwell(t: number) {
  const x = Math.min(1, Math.max(0, (t - 0.15) / 0.7));
  return x * x * (3 - 2 * x);
}

/** Smoothstep between edge0 and edge1. */
export function smooth(edge0: number, edge1: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}
