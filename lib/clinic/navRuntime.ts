/*
  Shared between the X-Nav section's page half (NavStory, which measures
  scroll) and its 3D half (NavScene, which reads it every frame). A plain
  mutable object, not React state, for the same reason as archRuntime.ts:
  the scene reads it 60 times a second.

  No three here, so the page component can import it.
*/
export const navRuntime = {
  /** 0 when the section reaches the top of the screen, 1 when it is scrolled through. */
  progress: 0,
  /** Whether the section is on screen; the scene stops drawing when it is not. */
  visible: false,
};

/**
 * Where each step of the story starts, 0 to 1. Text and model both follow
 * these (see poseNav in components/clinic/navModel.ts):
 *   planned in 3D, navigated drilling, implant placed, zirconia crown.
 */
export const NAV_STEPS = [0, 0.2, 0.5, 0.74];
