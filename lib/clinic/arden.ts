import type { ClinicConfig } from "./types";

/**
 * Arden Dental: the clinic demo. A fictional implant clinic.
 *
 * The medical copy is deliberately general: typical timelines and what each
 * part is made of, never guarantees or outcome statistics. That is what a
 * real clinic's compliance review would ask for, and invented figures on a
 * public demo would be a liability.
 */
export const arden: ClinicConfig = {
  brand: "Arden Dental",
  poster: "/posters/arden.webp",
  hero: {
    eyebrow: "Dental implants",
    title: "A new tooth that feels like your own.",
    tagline:
      "A single implant replaces a missing tooth, root and all. Here is what goes into one.",
    cta: "Book a consultation",
  },
  explode: {
    label: "How it works",
    title: "Three parts, one tooth.",
    body: "A titanium root in the bone, a connector at the gum line, and a crown you see and chew with. Each is made for you.",
  },
  callouts: {
    crown: { name: "Crown", detail: "Zirconia, colour-matched" },
    abutment: { name: "Abutment", detail: "Connects root to crown" },
    implant: { name: "Implant", detail: "Grade 5 titanium" },
  },
  parts: [
    {
      part: "implant",
      label: "The implant",
      title: "A titanium root that bonds with bone.",
      body: "Placed in the jaw where the old root was. Over the following weeks the bone grows onto its surface and holds it the way it held the tooth.",
      specs: ["Grade 5 titanium", "4.1 mm by 10 mm", "Placed under local anaesthetic"],
      align: "left",
    },
    {
      part: "abutment",
      label: "The abutment",
      title: "The connector, shaped to your gum.",
      body: "It screws into the implant and rises through the gum, giving the crown something firm and exactly shaped to sit on.",
      specs: ["Titanium, gold-anodised", "Fitted once the implant has healed"],
      align: "right",
    },
    {
      part: "crown",
      label: "The crown",
      title: "Shaded to match the teeth beside it.",
      body: "Milled from zirconia from a 3D scan of your mouth, then shade-matched by hand so it disappears among your own teeth.",
      specs: ["Zirconia", "Made from a 3D scan", "Colour-matched by hand"],
      align: "left",
    },
  ],
  finale: {
    eyebrow: "What to expect",
    title: "From first visit to new tooth.",
    steps: [
      { when: "Day 1", title: "Consultation and 3D scan", detail: "We check the bone and plan the implant." },
      { when: "Week 2", title: "Implant placed", detail: "Usually about an hour, under local anaesthetic." },
      { when: "8 to 12 weeks", title: "Healing", detail: "The bone bonds with the implant." },
      { when: "After healing", title: "Crown fitted", detail: "The abutment and crown go on." },
    ],
    cta: "Book a consultation",
  },
  clinic: {
    address: "18 Marlow Road, London",
    phone: "020 7946 0182",
    timeZone: "Europe/London",
    hours: [
      null,
      ["08:00", "19:00"],
      ["08:00", "19:00"],
      ["08:00", "19:00"],
      ["08:00", "19:00"],
      ["08:00", "17:00"],
      ["09:00", "14:00"],
    ],
  },
  note: "Arden Dental is a fictional clinic. This page is a design demonstration, not medical advice.",
};
