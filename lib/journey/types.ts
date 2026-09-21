/**
 * Settings for a globe journey: a scroll story that flies across a
 * photoreal Earth to each destination in turn, drawing the route between
 * them, and ends on a planning finale.
 *
 * Each destination is two beats: arrive (photos pinned to the place) and
 * the route (the camera leans in and the day-by-day path draws itself).
 * Camera shots are worked out from coordinates; nothing to frame by hand.
 */

export type Photo = {
  /** 3:4 portrait, from scripts/prepare-photos.mjs. */
  src: string;
  alt: string;
  caption: string;
};

export type ItineraryStop = {
  /** "1–2", or "9" for a single day. */
  days: string;
  name: string;
  lat: number;
  lon: number;
  note: string;
  /**
   * Which side of the pin its label sits. Stops closer than about 250 km
   * crowd each other, so pick sides that keep labels apart.
   */
  label: "left" | "right" | "above" | "below";
};

export type Destination = {
  id: string;
  name: string;
  country: string;
  /** Degrees. North and east positive. */
  lat: number;
  lon: number;
  /**
   * IANA time zone, for the live local time: "Asia/Tokyo", "Europe/Athens".
   * Look up the zone for the place, not the country's capital: Chile's
   * far south runs on America/Punta_Arenas, an hour off Santiago in winter.
   */
  timeZone: string;
  title: string;
  body: string;
  days: number;
  price: string;
  /** Which side the text sits on; the globe frames the destination opposite. */
  align: "left" | "right";
  /** Two or three, shown on arrival. */
  photos: Photo[];
  /**
   * The day-by-day route. Stops should be at least ~170 km apart: closer
   * than that, pins and labels overlap at the distance where the Earth
   * texture is still sharp.
   */
  itinerary: { title: string; stops: ItineraryStop[] };
};

export type JourneyConfig = {
  brand: string;
  hero: { eyebrow: string; title: string; tagline: string };
  /** Required by the textures' and photos' licences. */
  credit: string;
  poster: string;
  textures: {
    /** 4K, for phones: an 8K texture can use ~180 MB of GPU memory. */
    day: string;
    /** 8K, for larger screens, where the route close-ups need it. */
    dayHigh: string;
    night: string;
    specClouds: string;
    /** Terrain normal map: makes mountain ranges catch the light. */
    relief: string;
  };
  /**
   * The two wide views: which point on Earth faces the camera, and how far
   * back it stands (Earth's radius is 1). Both turn slowly while shown.
   */
  views: {
    hero: { lat: number; lon: number; distance: number };
    finale: { lat: number; lon: number; distance: number };
  };
  /** Visited in order; the route is drawn from each to the next. */
  destinations: Destination[];
  finale: { eyebrow: string; title: string; cta: string };
};
