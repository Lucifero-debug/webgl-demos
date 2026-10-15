import type { ClinicConfig } from "./types";

/*
  Dr. Rajat Sachdeva's clinics, Ashok Vihar and Moti Nagar
  (dentalimplantindia.co.in).

  On 15 Oct 2026 he asked for the content of his own clinic page,
  dentalimplantindia.co.in/dental-clinic/, to be brought onto this one: the
  numbers, services, technology, before-and-after cases, awards, video
  testimonials, both branches, 24×7 hours and his current phone number all
  come from there. The wording is rewritten for this page; the facts are
  his.

  Still marked CONFIRM: anything that is a clinical claim or a price, and
  anything that came from an older draft rather than his site. Nothing
  goes live in his name until he has read it: dental advertising rules in
  India are strict about what a clinic may promise.

  Prices: on 15 Oct 2026 he told Prashant (by phone) to take his pricing
  from www.delhidental.com/charges, so the price list below follows that
  page, item for item, in rupees and dollars, including the ₹1,500
  consultation (his own clinic page offers it free: CONFIRM which). The
  one addition: All-on-4, which that list does not price, keeps the figure
  from his older page. Get the instruction confirmed in writing before this goes
  live under his name.

  Still needed from him:
  - his degrees and fellowships, exactly as he writes them
  - which implant system he places (the 3D model and the FAQ name one)
  - the real "successfully completed" counts: his site shows "0+"

  Images: his photographs, before-and-after cases, trophies and equipment
  are read from his own site (SITE below). To serve them from this site
  instead, run `node scripts/fetch-sachdeva.mjs` on a machine that can
  reach his domain, then point SITE at "/doctor/site".
*/
const SITE = "https://dentalimplantindia.co.in/dental-clinic/Images";
/** A path on his site; spaces in his folder names ("bf and af") encoded. */
const img = (path: string) => `${SITE}/${path.split("/").map(encodeURIComponent).join("/")}`;

const HOURS_24: [string, string][] = [["00:00", "24:00"]];

export const sachdeva: ClinicConfig = {
  // The name on the logo he sent on 15 Oct 2026 (also his Google listing).
  brand: "Dr. Rajat Sachdeva's Dentistry",
  // His logo, mark and name side by side so it reads at header size
  // (cut from the stacked original, public/doctor/logo-full.webp).
  logo: "/doctor/logo-dentistry.webp",
  website: "https://dentalimplantindia.co.in/dental-clinic/",
  doctor: {
    name: "Dr. Rajat Sachdeva",
    // CONFIRM: his degrees go here, exactly as he writes them. Until then,
    // only what his own site says.
    credentials: "Founder & Director · Implant & Cosmetic Dentistry",
    role: "Implant specialist · Cosmetic dentistry · Laser aesthetics",
    photo: "/doctor/portrait.webp",
    bio: [
      "In more than 22 years of practice I have placed over 15,000 dental implants. Implants are the centre of my work, alongside cosmetic dentistry and laser aesthetics, and the restorative, root canal and denture work that so often goes with them.",
      "Every case starts with a scan, a plan made digitally, and an honest answer about what the bone will take. If an implant is the wrong treatment for you, I will say so.",
      "I also run implant and aesthetics workshops for dentists in India and abroad, and am invited to lead teaching surgeries overseas, which keeps my own technique under constant review.",
    ],
    proof: [
      { figure: "15,000+", label: "implants placed" },
      { figure: "22+ years", label: "in practice" },
      { figure: "1,00,000+", label: "patients treated" },
    ],
  },
  stats: [
    { figure: "02", label: "clinics in Delhi" },
    { figure: "25+", label: "doctors and staff" },
    { figure: "1,00,000+", label: "patients treated" },
    { figure: "22+", label: "years of experience" },
    { figure: "20+", label: "advanced dental technologies" },
    { figure: "100%", label: "digital treatment planning" },
    { figure: "100%", label: "international sterilisation standards" },
    { figure: "24×7", label: "patient support" },
  ],
  treatments: {
    label: "What we do",
    title: "Implants, and everything that goes with them.",
    // The take he asked for, cut out of the green-screen original he sent.
    // The first one is still at /doctor/pointing.webp if he changes his mind.
    photo: "/doctor/pointing-2.webp",
    // From the services on his clinic page. CONFIRM the wording.
    items: [
      { name: "Dental implants", detail: "Single teeth to full arches, placed with minimally invasive technique. Over 15,000 placed." },
      { name: "Full-mouth rehabilitation", detail: "Both jaws planned together, including All-on-4, so the bite works as one." },
      { name: "Smile design and makeovers", detail: "Planned digitally first, so you see the result before treatment starts." },
      { name: "Invisalign and braces", detail: "Clear aligners or braces to straighten teeth, for adults and children." },
      { name: "Porcelain veneers", detail: "Thin ceramic facings that reshape and brighten the front teeth." },
      { name: "Teeth whitening", detail: "In-clinic whitening, several shades in a single visit." },
      { name: "Microscopic root canal", detail: "Root canal treatment under a dental microscope, to save the tooth." },
      { name: "Dentures", detail: "Conventional and implant-supported dentures that stay in place." },
      { name: "Family dentistry", detail: "Check-ups, cleaning and fillings for the whole family." },
      { name: "Emergencies, home visits and teleconsultation", detail: "Same-day emergency appointments, and care for patients who cannot come in." },
    ],
  },
  technology: {
    label: "Inside the clinic",
    title: "Equipment most clinics don't have.",
    body: "Treatment is planned digitally and carried out with the same systems used in leading clinics abroad.",
    items: [
      { name: "The operatory", detail: "Where implants are placed, built around a sterile workflow.", photo: img("ot/ot.jpeg") },
      { name: "Sterile treatment rooms", detail: "Sterilisation to international standards, every patient.", photo: img("ot/ot2.jpeg") },
      { name: "Digital Smile Design", detail: "Your new smile designed on screen before any treatment.", photo: img("other/digital-smile-.webp") },
      { name: "Microscope-assisted dentistry", detail: "Magnified precision for root canals and fine work.", photo: img("other/micro.webp") },
      { name: "CAD/CAM", detail: "Crowns designed and milled from a 3D scan.", photo: img("other/CAD.webp") },
      { name: "CEREC", detail: "Ceramic restorations made in the clinic.", photo: img("other/cerec-technology.jpg") },
      { name: "Waterlase laser", detail: "Laser dentistry with less need for drills and stitches.", photo: img("other/Waterlase-laser-dentistry.png") },
      { name: "Conscious sedation", detail: "For anxious patients: relaxed and awake throughout.", photo: img("other/conscious.jpeg") },
    ],
  },
  gallery: {
    label: "Our work",
    title: "Before and after.",
    body: "Patients of the clinic. Drag across each picture to compare.",
    photo: "/doctor/results.webp",
    photoAlt: "Dr. Rajat Sachdeva beside a patient's finished smile on the clinic screen",
    items: [
      { title: "Full-mouth implants", before: img("bf and af/before.png"), after: img("bf and af/after.png") },
      { title: "Single implant", before: img("bf and af/singlebf.png"), after: img("bf and af/singleaf.png") },
      { title: "Veneers", before: img("bf and af/brforeind.png"), after: img("bf and af/afterind.png") },
      { title: "Teeth whitening", before: img("bf and af/bf.png"), after: img("bf and af/af.png") },
    ],
  },
  recognition: {
    label: "Recognition",
    title: "Five years of awards, in a row.",
    awards: [
      { year: "2020", name: "Patient Service Award", by: "WhatClinic", photo: img("trophy/1.png") },
      { year: "2021", name: "Best Dental Clinic in India", by: "Excellence Summit", photo: img("trophy/2.png") },
      { year: "2022", name: "Best Dental Clinic in India", by: "Asia Healthcare Award", photo: img("trophy/3.png") },
      { year: "2023", name: "Best Dental Clinic in India", by: "International Business Award", photo: img("trophy/4.png") },
      { year: "2024", name: "Best Dental Clinic in India", by: "International Excellence Award", photo: img("trophy/5.png") },
    ],
    /*
      His own recognition poster, as he published it. Shown whole rather
      than picked apart: the claims on it are his, worded by him, and the
      alt text repeats them so a screen reader gets the same.

      Note it names two outlets the press list below does not -- Delhi
      Times and Business World -- and says "Forbes India" where the list
      says "Forbes". Left as they are on both until he confirms which
      wording he wants.
    */
    poster: {
      image: "/doctor/recognition.webp",
      alt: "Dr. Rajat Sachdeva, MDS MBA, recognised among leading names in dentistry: Times Health Icons Awards, Delhi Times featured expert, Forbes India and Business World. “Awards and recognitions are always special, but the real achievement is the faith patients place in us every single day.”",
      caption: "Times Health Icons Awards · Delhi Times · Forbes India · Business World",
    },
    honour: {
      text: "Dr. Sachdeva honoured by a former President of India.",
      photo: img("international/award.png"),
    },
    press: ["Hindustan Times", "Forbes", "The Week", "The Economic Times", "Outlook", "Mid-day"],
    // CONFIRM these are current before going live: ratings move.
    reviewsLine: "Rated 4.9 by patients, across more than 1,000 reviews.",
    ratings: [
      { site: "Google", score: "4.9" },
      { site: "Practo", score: "4.8" },
      { site: "Justdial", score: "4.8" },
      { site: "Lybrate", score: "4.9" },
      { site: "MouthShut", score: "4.9" },
      { site: "Facebook", score: "4.8" },
      { site: "Trustpilot", score: "4.7" },
      { site: "WhatClinic", score: "4.7" },
    ],
  },
  reasons: {
    label: "Why patients choose us",
    title: "World-class dentistry, planned around you.",
    groups: [
      {
        title: "Advanced treatment",
        points: ["Implants and full-mouth rehabilitation", "Smile design and cosmetic dentistry", "Microscopic root canals", "Digital diagnostics and painless procedures"],
      },
      {
        title: "There when you need it",
        points: ["Emergency care, 24×7", "Same-day appointments", "Immediate pain relief"],
      },
      {
        title: "Patients from abroad",
        points: ["Patients from across the world", "Help for international patients", "Teleconsultation before you travel"],
      },
      {
        title: "Built around the patient",
        points: ["Everything under one roof", "Transparent, ethical treatment", "A plan made for you", "Care for the whole family"],
      },
    ],
  },
  testimonials: {
    label: "Patients",
    title: "In their own words.",
    body: "Real patients, filmed at the clinic.",
    videos: ["zz4_6rnPYbU", "MKU4Dwu4NXM", "KqiaHObGCcI", "CrXuogwaZeA"],
  },
  faq: {
    label: "Before you call",
    title: "The questions everyone asks.",
    // CONFIRM every answer: these are his clinical claims, not mine.
    items: [
      {
        q: "Does it hurt?",
        a: "The implant is placed under local anaesthetic, so you feel pressure rather than pain. Most patients are surprised how little there is afterwards, and take ordinary painkillers for a day or two. Conscious sedation is available if you are anxious.",
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
        q: "I live outside Delhi, or outside India. Can I still be treated here?",
        a: "Yes. Many of our patients travel to us. Start with a teleconsultation and send your X-rays or scans, and we will plan the visit around the treatment so you spend as few days here as possible.",
      },
      {
        q: "Why is there such a difference in price between clinics?",
        a: "Mostly the implant system and who places it. We use Nobel Biocare implants, a premium system with decades of research behind it. The implant price includes a straight abutment; the crown on top is priced separately, by material, so you can see exactly what you are paying for.",
      },
    ],
  },
  visit: {
    label: "Visit",
    title: "Come in and get it looked at.",
    body: "A consultation is ₹1,500 and includes an X-ray. Bring any scans or X-rays you already have, and you will leave knowing what is possible.",
    photo: "/doctor/welcome.webp",
    mapUrl:
      "https://www.google.com/maps/dir/?api=1&destination=Dr.%20Rajat%20Sachdeva's%20Dentistry%20In%20Ashok%20Vihar%2C%20I%20101%2C%20Ashok%20Vihar%20Phase%201%20Rd%2C%20Block%20I%2C%20Pocket%20I%2C%20Phase%201%2C%20Ashok%20Vihar%2C%20Delhi%20110052",
  },
  branches: [
    {
      name: "Ashok Vihar",
      address: "I-101, Ashok Vihar Phase-1, New Delhi 110052",
      mapEmbed:
        "https://maps.google.com/maps?q=Dr.%20Rajat%20Sachdeva's%20Dentistry%20In%20Ashok%20Vihar%2C%20I%20101%2C%20Ashok%20Vihar%20Phase%201%20Rd%2C%20Block%20I%2C%20Pocket%20I%2C%20Phase%201%2C%20Ashok%20Vihar%2C%20Delhi%20110052&z=16&output=embed",
      directions:
        "https://www.google.com/maps/dir/?api=1&destination=Dr.%20Rajat%20Sachdeva's%20Dentistry%20In%20Ashok%20Vihar%2C%20I%20101%2C%20Ashok%20Vihar%20Phase%201%20Rd%2C%20Block%20I%2C%20Pocket%20I%2C%20Phase%201%2C%20Ashok%20Vihar%2C%20Delhi%20110052",
    },
    {
      name: "Moti Nagar",
      address: "18/32, near Happy Studio, Block 18, Moti Nagar, New Delhi 110015",
      mapEmbed:
        "https://maps.google.com/maps?q=Dr.Rajat%20Sachdeva's%20Moti%20Nagar%20Dental%20Clinic%2C%2018%2F32%2C%20near%20Happy%20studio%2C%20Block%2018%2C%20Moti%20Nagar%2C%20New%20Delhi%2C%20Delhi%20110015&z=16&output=embed",
      directions:
        "https://www.google.com/maps/dir/?api=1&destination=Dr.Rajat%20Sachdeva's%20Moti%20Nagar%20Dental%20Clinic%2C%2018%2F32%2C%20near%20Happy%20studio%2C%20Block%2018%2C%20Moti%20Nagar%2C%20New%20Delhi%2C%20Delhi%20110015",
    },
  ],
  // The full-arch 3D story. CONFIRM the clinical wording with him.
  arch: {
    label: "Full-arch implants, in 3D",
    title: "A whole set of teeth, on four implants.",
    body: "When most of the teeth are failing, every tooth does not need its own implant. Four, placed precisely, can carry a complete fixed set of teeth.",
    steps: [
      { title: "The jaw is planned digitally", detail: "A 3D scan shows where the bone is strongest, and the implants are planned on screen first." },
      { title: "Four implants go in", detail: "Two straight at the front; two at the back tilted, to use the bone that is there and avoid grafting." },
      { title: "Abutments are fitted", detail: "Multi-unit abutments bring all four to the same height and angle, ready for the teeth." },
      { title: "The fixed teeth go on", detail: "A full arch of teeth screws onto all four, within days. It does not come out at night." },
    ],
    poster: "/posters/sachdeva-arch.webp",
    cta: "Ask about full-arch implants",
  },
  // His own images, sent on 15 Oct 2026. Figures as printed on them.
  features: [
    {
      after: "doctor",
      label: "Delhi's trusted digital dentist",
      title: "Why patients find him first.",
      body: "Dr. Sachdeva explains dentistry in public, every day: thousands of videos, articles and talks that patients watch long before they book. Most arrive already knowing how he works.",
      // CONFIRM: these move; check them with him before going live.
      figures: [
        { figure: "122K+", label: "on Instagram" },
        { figure: "40K+", label: "YouTube subscribers" },
        { figure: "6.5M+", label: "YouTube views" },
        { figure: "2,900+", label: "YouTube videos" },
        { figure: "1,000+", label: "Google reviews" },
        { figure: "900+", label: "Practo reviews" },
        { figure: "15K+", label: "LinkedIn network" },
        { figure: "1,000+", label: "articles" },
        { figure: "500+", label: "SlideShare presentations" },
      ],
      image: "/doctor/why-top.webp",
      imageAlt: "Why Dr. Rajat Sachdeva is at the top: 22+ years, 15,000+ implants and his following online",
      link: { text: "Watch on YouTube", href: "https://www.youtube.com/user/drrajatsachdeva/videos" },
    },
    {
      after: "treatments",
      label: "Full-arch implants",
      title: "From extractions to fixed teeth in 10 days.",
      body: "For patients losing most of their teeth: the failing teeth come out, implants go in, and a fixed set of teeth is fitted within days, not months. You leave eating and smiling with fixed teeth while the implants heal underneath.",
      // CONFIRM: his own poster's claims; he decides how they are worded here.
      points: [
        "Full-arch restoration in 10 days",
        "Immediate loading: fixed temporary teeth straight away",
        "Digital planning and 3D-guided placement",
        "Planned for safe, predictable, long-lasting results",
      ],
      // No picture here on purpose. His "10 DAYS!" poster used to sit
      // beside this copy; it was asked to come off the page, and the
      // section now runs as a single column of words. The file is still
      // at /doctor/full-arch.webp if it is ever wanted back.
    },
    {
      after: "reasons",
      label: "A dentist who teaches",
      title: "Technique matters more than material.",
      body: "Beyond his own patients, Dr. Sachdeva teaches dentists: implant and aesthetic workshops in India and abroad, and thousands of free videos on technique. The standards he teaches are the ones he works to.",
      image: "/doctor/composite.webp",
      imageAlt: "Dr. Rajat Sachdeva in a video on Class II composite technique",
      tall: true,
      link: { text: "His YouTube channel", href: "https://www.youtube.com/user/drrajatsachdeva/videos" },
    },
  ],
  socials: [
    { name: "Instagram", href: "https://www.instagram.com/drrajatdentist/" },
    { name: "YouTube", href: "https://www.youtube.com/user/drrajatsachdeva/videos" },
    { name: "Facebook", href: "https://www.facebook.com/dentalcoursesdelhi/" },
    { name: "LinkedIn", href: "https://www.linkedin.com/in/drrajatsachdeva" },
  ],
  poster: "/posters/sachdeva.webp",
  hero: {
    eyebrow: "Dental implants",
    title: "A tooth that's fixed in place.",
    tagline:
      "An implant replaces the root as well as the tooth, so it bites and chews like the one you lost. Dr. Sachdeva has placed more than 15,000 of them. Here is what goes into one.",
    cta: "Book a consultation",
  },
  explode: {
    label: "How it works",
    title: "Three parts, one tooth.",
    body: "A titanium root in the jawbone, a connector at the gum line, and the tooth you see. Each is made for you.",
  },
  callouts: {
    // Prices from his chosen price list (see the top of this file).
    crown: { name: "Crown", detail: "Shade-matched to your teeth", price: "from ₹12,000" },
    abutment: { name: "Abutment", detail: "Connects root to crown", price: "included" },
    implant: { name: "Implant", detail: "Titanium, placed in the jaw", price: "from ₹35,000" },
  },
  parts: [
    {
      part: "implant",
      label: "The implant",
      title: "A titanium root that bonds with bone.",
      body: "Placed where the old root was, under local anaesthetic, with minimally invasive technique. Over the following weeks the bone grows onto its surface and holds it the way it held your tooth.",
      // CONFIRM: system, size, and the time in the chair.
      specs: ["Grade 5 titanium", "4.1 mm by 10 mm", "About an hour in the chair"],
      prices: [
        { label: "Nobel Biocare Replace Select", price: "₹35,000" },
        { label: "Nobel Biocare Active", price: "₹45,000" },
      ],
      align: "left",
    },
    {
      part: "abutment",
      label: "The abutment",
      title: "The connector, shaped to your gum.",
      body: "Fitted once the implant has healed. It rises through the gum and gives the new tooth something firm to sit on.",
      specs: ["Titanium", "Fitted after healing"],
      prices: [{ label: "Straight abutment", price: "Included with the implant" }],
      align: "right",
    },
    {
      part: "crown",
      label: "The crown",
      title: "Matched to the teeth beside it.",
      body: "Designed from a 3D scan of your mouth with CAD/CAM and shade-matched by hand, so it sits among your own teeth without standing out.",
      specs: ["Zirconia", "CAD/CAM from a 3D scan", "Shade-matched by hand"],
      prices: [
        { label: "Porcelain fused to metal (CAD/CAM)", price: "₹12,000" },
        { label: "Zirconia, regular", price: "₹15,000" },
        { label: "Zirconia, premium (ZirCAD)", price: "₹20,000" },
      ],
      align: "left",
    },
  ],
  finale: {
    eyebrow: "What to expect",
    title: "From first visit to new tooth.",
    // CONFIRM: every timing here.
    steps: [
      { when: "Day 1", title: "Consultation and X-ray", detail: "We check the bone and plan the implant digitally." },
      { when: "Week 2", title: "Implant placed", detail: "About an hour, under local anaesthetic." },
      { when: "8 to 12 weeks", title: "Healing", detail: "The bone bonds with the implant." },
      { when: "After healing", title: "Abutment and crown", detail: "The new tooth goes on." },
    ],
    cta: "Book a consultation",
  },
  pricing: {
    eyebrow: "What it costs",
    title: "Prices, in full.",
    // From www.delhidental.com/charges, as he instructed (see the top of
    // this file). The full list is in priceList below.
    rows: [
      { label: "Nobel Biocare Replace Select", detail: "Implant with straight abutment", price: "₹35,000" },
      { label: "Nobel Biocare Active", detail: "Implant with straight abutment", price: "₹45,000" },
      { label: "Zirconia implant crown", detail: "Screw retained, regular to premium", price: "₹15,000 to ₹20,000" },
      { label: "Consultation", detail: "With X-ray", price: "₹1,500" },
    ],
    cta: "Book a consultation",
    note: "Prices are per implant or per crown. Every case differs: the final cost depends on the bone available and the treatment planned at your consultation. Full price list below.",
  },
  priceList: {
    label: "Price list",
    title: "Every treatment, priced.",
    body: "No surprises: what each treatment costs, before you come in, in rupees and US dollars. Your exact plan and quote are confirmed at your consultation.",
    groups: [
      {
        title: "Implants",
        rows: [
          { item: "Nobel Biocare Replace Select implant, straight abutment", price: "₹35,000 per implant", usd: "$369 per implant" },
          { item: "Nobel Biocare Active implant, straight abutment", price: "₹45,000 per implant", usd: "$474 per implant" },
          { item: "NobelGuide computer-guided surgical stent", price: "₹40,000 per jaw", usd: "$422 per jaw" },
          // From his own older page, not the list he pointed to. CONFIRM.
          { item: "All-on-4, full arch on four implants", price: "₹1,60,000 per arch" },
          { item: "Sinus lift", price: "₹50,000 per side", usd: "$527 per side" },
          { item: "Bone grafting", price: "From ₹10,000, as required", usd: "From $105" },
        ],
      },
      {
        title: "Implant crowns",
        rows: [
          { item: "Porcelain fused to metal (CAD/CAM), screw retained", price: "₹12,000 per crown", usd: "$127 per crown" },
          { item: "Zirconia, regular, screw retained", price: "₹15,000 per crown", usd: "$159 per crown" },
          { item: "Zirconia, premium (ZirCAD), screw retained", price: "₹20,000 per crown", usd: "$212 per crown" },
        ],
      },
      {
        title: "Crowns, bridges and dentures",
        rows: [
          { item: "Porcelain-based metal crown, cement retained", price: "₹5,000 per crown", usd: "$53 per crown" },
          { item: "Porcelain fused to metal (CAD/CAM), cement retained", price: "₹7,000 per crown", usd: "$74 per crown" },
          { item: "Zirconia crown, regular (Ceramill / A-Zir / Sagemax)", price: "₹12,000", usd: "$127" },
          { item: "Zirconia crown, premium (CEREC / e.max ZirCAD)", price: "₹15,000", usd: "$159" },
          { item: "Removable partial denture, imported", price: "From ₹5,000", usd: "From $53" },
          { item: "Removable partial denture, flexible", price: "From ₹15,000", usd: "From $158" },
          { item: "Complete dentures, upper and lower, imported", price: "₹50,000 full set", usd: "$527 full set" },
        ],
      },
      {
        title: "Cosmetic dentistry",
        rows: [
          { item: "E.max metal-free crown or veneer", price: "₹17,000 per tooth", usd: "$179 per tooth" },
          { item: "Zirconia metal-free crown", price: "₹12,000 to ₹17,000", usd: "$126 to $179" },
          { item: "Componeers", price: "₹8,000 per tooth", usd: "$84 per tooth" },
          { item: "Composite bonding", price: "From ₹5,000, by size", usd: "From $53" },
          { item: "Zoom advanced whitening, 3 cycles with maintenance kit", price: "₹20,000", usd: "$211" },
          { item: "Home whitening system, 4 gels", price: "₹8,000", usd: "$84" },
          { item: "In-office brightening package", price: "₹3,999", usd: "$42" },
          { item: "Cosmetic contouring", price: "₹1,000 per arch", usd: "$11 per arch" },
          { item: "Dental crystal", price: "₹3,000 per crystal", usd: "$32 per crystal" },
          { item: "Lip fillers", price: "₹20,000 to ₹30,000, by material", usd: "$211 to $316" },
          { item: "Botox", price: "₹20,000 to ₹30,000, by material", usd: "$211 to $316" },
        ],
      },
      {
        title: "Root canals and fillings",
        rows: [
          { item: "Root canal, front or back tooth", price: "₹8,000 to ₹12,000 per tooth", usd: "$85 to $127 per tooth" },
          { item: "Root canal retreatment", price: "₹12,000 to ₹15,000 per tooth", usd: "$127 to $159 per tooth" },
          { item: "Ceramic filling or inlay", price: "₹15,000 per tooth", usd: "$159 per tooth" },
          { item: "Composite filling", price: "₹3,000 to ₹5,000", usd: "$32 to $53" },
          { item: "Fluoride filling", price: "₹2,000 to ₹3,000", usd: "$21 to $32" },
          { item: "Adult sealants", price: "₹2,500 to ₹3,000", usd: "$26 to $32" },
          { item: "Night guard", price: "₹5,000 per set", usd: "$53 per set" },
        ],
      },
      {
        title: "Gums and laser",
        rows: [
          { item: "Full-mouth scaling and polishing", price: "From ₹3,000", usd: "From $32" },
          { item: "Deep scaling (curettage), full mouth", price: "₹10,000 to ₹20,000", usd: "$105 to $211" },
          { item: "Dental diode laser treatment", price: "From ₹10,000", usd: "From $105" },
          { item: "Diode laser frenectomy", price: "₹5,000", usd: "$53" },
          { item: "Laser gum contouring", price: "₹10,000 to ₹25,000", usd: "$105 to $263" },
          { item: "Laser depigmentation", price: "₹10,000 to ₹25,000", usd: "$105 to $263" },
          { item: "Gum flap surgery", price: "₹15,000 per quadrant", usd: "$158 per quadrant" },
          { item: "Gum graft", price: "₹18,000 per tooth", usd: "$190 per tooth" },
        ],
      },
      {
        title: "Oral surgery",
        rows: [
          { item: "Extraction", price: "₹3,000 per tooth", usd: "$32 per tooth" },
          { item: "Impacted or wisdom tooth removal", price: "₹6,000 to ₹10,000 per tooth", usd: "$63 to $105 per tooth" },
          { item: "Apicectomy", price: "₹10,000 to ₹15,000 per tooth", usd: "$105 to $158 per tooth" },
          { item: "Biopsy", price: "₹15,000", usd: "$158" },
        ],
      },
      {
        title: "Braces and aligners",
        rows: [
          { item: "Metal braces, full mouth", price: "₹40,000 to ₹50,000", usd: "$424 to $530" },
          { item: "Ceramic braces, full mouth", price: "₹60,000 to ₹70,000", usd: "$636 to $742" },
          { item: "Damon metal braces", price: "₹80,000 to ₹1,00,000", usd: "$848 to $1,060" },
          { item: "Damon ceramic braces", price: "₹1,20,000 to ₹1,60,000", usd: "$1,272 to $1,696" },
          { item: "Clear aligners", price: "₹60,000 to ₹1,80,000", usd: "$636 to $1,908" },
          { item: "Invisalign", price: "₹3,00,000", usd: "$3,162" },
        ],
      },
      {
        title: "Children (up to 12 years)",
        rows: [
          { item: "Scaling and polishing", price: "₹2,000", usd: "$21" },
          { item: "Filling", price: "₹1,500 to ₹2,500", usd: "$16 to $27" },
          { item: "Extraction", price: "₹3,000", usd: "$32" },
          { item: "Root canal", price: "₹4,000 to ₹5,000", usd: "$42 to $53" },
          { item: "Crown", price: "₹5,000", usd: "$53" },
        ],
      },
      {
        title: "Consultation",
        rows: [
          { item: "Consultation with a single RVG X-ray", price: "₹1,500", usd: "$16" },
          { item: "Consultation with a full-mouth OPG X-ray", price: "₹1,500", usd: "$16" },
        ],
      },
    ],
    note: "Prices are a guide. Your exact treatment plan and quote are confirmed at your consultation, and depend on the bone, gums and teeth involved.",
  },
  // His WhatsApp, from his clinic page.
  ctaHref: "https://wa.me/919266236271",
  /*
    The three he asked for: "prominent call-to-action buttons for WhatsApp
    Chat, Call for Consultation, and an Enquiry Form", with the form going
    to WhatsApp rather than email.

    TWO NUMBERS ARE ON HIS SITE. dentalimplantindia.co.in lists
    98188 94041, 88609 40947 and 92662 36271, and its own WhatsApp button
    goes to 98188 94041 -- not the 92662 36271 that `ctaHref` above has
    used all along. Kept on 92662 36271 here so nothing silently moves; ask
    him which number he wants these on before this goes live, because a
    chat opened on the wrong one is an enquiry nobody sees.
  */
  contact: {
    whatsapp: "919266236271",
    phone: "+91 92662 36271",
    openingMessage:
      "Hello Dr. Sachdeva, I read your page on dental implants and would like to ask about treatment.",
    whatsappLabel: "WhatsApp",
    callLabel: "Call",
    enquireLabel: "Enquire",
    form: {
      label: "Enquiry",
      title: "Ask Dr. Sachdeva",
      body: "Leave your number and he or his team will get back to you. Nothing is charged for the first conversation.",
      // Named so the reply can start where the patient already is, rather
      // than with "what would you like to know?".
      subjects: [
        "Single tooth implant",
        "Full-arch / All-on-4",
        "Cost and payment",
        "Second opinion on a quote",
        "Something else",
      ],
    },
  },
  clinic: {
    address: "I-101, Ashok Vihar Phase-1, New Delhi 110052",
    phone: "+91 92662 36271",
    timeZone: "Asia/Kolkata",
    // His clinic page: open 24×7, all days, emergency care on call.
    hours: [HOURS_24, HOURS_24, HOURS_24, HOURS_24, HOURS_24, HOURS_24, HOURS_24],
    hoursText: "Open 24×7, every day · Emergency care on call",
  },
  note: "",
};
