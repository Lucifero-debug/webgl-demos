import type { ClinicConfig } from "./types";

/*
  Dr. Rajat Sachdeva's implant clinic, Ashok Vihar (dentalimplantindia.co.in).

  Every clinical claim and price below is marked CONFIRM until he has
  approved it in writing. They are drafted from his own website so he has
  something concrete to correct, but nothing here goes live in his name
  until he has read it: the prices change, and dental advertising rules in
  India are strict about what a clinic may promise.

  Ask him for:
  - the implant system and size he places most often (the 3D model matches it)
  - logo and brand colours
  - the current prices, by email, so they are his words not his website's
  - whether he wants a line saying treatment depends on individual assessment
  - what he explains to every patient in person that the page should cover
*/
export const sachdeva: ClinicConfig = {
  // CONFIRM: the clinic's name exactly as he writes it.
  brand: "Dental Implant India",
  poster: "/posters/sachdeva.webp",
  hero: {
    eyebrow: "Dental implants",
    title: "A tooth that's fixed in place.",
    tagline:
      "An implant replaces the root as well as the tooth, so it bites and chews like the one you lost. Here is what goes into one.",
    cta: "Book a consultation",
  },
  explode: {
    label: "How it works",
    title: "Three parts, one tooth.",
    body: "A titanium root in the jawbone, a connector at the gum line, and the tooth you see. Each is made for you.",
  },
  callouts: {
    crown: { name: "Crown", detail: "Shade-matched to your teeth" },
    abutment: { name: "Abutment", detail: "Connects root to crown" },
    implant: { name: "Implant", detail: "Titanium, placed in the jaw" },
  },
  parts: [
    {
      part: "implant",
      label: "The implant",
      title: "A titanium root that bonds with bone.",
      body: "Placed where the old root was, under local anaesthetic. Over the following weeks the bone grows onto its surface and holds it the way it held your tooth.",
      // CONFIRM: system, size, and the time in the chair.
      specs: ["Nobel Biocare", "4.1 mm by 10 mm", "About an hour in the chair"],
      align: "left",
    },
    {
      part: "abutment",
      label: "The abutment",
      title: "The connector, shaped to your gum.",
      body: "Fitted once the implant has healed. It rises through the gum and gives the new tooth something firm to sit on.",
      specs: ["Titanium", "Fitted after healing"],
      align: "right",
    },
    {
      part: "crown",
      label: "The crown",
      title: "Matched to the teeth beside it.",
      body: "Made from a 3D scan of your mouth and shade-matched by hand, so it sits among your own teeth without standing out.",
      specs: ["Zirconia", "Made from a 3D scan", "Shade-matched by hand"],
      align: "left",
    },
  ],
  finale: {
    eyebrow: "What to expect",
    title: "From first visit to new tooth.",
    // CONFIRM: every timing here.
    steps: [
      { when: "Day 1", title: "Consultation and X-ray", detail: "We check the bone and plan the implant." },
      { when: "Week 2", title: "Implant placed", detail: "About an hour, under local anaesthetic." },
      { when: "8 to 12 weeks", title: "Healing", detail: "The bone bonds with the implant." },
      { when: "After healing", title: "Abutment and crown", detail: "The new tooth goes on." },
    ],
    cta: "Book a consultation",
  },
  pricing: {
    eyebrow: "What it costs",
    title: "Prices, in full.",
    // CONFIRM: all prices by email before this goes live.
    rows: [
      { label: "Single implant", detail: "Nobel implant and crown", price: "₹30,000 to ₹42,000" },
      { label: "All-on-4", detail: "Full arch on four implants", price: "₹1,60,000 per arch" },
      { label: "Consultation", detail: "Examination and X-ray", price: "₹500" },
    ],
    cta: "Book a consultation",
    // CONFIRM: he may want different wording, or more of it.
    note: "Every case differs. The final cost depends on the bone available and the treatment planned at your consultation.",
  },
  clinic: {
    // CONFIRM: full address as he wants it shown.
    address: "Ashok Vihar, New Delhi",
    phone: "",
    timeZone: "Asia/Kolkata",
    // CONFIRM: opening hours. Sunday first, as JavaScript counts days.
    hours: [
      null,
      ["10:00", "20:00"],
      ["10:00", "20:00"],
      ["10:00", "20:00"],
      ["10:00", "20:00"],
      ["10:00", "20:00"],
      ["10:00", "20:00"],
    ],
  },
  note: "",
};
