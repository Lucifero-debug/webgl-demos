import type { ShowcaseConfig } from "./types";

/**
 * Alder Runner: the demo product.
 *
 * Alder is a fictional brand. The shoe is Shopify's Materials Variants Shoe
 * (CC BY 4.0), whose colourways live inside the file as material variants.
 *
 * Chapter shots were framed against the model and checked on screens from
 * 1280x680 to 2400x1000 and on a phone, so the product never sits under
 * the chapter text or the header.
 */
export const alderRunner: ShowcaseConfig = {
  brand: "Alder",
  product: {
    name: "Alder Runner",
    line: "Runner",
    eyebrow: "The daily trainer",
    tagline: "Light, soft, and made for everyday miles.",
  },
  credit: "Shoe model by Shopify, CC BY 4.0",
  poster: "/posters/alder-runner.webp",

  model: {
    url: "/models/shoe.glb",
    // The file's toe points along +X. Pi turns it left; the extra 0.55
    // brings it round towards the camera for a three-quarter view.
    rotation: Math.PI + 0.55,
    length: 1.35,
    // The file marks the knit as ~60% metal. Cloth is not metal.
    surface: { metalness: 0, sheen: 0.6, sheenRoughness: 0.8 },
  },

  hero: {
    landscape: { position: [0, 0.675, 3.17], target: [0, 0, 0], fov: 24 },
  },

  chapters: [
    {
      label: "The upper",
      title: "One seamless knit.",
      body: "Knitted as a single piece, so there are no seams to rub. It moves with your foot instead of against it.",
      align: "left",
      shot: {
        landscape: {
          position: [0.182, 0.891, 2.433],
          target: [-0.125, 0.02, 0.217],
          fov: 20,
          offset: [0.16, -0.14],
        },
        portrait: {
          position: [0.335, 1.326, 3.54],
          target: [-0.125, 0.02, 0.217],
          fov: 20,
          offset: [0, 0.2],
        },
      },
    },
    {
      label: "The midsole",
      title: "Soft on mile one. Soft on mile ten.",
      body: "Full-length foam that keeps its bounce long after the first run.",
      align: "right",
      shot: {
        landscape: {
          position: [1.884, 0.003, 1.916],
          target: [0.105, -0.19, 0.171],
          fov: 20,
          offset: [-0.2, -0.24],
        },
        portrait: {
          position: [2.773, 0.1, 2.789],
          target: [0.105, -0.19, 0.171],
          fov: 20,
          offset: [0, 0],
        },
      },
    },
    {
      label: "The heel",
      title: "Locked in, never pinched.",
      body: "A padded collar and a pull tab, so it goes on in a second and stays put.",
      align: "left",
      shot: {
        landscape: {
          position: [2.833, 0.843, -0.123],
          target: [0.495, 0.12, -0.245],
          fov: 20,
          offset: [0.16, 0],
        },
        portrait: {
          position: [4.001, 1.205, -0.061],
          target: [0.495, 0.12, -0.245],
          fov: 20,
          offset: [0, 0.2],
        },
      },
    },
  ],

  finale: { eyebrow: "Choose your colourway" },

  colorways: [
    {
      id: "harbour-blue",
      name: "Harbour Blue",
      code: "01",
      swatch: "#126690",
      accent: "#2A2927",
      mood: {
        tone: "light",
        backdrop: "#D2DCE2",
        ink: "#0F1418",
        muted: "#52616C",
        rule: "#126690",
      },
      apply: { method: "variant", variant: "midnight" },
    },
    {
      id: "dusty-rose",
      name: "Dusty Rose",
      code: "02",
      swatch: "#BA9695",
      accent: "#2A2927",
      mood: {
        tone: "dark",
        backdrop: "#2E1E21",
        ink: "#F4ECEA",
        muted: "#B39FA1",
        rule: "#D1ABA9",
      },
      apply: { method: "variant", variant: "beach" },
    },
    {
      id: "carbon-red",
      name: "Carbon Red",
      code: "03",
      swatch: "#2A2A2A",
      accent: "#E3414E",
      mood: {
        tone: "light",
        backdrop: "#DCD9D4",
        ink: "#161515",
        muted: "#67635F",
        rule: "#E3414E",
      },
      apply: { method: "variant", variant: "street" },
    },
  ],
};
