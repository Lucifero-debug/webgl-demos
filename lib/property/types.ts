/**
 * Settings for a property explainer: a scroll story around a building that
 * separates into its floors, with a close-up on a typical floor, the view
 * from a balcony, the roof amenities, and what it costs.
 *
 * The building is built in code from the spec below, so there is no model
 * to license and no photography to clear. It reads as an architect's
 * massing model rather than a photoreal render, which is both honest about
 * what it is (the building does not exist yet) and achievable in a browser.
 *
 * One floor is one unit of height in the scene, so a 18-floor tower is 18
 * units tall and every camera distance below is in floors.
 */

export type Band = {
  id: string;
  /** Label drawn to this part of the building while it is separated. */
  label: string;
  detail: string;
  /** Floors this band covers, counting from 0 at the ground, inclusive. */
  from: number;
  to: number;
  /** Warm accent for the homes, cool grey for podium and roof. */
  tone: "home" | "base";
};

export type PropertyBeat =
  | {
      kind: "floor";
      /** Which floor to look at, and how its homes are laid out. */
      floor: number;
      units: { label: string; size: string; span: [start: number, end: number] }[];
      label: string;
      title: string;
      body: string;
      align: "left" | "right";
    }
  | {
      kind: "view";
      /** The camera stands on this floor's balcony and looks out. */
      floor: number;
      label: string;
      title: string;
      body: string;
      align: "left" | "right";
    }
  | {
      kind: "amenities";
      label: string;
      title: string;
      body: string;
      items: string[];
      align: "left" | "right";
    };

export type TowerSpec = {
  floors: number;
  /** Plan size, in floors, so the proportions stay readable. */
  width: number;
  depth: number;
  /** How far the podium oversails the tower, each side. */
  podiumSpread: number;
  podiumFloors: number;
  /** Balconies on the long faces of the residential floors. */
  balconyDepth: number;
  bands: Band[];
};

/**
 * A home's plan, drawn as SVG from rooms placed on a 100 x 100 grid. Data
 * rather than an uploaded image, so a developer's own layouts can be
 * described here and stay crisp at any size.
 */
export type Plan = {
  id: string;
  name: string;
  size: string;
  price: string;
  rooms: { label: string; x: number; y: number; w: number; h: number; kind?: "room" | "wet" | "balcony" }[];
};

export type PropertyConfig = {
  /** The developer. */
  brand: string;
  /** The development. */
  project: string;
  poster: string;
  hero: { eyebrow: string; title: string; tagline: string; cta: string };
  /** The beat where the building comes apart. */
  stack: { label: string; title: string; body: string };
  beats: PropertyBeat[];
  pricing: {
    eyebrow: string;
    title: string;
    rows: { label: string; detail?: string; price: string }[];
    cta: string;
    note: string;
  };
  /** Where every button goes. */
  ctaHref: string;
  tower: TowerSpec;
  /**
   * A real sky, from an HDRI: true light and true reflections in the
   * glass, which is the single biggest step a real-time scene can take
   * towards looking photographed. Leave it out and the scene falls back to
   * a sky drawn in code. Poly Haven publishes these under CC0.
   */
  hdri?: string;
  /**
   * Photographed surfaces, same idea: flat colours read as plastic.
   * Each map is optional and the scene copes without them.
   */
  surfaces?: {
    concrete?: { map: string; normal?: string; repeat?: number };
    grass?: { map: string; normal?: string; repeat?: number };
  };
  /**
   * Photographs, where photographs belong. The 3D explains the building;
   * pictures sell the feeling of living in it, and a real client hands you
   * their own. CC0 or licensed images only.
   */
  gallery?: {
    label: string;
    title: string;
    body?: string;
    items: { src: string; alt: string; caption: string }[];
  };
  /** The ordinary page below the 3D story. */
  plans: { label: string; title: string; body: string; items: Plan[] };
  specs: { label: string; title: string; groups: { heading: string; lines: string[] }[] };
  location: {
    label: string;
    title: string;
    body: string;
    /** Distances shown on a simple diagram, nearest first. */
    places: { name: string; distance: string; minutes: string }[];
  };
  enquiry: {
    label: string;
    title: string;
    body: string;
    cta: string;
    /** Shown under the form: this demo does not send anything. */
    note: string;
  };
  footer: { rera: string; lines: string[] };
  /** Shown small in the last beat. */
  note: string;
};
