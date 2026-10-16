/*
  Shared between the robotic full-mouth section's page half (RoboticStory,
  which measures scroll) and its 3D half (RobotScene, which reads it every
  frame). A plain mutable object, not React state, as archRuntime.ts.

  No three here, so the page component can import it.
*/
export const robotRuntime = {
  /** 0 when the section reaches the top of the screen, 1 when it is scrolled through. */
  progress: 0,
  /** Whether the section is on screen; the scene stops drawing when it is not. */
  visible: false,
};

/**
 * Where each step of the story starts, 0 to 1. Text and model both follow
 * these (see poseRobot in components/clinic/robotModel.ts):
 *   scanned and planned, robotic placement, titanium frames, zirconia.
 */
export const ROBOT_STEPS = [0, 0.2, 0.58, 0.76];
