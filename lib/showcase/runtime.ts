import type { Vec3 } from "./types";

/**
 * State shared between the page and the 3D scene.
 *
 * A plain mutable object rather than React state on purpose: the scene
 * reads it every animation frame, and pushing 60 updates a second through
 * React would re-render the whole page for nothing.
 */
export const runtime = {
  /** Scroll progress: 0 at the top of the page, 1 at the bottom. */
  progress: 0,

  /** The shot helper (development only, ?shots in the URL). */
  helper: {
    active: false,
    /** Set by the panel's sliders, applied by the scene. */
    fov: 24,
    offset: [0, 0] as [number, number],
    /** Written by the scene every frame for the panel to read out. */
    position: [0, 0, 0] as Vec3,
    target: [0, 0, 0] as Vec3,
    /**
     * Set by the panel to jump to a configured shot: -1 for the hero, or a
     * chapter index. The scene applies it and clears it.
     */
    jump: null as number | null,
    /** Material and mesh names in the model, for writing colourways. */
    parts: [] as string[],
  },
};
