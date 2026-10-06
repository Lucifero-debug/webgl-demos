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
  // CONFIRM: he uses several names across his sites. This is the one from
  // his Google listing; "Dr. Sachdeva's Dental Clinic" also appears.
  brand: "Dr. Rajat Sachdeva's Dentistry",
  logo: "/doctor/logo.webp",
  website: "https://www.dentalimplantindia.co.in",
  doctor: {
    name: "Dr. Rajat Sachdeva",
    // CONFIRM: his actual degrees and fellowships, exactly as he writes
    // them. These are a placeholder and must not go live unchecked.
    credentials: "BDS, MDS · Implantologist",
    role: "Ashok Vihar, New Delhi",
    photo: "/doctor/portrait.webp",
    bio: [
      "I have placed more than 10,000 implants. Most of my patients come to me after being told somewhere else that an implant is not possible for them, or after a denture they could never get used to.",
      "Every case starts with a scan and an honest answer about what the bone will take. If an implant is the wrong treatment for you, I will say so.",
      // CONFIRM: whether he teaches, and what he would like said about it.
      "I also train other dentists in implantology, which keeps me honest about technique.",
    ],
    proof: [
      { figure: "10,000+", label: "implants placed" },
      // CONFIRM both of these figures with him.
      { figure: "15 years", label: "in implant dentistry" },
      { figure: "Nobel Biocare", label: "implant systems used" },
    ],
  },
  treatments: {
    label: "What we do",
    title: "Implants, and what goes with them.",
    photo: "/doctor/pointing.webp",
    // CONFIRM: the list and the wording. Taken from his website.
    items: [
      { name: "Single implant", detail: "One missing tooth replaced, root and all, in about an hour in the chair." },
      { name: "All-on-4", detail: "A full arch of teeth on four implants, for patients who have lost most of their teeth." },
      { name: "Full-mouth rehabilitation", detail: "Both jaws planned together, so the bite works as one." },
      { name: "Bone grafting", detail: "Rebuilding the bone first, when there is not enough to hold an implant." },
      { name: "Immediate loading", detail: "A temporary tooth the same day, where the bone allows it." },
      { name: "Implant-supported dentures", detail: "A denture that clips to implants instead of moving while you eat." },
    ],
  },
  faq: {
    label: "Before you call",
    title: "The questions everyone asks.",
    // CONFIRM every answer: these are his clinical claims, not mine.
    items: [
      {
        q: "Does it hurt?",
        a: "The implant is placed under local anaesthetic, so you feel pressure rather than pain. Most patients are surprised how little there is afterwards, and take ordinary painkillers for a day or two.",
      },
      {
        q: "How long does the whole thing take?",
        a: "The implant takes about an hour to place. Then the bone needs eight to twelve weeks to bond with it before the tooth goes on. In some cases a temporary tooth can be fitted the same day.",
      },
      {
        q: "How long will it last?",
        a: "An implant that is looked after can last decades. What decides it is the health of the gum and bone around it, which is why we check it at every visit.",
      },
      {
        q: "What if I was told I don't have enough bone?",
        a: "That is one of the most common reasons patients come to us. Bone can often be rebuilt with a graft, and there are techniques that use the bone you still have. Bring your scan and we will tell you honestly.",
      },
      {
        q: "Why is there such a difference in price between clinics?",
        a: "Mostly the implant system and who places it. We use Nobel Biocare, a premium system with decades of research behind it, and the price on this page includes the implant, the abutment and the crown.",
      },
    ],
  },
  visit: {
    label: "Visit",
    title: "Come in and get it looked at.",
    body: "Bring any scans or X-rays you already have. A consultation is ₹500 and includes an examination and an X-ray, and you will leave knowing what is possible.",
    photo: "/doctor/welcome.webp",
    // CONFIRM: his Google Maps link.
    mapUrl: "https://maps.google.com/?q=Dr+Sachdeva+Dental+Institute+Ashok+Vihar+Delhi",
  },
  poster: "/posters/sachdeva.webp",
  hero: {
    eyebrow: "Dental implants",
    title: "A tooth that's fixed in place.",
    tagline:
      "An implant replaces the root as well as the tooth, so it bites and chews like the one you lost. Dr. Sachdeva has placed more than 10,000 of them. Here is what goes into one.",
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
  // WhatsApp, since that is how most patients here actually get in touch,
  // and it works from a phone and a laptop. CONFIRM he wants this rather
  // than the contact form at /contact/ or a tel: link.
  ctaHref: "https://wa.me/919818894041",
  clinic: {
    address: "I-101, 1st Floor, Ashok Vihar Phase-1, New Delhi 110052",
    phone: "+91 98188 94041",
    timeZone: "Asia/Kolkata",
    // From his website: Monday to Saturday with a break, Sunday mornings.
    hours: [
      [["10:00", "13:30"]],
      [
        ["09:30", "13:30"],
        ["16:30", "20:30"],
      ],
      [
        ["09:30", "13:30"],
        ["16:30", "20:30"],
      ],
      [
        ["09:30", "13:30"],
        ["16:30", "20:30"],
      ],
      [
        ["09:30", "13:30"],
        ["16:30", "20:30"],
      ],
      [
        ["09:30", "13:30"],
        ["16:30", "20:30"],
      ],
      [
        ["09:30", "13:30"],
        ["16:30", "20:30"],
      ],
    ],
  },
  note: "",
};
