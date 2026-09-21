/**
 * Scroll progress shared between the page and the 3D scene.
 *
 * A plain mutable object rather than React state on purpose: the scene
 * reads it every animation frame, and pushing 60 updates a second through
 * React would re-render the whole page for nothing.
 *
 * progress: 0 at the top of the page, 1 at the bottom.
 */
export const scroll = { progress: 0 };
