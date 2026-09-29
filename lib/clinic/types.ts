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
  /** Shown until the 3D scene loads. Save one with the ?poster URL flag. */
  poster: string;
  hero: { eyebrow: string; title: string; tagline: string; cta: string };
  explode: { label: string; title: string; body: string };
  /** Names and one-line descriptions for the labels drawn to each part. */
  callouts: Record<PartKey, { name: string; detail: string }>;
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
  };
  /** Shown small in the finale. */
  note: string;
};
