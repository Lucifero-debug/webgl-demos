/*
  The bridge between the globe and the page's HTML layers. No three
  imports, so both sides can use it.

  Photos and day labels are HTML, which keeps them crisp and easy to style,
  but they must follow points on a moving globe. The scene projects those
  points to the screen every frame and writes them here; the page reads
  them in its own animation frame and moves its elements to match. Plain
  mutable objects, not React state: 60 updates a second through React
  would re-render the page for nothing.
*/

export type Anchor = {
  /** Viewport pixels. */
  x: number;
  y: number;
  /** On the side of the planet facing the camera, and on screen. */
  visible: boolean;
};

export const overlay = {
  anchors: new Map<string, Anchor>(),
};

export const anchorKey = {
  stop: (destinationId: string) => `stop:${destinationId}`,
  day: (destinationId: string, index: number) => `day:${destinationId}:${index}`,
};

/**
 * The explorable finale. The page writes (clicks, drags); the scene reads,
 * and flies the camera to match. Only acted on at the bottom of the page.
 */
export const explore = {
  /** A flight to ask for: a destination index, or home to the whole globe. */
  request: null as number | "home" | null,
  /** The destination the camera is at or flying to, if any. */
  selected: null as number | null,
  /** Drag offsets for the finale globe, in radians. */
  yaw: 0,
  pitch: 0,
  /** Leftover spin from a flick, in radians per frame; the scene decays it. */
  spin: 0,
  /** When the last drag happened (performance.now), to pause the slow turn. */
  lastDrag: 0,
};

/**
 * The story's beats: an opening, two per destination (arrive, then the
 * route), and a finale. Scroll position x runs from 0 to count - 1, one
 * unit per beat.
 */
export const beats = {
  arrive: (destination: number) => 1 + 2 * destination,
  route: (destination: number) => 2 + 2 * destination,
  count: (destinations: number) => 2 + 2 * destinations,
};
