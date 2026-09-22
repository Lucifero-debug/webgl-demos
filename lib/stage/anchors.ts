/*
  Screen positions of 3D points, shared between a scene and its page. No
  three imports, so both sides can use it.

  HTML labels stay crisp and easy to style, but they must follow points in
  a moving 3D scene. The scene projects those points to the screen every
  frame and writes them here; the page reads them in its own animation
  frame (see pinned.ts). Keys are namespaced per page: "stop:kyoto",
  "clinic:crown".
*/

export type Anchor = {
  /** Viewport pixels. */
  x: number;
  y: number;
  /** In front of the camera, facing it, and on screen. */
  visible: boolean;
};

export const anchors = new Map<string, Anchor>();

/** Writes an anchor, reusing its object so nothing is allocated per frame. */
export function setAnchor(key: string, x: number, y: number, visible: boolean) {
  const anchor = anchors.get(key);
  if (anchor) {
    anchor.x = x;
    anchor.y = y;
    anchor.visible = visible;
  } else {
    anchors.set(key, { x, y, visible });
  }
}
