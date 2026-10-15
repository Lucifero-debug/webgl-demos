/**
 * Settings for a clinic explainer: a scroll story around a 3D object that
 * separates into its parts, one close-up per part, ending on a booking
 * finale with live opening hours.
 */

export type PartKey = "crown" | "abutment" | "implant";

export type PartBeat = {
  part: PartKey;
  label: string;
  title: string;
  body: string;
  /** Short facts shown under the body: "Grade 5 titanium", "10 mm". */
  specs: string[];
  /**
   * What this part costs, shown on its close-up while the camera is on it,
   * so the price is read next to the thing being paid for.
   */
  prices?: { label: string; price: string }[];
  /** Which side the text sits on; the camera frames the part opposite. */
  align: "left" | "right";
};

/**
 * A day's opening hours, as one or more ranges: [["09:30", "13:30"],
 * ["16:30", "20:30"]] for a clinic that closes at lunch. null means closed.
 * Single-range days are still written as one range in a list.
 */
export type DayHours = [open: string, close: string][] | null;

export type ClinicConfig = {
  brand: string;
  /** The clinic's own logo, shown in the header. */
  logo?: string;
  /**
   * The clinic's main website. This page is one page about one
   * treatment, so it should always offer a way back to everything else
   * the clinic does.
   */
  website?: string;
  /**
   * The dentist. In this market patients choose a person, not a clinic,
   * so the page is built around him rather than around the practice.
   */
  doctor?: {
    name: string;
    credentials: string;
    role: string;
    photo: string;
    /** Two or three short paragraphs, in his voice. */
    bio: string[];
    proof: { figure: string; label: string }[];
  };
  /** What the clinic does, beyond the treatment this page explains. */
  treatments?: {
    label: string;
    title: string;
    items: { name: string; detail: string }[];
    photo?: string;
  };
  /** A band of headline numbers: "22+ years", "1,00,000+ patients". */
  stats?: { figure: string; label: string }[];
  /** The equipment, each with a photo: "CEREC", "Waterlase laser". */
  technology?: {
    label: string;
    title: string;
    body?: string;
    items: { name: string; detail: string; photo: string }[];
  };
  /** Real cases, before and after. Shown as a drag-to-compare slider. */
  gallery?: {
    label: string;
    title: string;
    body?: string;
    /** A photograph beside the heading. */
    photo?: string;
    photoAlt?: string;
    items: { title: string; before: string; after: string }[];
  };
  /** Awards by year, a headline honour, press, and review-site ratings. */
  recognition?: {
    label: string;
    title: string;
    body?: string;
    awards: { year: string; name: string; by: string; photo?: string }[];
    honour?: { text: string; photo: string };
    press?: string[];
    ratings?: { site: string; score: string }[];
    reviewsLine?: string;
  };
  /** Why patients choose the clinic, in a few groups of short points. */
  reasons?: { label: string; title: string; groups: { title: string; points: string[] }[] };
  /** Patients speaking for themselves. YouTube video ids. */
  testimonials?: { label: string; title: string; body?: string; videos: string[] };
  /** Every branch, each with its own map. The first is the main clinic. */
  branches?: { name: string; address: string; mapEmbed: string; directions: string }[];
  /**
   * The full price list, by category, below the 3D story's short pricing
   * beat. Each category folds open, so a long list stays scannable.
   */
  priceList?: {
    label: string;
    title: string;
    body?: string;
    groups: { title: string; rows: { item: string; price: string; usd?: string }[] }[];
    note: string;
  };
  /**
   * A second 3D story, for full-arch treatment: four implants and a fixed
   * bridge built up as the visitor scrolls, with four steps beside it.
   * The steps start at ARCH_STEPS in lib/clinic/archRuntime.ts.
   */
  arch?: {
    label: string;
    title: string;
    body: string;
    steps: { title: string; detail: string }[];
    /** Shown until the 3D loads. Save one with ?poster. */
    poster: string;
    cta?: string;
  };
  /**
   * Picture-led sections: one of his own images beside a short story.
   * `after` says where each one sits among the other sections.
   */
  features?: {
    after: "doctor" | "treatments" | "reasons";
    label: string;
    title: string;
    body: string;
    /** Short points, or figures when `figures` is set. */
    points?: string[];
    figures?: { figure: string; label: string }[];
    image: string;
    imageAlt: string;
    /** Portrait posters (9:16) are shown narrower than square images. */
    tall?: boolean;
    link?: { text: string; href: string };
  }[];
  /** Social profiles, shown in the footer. */
  socials?: { name: string; href: string }[];
  /** The questions every implant patient asks before they ring. */
  faq?: { label: string; title: string; items: { q: string; a: string }[] };
  /** Closing section: come and see us. */
  visit?: {
    label: string;
    title: string;
    body: string;
    photo?: string;
    mapUrl?: string;
  };
  /** Shown until the 3D scene loads. Save one with the ?poster URL flag. */
  poster: string;
  hero: { eyebrow: string; title: string; tagline: string; cta: string };
  explode: { label: string; title: string; body: string };
  /** Names and one-line descriptions for the labels drawn to each part. */
  callouts: Record<PartKey, { name: string; detail: string; price?: string }>;
  parts: PartBeat[];
  finale: {
    eyebrow: string;
    title: string;
    steps: { when: string; title: string; detail: string }[];
    cta: string;
  };
  /**
   * Optional last beat: what it costs, shown only after the treatment has
   * been explained. A price read after watching what goes into the work
   * lands very differently from one read before.
   */
  pricing?: {
    eyebrow: string;
    title: string;
    rows: { label: string; detail?: string; price: string }[];
    cta: string;
    /** Small print: what the price covers, and what it depends on. */
    note: string;
  };
  /**
   * Where every call-to-action button goes: the clinic's booking page, a
   * tel: link, or a WhatsApp link. A button that goes nowhere is worse than
   * no button, so this is required.
   */
  ctaHref: string;
  clinic: {
    address: string;
    phone: string;
    /** IANA time zone, for the live open/closed status. */
    timeZone: string;
    /** Sunday first, as JavaScript's getDay() counts. */
    hours: [DayHours, DayHours, DayHours, DayHours, DayHours, DayHours, DayHours];
    /** The hours as a patient reads them: "Open 24×7, all days". */
    hoursText?: string;
  };
  /** Shown small in the finale. */
  note: string;
};
