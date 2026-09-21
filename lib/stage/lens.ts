import * as THREE from "three";

export { dwell } from "./timing";

/*
  Camera helpers shared by every 3D scroll story (the product showcase and
  the travel globe). Imports three, so only import this from scene files,
  which are loaded lazily; never from a page component.
*/

/**
 * The screen shape shots are framed on. Landscape screens narrower than this
 * widen the lens to keep the same horizontal coverage, so the subject keeps
 * its share of the width and stays clear of side-column text.
 */
export const REF_ASPECT = 2.07;

export function effectiveFov(fov: number, aspect: number) {
  if (aspect < 1 || aspect >= REF_ASPECT) return fov;
  const half = THREE.MathUtils.degToRad(fov) / 2;
  return THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(half) * (REF_ASPECT / aspect)));
}

/**
 * Field of view plus a lens shift. setViewOffset moves the rendered window
 * across a larger virtual frame, which moves the subject on screen without
 * turning the camera, so perspective stays true and the shift is the same
 * fraction of the frame on every screen size. ox > 0 moves the subject
 * right, oy > 0 moves it up.
 */
export function applyLens(
  camera: THREE.PerspectiveCamera,
  fov: number,
  ox: number,
  oy: number,
  width: number,
  height: number,
) {
  camera.fov = effectiveFov(fov, width / height);
  camera.setViewOffset(width, height, -ox * width, oy * height, width, height);
}
