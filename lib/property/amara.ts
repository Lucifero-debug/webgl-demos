import type { PropertyConfig } from "./types";

/**
 * Amara Rise: the property demo. A fictional development by a fictional
 * developer, written to show the problem 3D actually solves in this market.
 * Buyers are asked to commit to a flat that does not exist yet, from a
 * static render and a PDF floor plan.
 *
 * Prices are plausible for Delhi NCR in 2026 and are illustrative only,
 * which the note at the end says plainly.
 */
export const amara: PropertyConfig = {
  brand: "Amara",
  project: "Amara Rise",
  poster: "/posters/amara.webp",
  hero: {
    eyebrow: "Sector 84, Gurugram",
    title: "Eighteen floors. Ninety-six homes.",
    tagline:
      "A tower you can look at from every side before a single wall goes up. Scroll to take it apart.",
    cta: "Book a site visit",
  },
  stack: {
    label: "How it stacks up",
    title: "What sits on what.",
    body: "Shops and parking at the base, homes above, and a roof that belongs to everyone who lives here.",
  },
  beats: [
    {
      kind: "floor",
      floor: 6,
      label: "A typical floor",
      title: "Four homes to a floor.",
      body: "Two lifts and a single stair in the middle, so no home shares more than one wall with another, and every one gets light on two sides.",
      units: [
        { label: "Type A", size: "2 BHK, 1,180 sq ft", span: [0, 0.5] },
        { label: "Type B", size: "3 BHK, 1,640 sq ft", span: [0.5, 1] },
      ],
      align: "left",
    },
    {
      kind: "view",
      floor: 12,
      label: "The view",
      title: "What the twelfth floor sees.",
      body: "High enough to clear everything around it. This is the line of sight from the balcony, not an artist's impression of it.",
      align: "right",
    },
    {
      kind: "amenities",
      label: "The roof",
      title: "The best floor isn't for sale.",
      body: "The top of the building stays common: a pool, a deck and a pavilion, instead of two more penthouses.",
      items: ["25 m lap pool", "Shaded deck", "Gym pavilion", "Children's lawn"],
      align: "left",
    },
  ],
  pricing: {
    eyebrow: "What it costs",
    title: "Prices, per home.",
    rows: [
      { label: "Type A", detail: "2 BHK, 1,180 sq ft", price: "₹1.42 Cr" },
      { label: "Type B", detail: "3 BHK, 1,640 sq ft", price: "₹1.98 Cr" },
      { label: "Penthouse", detail: "4 BHK duplex, 2,900 sq ft", price: "₹3.75 Cr" },
    ],
    cta: "Book a site visit",
    note: "Indicative prices, exclusive of registration and other charges. Floor plans and areas are subject to approval.",
  },
  ctaHref: "#enquire",
  /*
    A real sky. Download a Poly Haven pure-sky HDRI (CC0) and put it here;
    until the file exists, the scene falls back to the sky drawn in code.
  */
  hdri: "/hdri/sky.hdr",
  surfaces: {
    // Colour maps only for now. Add `normal: "/textures/site/concrete-normal.webp"`
    // once the normal maps are downloaded: a named file that does not exist
    // fails the whole scene, not just the detail.
    concrete: { map: "/textures/site/concrete.webp", repeat: 2 },
    grass: { map: "/textures/site/grass.webp", repeat: 16 },
  },
  gallery: {
    label: "The neighbourhood",
    title: "What the area already looks like.",
    body: "The building is still drawings. Everything around it is not, so these are photographs rather than renders.",
    items: [
      { src: "/photos/amara-1.webp", alt: "A tree-lined street", caption: "Sector 84, two minutes away" },
      { src: "/photos/amara-2.webp", alt: "A living room with tall windows", caption: "A Type B living room, as specified" },
      { src: "/photos/amara-3.webp", alt: "A rooftop pool at dusk", caption: "The roof deck, as planned" },
    ],
  },
  plans: {
    label: "Floor plans",
    title: "Two layouts, no wasted corridor.",
    body: "Every home is a corner home. Living rooms face the long balconies; bedrooms sit away from the lift core.",
    items: [
      {
        id: "type-a",
        name: "Type A",
        size: "2 BHK, 1,180 sq ft",
        price: "₹1.42 Cr",
        rooms: [
          { label: "Living", x: 4, y: 30, w: 44, h: 42 },
          { label: "Balcony", x: 4, y: 74, w: 44, h: 16, kind: "balcony" },
          { label: "Kitchen", x: 4, y: 6, w: 28, h: 22, kind: "wet" },
          { label: "Bed 1", x: 52, y: 6, w: 44, h: 38 },
          { label: "Bed 2", x: 52, y: 48, w: 44, h: 30 },
          { label: "Bath", x: 34, y: 6, w: 14, h: 22, kind: "wet" },
          { label: "Bath", x: 52, y: 80, w: 20, h: 14, kind: "wet" },
        ],
      },
      {
        id: "type-b",
        name: "Type B",
        size: "3 BHK, 1,640 sq ft",
        price: "₹1.98 Cr",
        rooms: [
          { label: "Living", x: 4, y: 26, w: 46, h: 46 },
          { label: "Balcony", x: 4, y: 76, w: 60, h: 16, kind: "balcony" },
          { label: "Kitchen", x: 4, y: 4, w: 30, h: 18, kind: "wet" },
          { label: "Utility", x: 36, y: 4, w: 14, h: 18, kind: "wet" },
          { label: "Bed 1", x: 54, y: 4, w: 42, h: 32 },
          { label: "Bed 2", x: 54, y: 40, w: 42, h: 24 },
          { label: "Bed 3", x: 54, y: 68, w: 42, h: 24 },
          { label: "Bath", x: 30, y: 62, w: 18, h: 12, kind: "wet" },
        ],
      },
    ],
  },
  specs: {
    label: "Specifications",
    title: "What it is made of.",
    groups: [
      {
        heading: "Structure",
        lines: ["RCC frame, seismic zone IV compliant", "AAC block walls", "Podium parking for 140 cars"],
      },
      {
        heading: "Flooring",
        lines: ["1200 x 600 vitrified tile in living and bedrooms", "Anti-skid tile in bathrooms and balconies"],
      },
      {
        heading: "Kitchen",
        lines: ["Granite counter with stainless sink", "Tiled dado to 2 ft", "Provision for chimney and water purifier"],
      },
      {
        heading: "Doors and windows",
        lines: ["Engineered hardwood main door", "UPVC double-glazed windows", "Toughened glass balcony rails"],
      },
      {
        heading: "Power and water",
        lines: ["100% DG backup for common areas", "5 kW per home", "Rainwater harvesting and STP"],
      },
      {
        heading: "Lifts and safety",
        lines: ["Two passenger lifts and one service lift per core", "Sprinklers and smoke detectors throughout"],
      },
    ],
  },
  location: {
    label: "Location",
    title: "Sector 84, and what's around it.",
    body: "Off the Dwarka Expressway, with the metro extension under construction and the airport a straight run down the expressway.",
    places: [
      { name: "Dwarka Expressway", distance: "0.8 km", minutes: "3 min" },
      { name: "Sector 83 market", distance: "1.6 km", minutes: "6 min" },
      { name: "Metro (under construction)", distance: "2.4 km", minutes: "8 min" },
      { name: "Delhi airport, Terminal 3", distance: "27 km", minutes: "38 min" },
      { name: "Cyber City", distance: "21 km", minutes: "34 min" },
    ],
  },
  enquiry: {
    label: "Enquire",
    title: "Come and see the site.",
    body: "Leave your details and someone from the sales team will call to arrange a visit.",
    cta: "Request a call back",
    note: "This is a demonstration page. The form does not send anything, and no details are stored.",
  },
  footer: {
    rera: "RERA registration: not applicable, this is a demonstration project.",
    lines: [
      "Amara Rise is fictional. Everything on this page was built to show what a 3D property page can do.",
      "Plans, areas and prices are illustrative. Nothing here is an offer or an invitation to offer.",
    ],
  },
  tower: {
    floors: 18,
    width: 3.4,
    depth: 2.2,
    podiumSpread: 1.5,
    podiumFloors: 2,
    balconyDepth: 0.45,
    bands: [
      { id: "podium", label: "Arrival", detail: "Shops, lobby and parking", from: 0, to: 1, tone: "base" },
      { id: "two-bed", label: "Two-bedroom homes", detail: "Floors 3 to 9", from: 2, to: 8, tone: "home" },
      { id: "three-bed", label: "Three-bedroom homes", detail: "Floors 10 to 15", from: 9, to: 14, tone: "home" },
      { id: "penthouse", label: "Penthouses", detail: "Floors 16 to 18", from: 15, to: 17, tone: "home" },
    ],
  },
  note: "Amara Rise is a fictional development, built to demonstrate what a 3D property page can do. Nothing here is an offer.",
};
