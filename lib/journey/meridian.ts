import type { JourneyConfig } from "./types";

/**
 * Meridian: the travel demo. A fictional small-group travel company.
 * Coordinates are real, since the camera flies to them. Itinerary stops
 * and label sides were checked against the camera framing so no two labels
 * collide.
 *
 * Photos: Unsplash licence (free for commercial use, no attribution
 * required). Update the captions to match the photos you choose.
 */
export const meridian: JourneyConfig = {
  brand: "Meridian",
  hero: {
    eyebrow: "Small-group journeys",
    title: "The world, slowly.",
    tagline: "Three journeys for people who would rather stay longer than see more.",
  },
  credit: "Earth textures by Solar System Scope, CC BY 4.0. Photos from Unsplash.",
  poster: "/posters/meridian.webp",
  textures: {
    day: "/textures/earth/day.webp",
    dayHigh: "/textures/earth/day-8k.webp",
    night: "/textures/earth/night.webp",
    specClouds: "/textures/earth/spec-clouds.webp",
    relief: "/textures/earth/relief.webp",
  },
  views: {
    // Opens over South Asia, turning slowly towards the first stop.
    hero: { lat: 22, lon: 78, distance: 4.2 },
    // Ends over Africa and Europe, with routes reaching to both edges.
    finale: { lat: 12, lon: 20, distance: 4.6 },
  },
  destinations: [
    {
      id: "kyoto",
      name: "Kyoto",
      country: "Japan",
      lat: 35.0116,
      lon: 135.7681,
      timeZone: "Asia/Tokyo",
      title: "Kyoto, before the crowds.",
      body: "Temple gardens at first light, a night in a mountain ryokan, and time to do nothing at all.",
      days: 9,
      price: "from $3,900",
      align: "left",
      photos: [
        { src: "/photos/kyoto-1.webp", alt: "A bamboo grove path", caption: "Arashiyama" },
        { src: "/photos/kyoto-2.webp", alt: "Rows of vermilion torii gates", caption: "Fushimi Inari" },
        { src: "/photos/kyoto-3.webp", alt: "A lantern-lit lane at dusk", caption: "Gion" },
      ],
      itinerary: {
        title: "Nine days, four stays.",
        stops: [
          { days: "1–2", name: "Tokyo", lat: 35.6762, lon: 139.6503, note: "Arrive, then a quiet inn in Yanaka.", label: "right" },
          { days: "3–4", name: "Kanazawa", lat: 36.5613, lon: 136.6562, note: "Gardens and the old teahouse quarter.", label: "left" },
          { days: "5–8", name: "Kyoto", lat: 35.0116, lon: 135.7681, note: "Temples at first light, before the tour buses.", label: "below" },
          { days: "9", name: "Hiroshima", lat: 34.3853, lon: 132.4553, note: "Miyajima's floating gate at dusk.", label: "left" },
        ],
      },
    },
    {
      id: "santorini",
      name: "Santorini",
      country: "Greece",
      lat: 36.3932,
      lon: 25.4615,
      timeZone: "Europe/Athens",
      title: "Santorini, off the ridge.",
      body: "A village the ferries skip, the caldera by boat at dusk, and dinners built from what the island grows.",
      days: 8,
      price: "from $3,200",
      align: "right",
      photos: [
        { src: "/photos/santorini-1.webp", alt: "White houses above the caldera", caption: "Oia" },
        { src: "/photos/santorini-2.webp", alt: "A blue church dome over the sea", caption: "Firostefani" },
        { src: "/photos/santorini-3.webp", alt: "Boats in an old harbour", caption: "Chania" },
      ],
      itinerary: {
        title: "Eight days, three stays.",
        stops: [
          { days: "1–2", name: "Athens", lat: 37.9838, lon: 23.7275, note: "The Acropolis at opening time.", label: "right" },
          { days: "3–5", name: "Oia", lat: 36.4618, lon: 25.3753, note: "The caldera by boat at dusk.", label: "right" },
          { days: "6–8", name: "Chania", lat: 35.5138, lon: 24.018, note: "Old harbour, long lunches.", label: "left" },
        ],
      },
    },
    {
      id: "patagonia",
      name: "Torres del Paine",
      country: "Chile",
      lat: -50.9423,
      lon: -73.4068,
      timeZone: "America/Punta_Arenas",
      title: "Patagonia, on foot.",
      body: "Five days on the W trail between granite towers and glacier lakes, with a refugio bed each night.",
      days: 11,
      price: "from $4,700",
      align: "left",
      photos: [
        { src: "/photos/patagonia-1.webp", alt: "Three granite towers above a lake", caption: "Torres del Paine" },
        { src: "/photos/patagonia-2.webp", alt: "A blue glacier face", caption: "Grey Glacier" },
        { src: "/photos/patagonia-3.webp", alt: "A jagged peak at sunrise", caption: "Fitz Roy" },
      ],
      itinerary: {
        title: "Eleven days, end of the world.",
        stops: [
          { days: "1–2", name: "Punta Arenas", lat: -53.1638, lon: -70.9171, note: "Fly in, gear up, meet the group.", label: "right" },
          { days: "3–7", name: "Torres del Paine", lat: -50.9423, lon: -73.4068, note: "The W trail, refugio to refugio.", label: "left" },
          { days: "8–11", name: "El Chaltén", lat: -49.3315, lon: -72.8863, note: "Fitz Roy at sunrise, weather willing.", label: "right" },
        ],
      },
    },
  ],
  finale: {
    eyebrow: "Plan your journey",
    title: "Where to first?",
    cta: "Talk to a planner",
  },
};
