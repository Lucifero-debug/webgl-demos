/**
 * The settings for one product showcase.
 *
 * Every client product is one of these plus a model file. The page, the 3D
 * scene, the scroll story and the colourway picker all build themselves
 * from it; nothing else in the code should need editing per client.
 *
 * See README.md, "Adding a client product", for the step-by-step.
 */

export type Vec3 = [number, number, number];

/**
 * A camera shot: where the camera stands, what it looks at, and where that
 * point sits on screen. Produce these with the shot helper (add ?shots to
 * the page URL in development) rather than by hand.
 */
export type Shot = {
  position: Vec3;
  target: Vec3;
  /**
   * Vertical field of view in degrees. Lower is a longer lens: 20 to 24
   * reads as product photography, 35+ starts to look like a phone camera.
   * On landscape screens narrower than the one the shots were framed on,
   * the scene widens this automatically so the product keeps the same share
   * of the width.
   */
  fov: number;
  /**
   * Where `target` sits on screen, as fractions of the frame, applied as a
   * lens shift. [0.2, 0] puts it 20% of the width right of centre; positive
   * y is up. Use it to move the product away from the chapter text.
   */
  offset?: [number, number];
};

/**
 * Landscape is required. Portrait (phones) is optional: without it, the
 * scene stands further back from the landscape shot and lifts the product
 * above the text, which is usually fine but worth checking.
 */
export type ShotPair = { landscape: Shot; portrait?: Shot };

/** The page's colours while a colourway is selected. */
export type Mood = {
  tone: "light" | "dark";
  backdrop: string;
  ink: string;
  muted: string;
  /** The short accent rule above the colourway name. */
  rule: string;
};

/**
 * How a colourway changes the model. Part names are matched against the
 * model's material names and mesh names; the shot helper lists them.
 *
 * - variant:  the model file has colourways built in (glTF material
 *             variants). Rare in client files.
 * - tint:     recolour named parts. Works best on parts with no colour
 *             texture, or a greyscale one, since the colour multiplies it.
 * - textures: swap the colour texture on named parts, one image per
 *             colourway. For patterned or printed surfaces.
 */
export type ColourMethod =
  | { method: "variant"; variant: string }
  | { method: "tint"; parts: Record<string, string> }
  | { method: "textures"; parts: Record<string, string> };

export type Colorway = {
  id: string;
  name: string;
  code: string;
  /** Chip colours: the main colour, and a secondary one for the corner. */
  swatch: string;
  accent: string;
  mood: Mood;
  apply: ColourMethod;
};

/**
 * Corrections applied to every material in the model. Client files often
 * need one: the demo shoe's fabric was marked as metal in its file, which
 * made it look like painted rubber until metalness was forced to 0.
 * Sheen gives fabric its soft glow at grazing angles; leave it out for
 * anything that isn't cloth.
 */
export type Surface = {
  metalness?: number;
  roughness?: number;
  sheen?: number;
  sheenRoughness?: number;
};

export type Chapter = {
  /** Small label above the headline, e.g. "The upper". */
  label: string;
  title: string;
  body: string;
  /** Which side the text sits on. Frame the shot on the other side. */
  align: "left" | "right";
  shot: ShotPair;
};

export type ShowcaseConfig = {
  brand: string;
  product: {
    name: string;
    /** Shown top right with the colourway code, e.g. "Runner 01". */
    line: string;
    eyebrow: string;
    tagline: string;
  };
  /** Licence credit for a third-party model. Required by CC BY licences. */
  credit?: string;
  /** Rendered with the poster button (?poster in development). */
  poster: string;
  model: {
    url: string;
    /**
     * Turn about the vertical axis, in radians, so the product faces the
     * camera the way you want in the hero view.
     */
    rotation: number;
    /** Size of the product's longest side, in scene units. */
    length: number;
    surface?: Surface;
  };
  /** The opening view, which the finale returns to. */
  hero: ShotPair;
  chapters: Chapter[];
  finale: { eyebrow: string };
  /** The first colourway is the default. */
  colorways: Colorway[];
};
