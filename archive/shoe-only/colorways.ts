/**
 * Colourways for the Alder Runner.
 *
 * The shoe model ships its colourways inside the file, as glTF material
 * variants (KHR_materials_variants): each one is a complete textured
 * material made by the model's authors, not a tint applied in code.
 *
 * `variant` must match a variant name inside the GLB (case-insensitive).
 * Swatch colours were sampled from each variant's own base-colour texture.
 *
 * Each colourway also sets the mood of the whole page: backdrop, text and
 * accent. Backdrops are chosen for value contrast against the shoe, not
 * just to match it. The rose upper would vanish on a pale pink, so Dusty
 * Rose goes dark instead.
 */

export type Colorway = {
  id: string;
  name: string;
  code: string;
  variant: "midnight" | "beach" | "street";
  /** Main upper colour. */
  swatch: string;
  /** Secondary colour, shown as the corner of the chip. */
  accent: string;
  /** Page mood while this colourway is selected. */
  tone: "light" | "dark";
  backdrop: string;
  ink: string;
  muted: string;
  /** The short rule above the colourway name. */
  rule: string;
};

/**
 * First entry is the default. It matches the model's own default material,
 * so the first frame never flashes a different colourway.
 */
export const colorways: Colorway[] = [
  {
    id: "harbour-blue",
    name: "Harbour Blue",
    code: "01",
    variant: "midnight",
    swatch: "#126690",
    accent: "#2A2927",
    tone: "light",
    backdrop: "#D2DCE2",
    ink: "#0F1418",
    muted: "#52616C",
    rule: "#126690",
  },
  {
    id: "dusty-rose",
    name: "Dusty Rose",
    code: "02",
    variant: "beach",
    swatch: "#BA9695",
    accent: "#2A2927",
    tone: "dark",
    backdrop: "#2E1E21",
    ink: "#F4ECEA",
    muted: "#B39FA1",
    rule: "#D1ABA9",
  },
  {
    id: "carbon-red",
    name: "Carbon Red",
    code: "03",
    variant: "street",
    swatch: "#2A2A2A",
    accent: "#E3414E",
    tone: "light",
    backdrop: "#DCD9D4",
    ink: "#161515",
    muted: "#67635F",
    rule: "#E3414E",
  },
];
