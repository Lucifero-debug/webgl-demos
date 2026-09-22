"use client";

import {
  lazy,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import CanvasStage, { type CameraSetup } from "@/components/CanvasStage";
import { distanceKm, formatCoordinates, latLonToArray } from "@/lib/journey/geo";
import { anchorKey, beats, explore } from "@/lib/journey/overlay";
import type { Destination, ItineraryStop, JourneyConfig } from "@/lib/journey/types";
import { runtime } from "@/lib/showcase/runtime";
import { localTime, useNow } from "@/lib/stage/clock";
import { useDirector } from "@/lib/stage/director";
import { useFrameLoop, usePinned } from "@/lib/stage/pinned";
import { dwell } from "@/lib/stage/timing";
import { useScrollStory } from "@/lib/stage/useScrollStory";

/**
 * The globe, fetched only when the canvas mounts, after the poster has
 * painted. A plain import would pull Three.js into the page's first
 * download.
 */
const GlobeScene = lazy(() => import("@/components/journey/GlobeScene"));

/*
  The page half of a globe journey.

  The text does not scroll. Each beat's panel sits in one fixed layer and
  swaps in place as the camera settles: it fades out as the camera leaves
  and in as it arrives, so the flights play with nothing over them. The
  page itself is just empty screens, one per beat, to give the scroll its
  length.

  Photos and labels are HTML pinned to points on the globe: the scene
  publishes where those points are on screen every frame (lib/journey/
  overlay.ts), and these components follow them.

  At the finale the globe becomes explorable: drag to turn it, pick a
  destination (on the globe or in the list) to fly to it.

  Headlines use the serif set up in the route's page file (--font-serif).
*/

const theme = {
  "--ink": "#EEF1F5",
  "--muted": "#8E99A8",
  "--gold": "#F2C38B",
  "--hairline": "rgba(255, 255, 255, 0.12)",
} as CSSProperties;

const serif = "font-[family-name:var(--font-serif)]";
const two = (n: number) => String(n).padStart(2, "0");
const dayLabel = (days: string) => `Day${/[–-]/.test(days) ? "s" : ""} ${days}`;

/* ------------------------------------------------------------------ */
/* Live local time                                                     */
/* ------------------------------------------------------------------ */

/** "06:14 in Kyoto", with a small pulsing dot to say it's live. */
function LiveTime({
  now,
  destination,
  withName = true,
}: {
  now: Date | null;
  destination: Destination;
  withName?: boolean;
}) {
  if (!now) return null;
  return (
    <span className="inline-flex items-center gap-2 tabular-nums">
      <span className="live-dot text-[color:var(--gold)]" aria-hidden="true" />
      <span>
        {localTime(now, destination.timeZone)}
        {withName ? ` in ${destination.name}` : ""}
      </span>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Text panels                                                         */
/* ------------------------------------------------------------------ */

/**
 * A soft shade behind the text so it reads over the planet, which fills
 * the frame in close-ups: from the text's side on landscape screens, from
 * the bottom on portrait ones.
 */
const SCRIM = {
  left:
    "landscape:bg-[linear-gradient(90deg,rgba(4,6,10,0.82)_0%,rgba(4,6,10,0.5)_30%,rgba(4,6,10,0)_55%)] " +
    "portrait:bg-[linear-gradient(0deg,rgba(4,6,10,0.88)_0%,rgba(4,6,10,0.55)_38%,rgba(4,6,10,0)_62%)]",
  right:
    "landscape:bg-[linear-gradient(270deg,rgba(4,6,10,0.82)_0%,rgba(4,6,10,0.5)_30%,rgba(4,6,10,0)_55%)] " +
    "portrait:bg-[linear-gradient(0deg,rgba(4,6,10,0.88)_0%,rgba(4,6,10,0.55)_38%,rgba(4,6,10,0)_62%)]",
};

/**
 * One beat's text, fixed in place. The rise-in comes from the data-reveal
 * styles in globals.css, driven here by `active` instead of by scroll
 * position.
 */
function Panel({
  active,
  align,
  wide = false,
  children,
}: {
  active: boolean;
  align: "left" | "right";
  wide?: boolean;
  children: ReactNode;
}) {
  const right = align === "right";
  return (
    <div className="absolute inset-0 flex items-end px-6 pb-16 landscape:items-center landscape:px-10 landscape:pb-0">
      <div
        aria-hidden="true"
        className={`absolute inset-0 transition-opacity duration-700 ${SCRIM[align]} ${
          active ? "opacity-100" : "opacity-0"
        }`}
      />
      <div
        data-reveal
        data-shown={active ? "true" : "false"}
        aria-hidden={!active}
        className={`relative w-full max-w-[520px] ${
          wide ? "landscape:max-w-[min(560px,34vw)]" : "landscape:max-w-[min(520px,27.5vw)]"
        } ${right ? "landscape:ml-auto landscape:text-right" : ""}`}
      >
        {children}
      </div>
    </div>
  );
}

/** Small photo thumbnails, for panels. */
function Thumbnails({ destination }: { destination: Destination }) {
  return (
    <div className="flex gap-2">
      {destination.photos.map((photo) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={photo.src}
          src={photo.src}
          alt={photo.alt}
          loading="lazy"
          decoding="async"
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
          className="aspect-[3/4] w-[72px] rounded-[2px] object-cover"
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Layers pinned to the globe                                          */
/* ------------------------------------------------------------------ */

/**
 * Photos floating above a destination on arrival, joined to its marker by
 * a fine line. Landscape only: on portrait screens there is no room beside
 * the text, so the arrival panel shows thumbnails instead.
 */
function PhotoStack({ destination, active }: { destination: Destination; active: boolean }) {
  const el = useRef<HTMLDivElement>(null);
  usePinned(el, anchorKey.stop(destination.id), active);
  const count = destination.photos.length;

  return (
    <div
      ref={el}
      aria-hidden={!active}
      className="pointer-events-none absolute left-0 top-0 hidden opacity-0 transition-opacity duration-500 landscape:block"
    >
      {/* The line from the destination up to its photos. Sizes follow the
          screen's height, so on short laptop screens the photos stay clear
          of the header instead of climbing into it. */}
      <span className="absolute bottom-[10px] left-0 h-[min(62px,7vh)] w-px bg-gradient-to-t from-[color:var(--gold)] to-transparent" />
      <div className="absolute bottom-[min(80px,9vh)] left-0 flex -translate-x-1/2 items-end gap-4">
        {destination.photos.map((photo, i) => {
          // A loose fan: outer photos tilt outwards, the middle one sits higher.
          const middle = (count - 1) / 2;
          const tilt = (i - middle) * 3;
          const lift = i === Math.round(middle) ? -14 : 0;
          return (
            <figure
              key={photo.src}
              className="w-[min(150px,17vh)] transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
              style={{
                transitionDelay: active ? `${150 + i * 110}ms` : "0ms",
                opacity: active ? 1 : 0,
                transform: `translateY(${active ? lift : lift + 24}px) rotate(${tilt}deg)`,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.src}
                alt={photo.alt}
                loading="lazy"
                decoding="async"
                onError={(event) => {
                  // A photo not added yet: hide the card, not a broken icon.
                  event.currentTarget.parentElement!.style.display = "none";
                }}
                className="aspect-[3/4] w-full rounded-[2px] object-cover shadow-[0_18px_40px_rgba(0,0,0,0.55)]"
              />
              <figcaption className="mt-2 text-[11px] text-[color:var(--ink)] [text-shadow:0_1px_8px_rgba(0,0,0,0.9)]">
                {photo.caption}
              </figcaption>
            </figure>
          );
        })}
      </div>
    </div>
  );
}

/** One day-by-day label, pinned beside its stop on the globe. */
function DayLabel({
  destinationId,
  index,
  stop,
  active,
}: {
  destinationId: string;
  index: number;
  stop: ItineraryStop;
  active: boolean;
}) {
  const el = useRef<HTMLDivElement>(null);
  usePinned(el, anchorKey.day(destinationId, index), active);

  // Placed on its chosen side of the pin, a little clear of it.
  const place = {
    right: "left-[12px] top-0 -translate-y-1/2",
    left: "right-[12px] top-0 -translate-y-1/2 text-right",
    above: "bottom-[10px] left-0 -translate-x-1/2 text-center",
    below: "top-[10px] left-0 -translate-x-1/2 text-center",
  }[stop.label];

  return (
    <div
      ref={el}
      className="pointer-events-none absolute left-0 top-0 opacity-0 transition-opacity duration-500"
      style={{ transitionDelay: active ? `${300 + index * 140}ms` : "0ms" }}
    >
      <span
        className={`absolute whitespace-nowrap leading-tight [text-shadow:0_1px_10px_rgba(0,0,0,0.9)] ${place}`}
      >
        <span className="block text-[11px] tabular-nums text-[color:var(--gold)]">
          {dayLabel(stop.days)}
        </span>
        <span className="block text-[14px]">{stop.name}</span>
      </span>
    </div>
  );
}

/**
 * In the finale, each destination's label on the globe: its name and live
 * time, clickable to fly there.
 */
function GlobeLabel({
  destination,
  active,
  selected,
  now,
  onPick,
}: {
  destination: Destination;
  active: boolean;
  selected: boolean;
  now: Date | null;
  onPick: () => void;
}) {
  const el = useRef<HTMLDivElement>(null);
  usePinned(el, anchorKey.stop(destination.id), active, true);

  return (
    <div
      ref={el}
      className="pointer-events-none absolute left-0 top-0 opacity-0 transition-opacity duration-500"
    >
      <button
        type="button"
        onClick={onPick}
        aria-label={`Fly to ${destination.name}`}
        className={`absolute bottom-[14px] left-0 -translate-x-1/2 whitespace-nowrap rounded-full border px-3 py-1.5 text-[12px] backdrop-blur-md transition-colors outline-offset-2 focus-visible:outline-2 focus-visible:outline-[color:var(--gold)] ${
          selected
            ? "border-[color:var(--gold)] bg-[rgba(242,195,139,0.14)]"
            : "border-[color:var(--hairline)] bg-[rgba(4,6,10,0.55)] hover:border-[color:var(--gold)]"
        }`}
      >
        <span className="flex items-center gap-2">
          <span>{destination.name}</span>
          {now && (
            <span className="text-[color:var(--muted)]">
              <LiveTime now={now} destination={destination} withName={false} />
            </span>
          )}
        </span>
      </button>
    </div>
  );
}

/**
 * During each flight: the two places, a dot travelling between them, and
 * the distance counting up. Driven straight from the scroll position, so it
 * matches the camera exactly.
 */
function FlightReadout({ destinations }: { destinations: Destination[] }) {
  const box = useRef<HTMLDivElement>(null);
  const from = useRef<HTMLSpanElement>(null);
  const to = useRef<HTMLSpanElement>(null);
  const dot = useRef<HTMLSpanElement>(null);
  const km = useRef<HTMLSpanElement>(null);
  const current = useRef(-1);

  const flights = useMemo(
    () =>
      destinations.slice(0, -1).map((a, k) => {
        const b = destinations[k + 1];
        return { from: a.name, to: b.name, km: distanceKm(a.lat, a.lon, b.lat, b.lon) };
      }),
    [destinations],
  );

  useFrameLoop(() => {
    if (!box.current) return;
    const x = runtime.progress * (beats.count(destinations.length) - 1);

    let flying = -1;
    let t = 0;
    flights.forEach((_, k) => {
      const start = beats.route(k);
      if (x > start && x < start + 1) {
        const p = dwell(x - start);
        if (p > 0.02 && p < 0.98) {
          flying = k;
          t = p;
        }
      }
    });

    box.current.style.opacity = flying >= 0 ? "1" : "0";
    if (flying < 0) return;

    const flight = flights[flying];
    if (current.current !== flying) {
      current.current = flying;
      from.current!.textContent = flight.from;
      to.current!.textContent = flight.to;
    }
    dot.current!.style.left = `${t * 100}%`;
    km.current!.textContent = `${Math.round(flight.km * t).toLocaleString("en-US")} of ${Math.round(
      flight.km,
    ).toLocaleString("en-US")} km`;
  });

  return (
    <div
      ref={box}
      aria-hidden="true"
      // A small frosted panel: the readout often sits over bright snow or
      // desert mid-flight, where bare grey text disappears.
      className="pointer-events-none absolute left-1/2 w-[min(380px,84vw)] -translate-x-1/2 rounded-[3px] border border-[color:var(--hairline)] bg-[rgba(4,6,10,0.55)] px-5 py-4 opacity-0 backdrop-blur-md transition-opacity duration-500 portrait:top-24 landscape:bottom-10"
    >
      <div className="flex justify-between text-[13px]">
        <span ref={from} />
        <span ref={to} />
      </div>
      <div className="relative mt-3 h-px bg-[color:var(--hairline)]">
        <span
          ref={dot}
          className="absolute top-1/2 h-[7px] w-[7px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[color:var(--gold)] shadow-[0_0_12px_rgba(242,195,139,0.8)]"
        />
      </div>
      <p className="mt-3 text-center text-[12px] tabular-nums text-[color:var(--muted)]">
        <span ref={km} />
      </p>
    </div>
  );
}

/**
 * The finale's drag surface: turns the globe, with a flick carrying on and
 * slowing to a stop. Horizontal drags turn, vertical ones tip it north or
 * south. On touch screens vertical swipes still scroll the page (pan-y),
 * so a visitor can't get stuck at the bottom.
 */
function DragSurface({ active, onDragStart }: { active: boolean; onDragStart: () => void }) {
  const drag = useRef<{ x: number; y: number; moved: boolean; velocity: number } | null>(null);

  const down = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { x: event.clientX, y: event.clientY, moved: false, velocity: 0 };
    explore.spin = 0;
  };

  const move = (event: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    const dx = event.clientX - d.x;
    const dy = event.clientY - d.y;
    d.x = event.clientX;
    d.y = event.clientY;
    if (!d.moved && Math.abs(dx) + Math.abs(dy) > 3) {
      d.moved = true;
      onDragStart();
    }
    const turn = -dx * 0.005;
    explore.yaw += turn;
    explore.pitch = Math.max(-0.55, Math.min(0.55, explore.pitch + dy * 0.004));
    explore.lastDrag = performance.now();
    d.velocity = turn;
  };

  const up = () => {
    if (drag.current?.moved) explore.spin = drag.current.velocity;
    drag.current = null;
  };

  return (
    <div
      aria-hidden="true"
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      className={`fixed inset-0 z-[12] touch-pan-y ${
        active ? "pointer-events-auto cursor-grab active:cursor-grabbing" : "pointer-events-none"
      }`}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function Journey({ config }: { config: JourneyConfig }) {
  const { brand, hero, destinations, finale, credit } = config;
  const sections = beats.count(destinations.length);

  const { section, settled, atEnd } = useScrollStory(sections);
  const shows = (index: number) => section === index && settled;
  const now = useNow();

  /** The destination picked in the finale, if any. */
  const [picked, setPicked] = useState<number | null>(null);

  const pick = (index: number) => {
    setPicked(index);
    explore.request = index;
  };
  const goHome = () => {
    setPicked(null);
    explore.request = "home";
  };

  /*
    Recording mode (?record, then Space): every beat, with time for each
    flight to play and each headline to be read, then the finale's
    interactions: a flick of the globe, a pick, and back home.
  */
  useDirector(async ({ wait, toBeat }) => {
    await wait(2500);
    for (let i = 1; i < sections; i++) {
      await toBeat(i, 2600);
      await wait(3000);
    }
    await wait(800);
    explore.lastDrag = performance.now();
    explore.spin = 0.035;
    await wait(3000);
    pick(0);
    await wait(4200);
    goHome();
    await wait(3000);
  });

  // Leaving the finale puts the explorer back to its resting state.
  useEffect(() => {
    if (!atEnd) setPicked(null);
  }, [atEnd]);

  // Start further out than the opening shot, so the globe drifts in.
  const camera = useMemo<CameraSetup>(() => {
    const { lat, lon, distance } = config.views.hero;
    const [x, y, z] = latLonToArray(lat, lon);
    const d = distance * 1.3;
    return { position: [x * d, y * d, z * d], fov: 30 };
  }, [config]);

  const finaleShown = shows(sections - 1);
  const exploring = finaleShown && atEnd;

  return (
    <main className="relative text-[color:var(--ink)]" style={theme}>
      {/* Fixed stage: deep space, a faint glow behind the globe, the 3D scene. */}
      <div className="fixed inset-0">
        <div className="pointer-events-none absolute inset-0 bg-[#04060A]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(55%_70%_at_66%_46%,#0F1D33_0%,#070C16_55%,transparent_100%)]" />
        <div className="pointer-events-none absolute inset-0 z-10">
          <CanvasStage
            camera={camera}
            frameloop="always"
            posterFit="contain"
            poster={config.poster}
            posterAlt={`${brand}: the Earth from space`}
          >
            <GlobeScene config={config} />
          </CanvasStage>
        </div>
      </div>

      {/* The finale's drag surface, under the labels and text. */}
      <DragSurface
        active={exploring}
        onDragStart={() => {
          if (picked !== null) goHome();
        }}
      />

      {/* Pinned to the globe: photos, day labels, finale labels. */}
      <div className="pointer-events-none fixed inset-0 z-[15]">
        {destinations.map((d, i) => (
          <PhotoStack key={d.id} destination={d} active={shows(beats.arrive(i))} />
        ))}
        {destinations.map((d, i) =>
          d.itinerary.stops.map((stop, k) => (
            <DayLabel
              key={`${d.id}-${k}`}
              destinationId={d.id}
              index={k}
              stop={stop}
              active={shows(beats.route(i))}
            />
          )),
        )}
        {destinations.map((d, i) => (
          <GlobeLabel
            key={`${d.id}-label`}
            destination={d}
            active={exploring}
            selected={picked === i}
            now={now}
            onPick={() => pick(i)}
          />
        ))}
      </div>

      {/* Fixed text: one panel at a time, swapped as the camera settles. */}
      <div className="pointer-events-none fixed inset-0 z-20">
        <Panel active={shows(0)} align="left" wide>
          <p className="text-[13px] text-[color:var(--gold)]">{hero.eyebrow}</p>
          <h1 className={`${serif} mt-4 text-[clamp(3.5rem,7vw,7.5rem)] leading-[0.9]`}>
            {hero.title}
          </h1>
          <p className="mt-6 max-w-[36ch] text-[17px] leading-relaxed text-[color:var(--muted)]">
            {hero.tagline}
          </p>
        </Panel>

        {destinations.map((d, index) => {
          const right = d.align === "right";
          return [
            <Panel key={`${d.id}-arrive`} active={shows(beats.arrive(index))} align={d.align}>
              {/* Portrait screens have no room beside the text for the photo stack. */}
              <div className="mb-5 landscape:hidden">
                <Thumbnails destination={d} />
              </div>
              <p className="text-[13px] tabular-nums text-[color:var(--gold)]">
                {two(index + 1)} of {two(destinations.length)}, {d.country}
              </p>
              <h2 className={`${serif} mt-4 text-[clamp(2.75rem,4.6vw,5.25rem)] leading-[0.95]`}>
                {d.title}
              </h2>
              <p
                className={`mt-5 max-w-[36ch] text-[16px] leading-relaxed text-[color:var(--muted)] ${
                  right ? "landscape:ml-auto" : ""
                }`}
              >
                {d.body}
              </p>
              <div
                className={`mt-6 flex flex-wrap gap-x-6 gap-y-1 text-[13px] tabular-nums text-[color:var(--muted)] ${
                  right ? "landscape:justify-end" : ""
                }`}
              >
                <span>{formatCoordinates(d.lat, d.lon)}</span>
                <LiveTime now={now} destination={d} />
                <span>{d.days} days</span>
                <span className="text-[color:var(--gold)]">{d.price}</span>
              </div>
            </Panel>,

            <Panel key={`${d.id}-route`} active={shows(beats.route(index))} align={d.align}>
              <p className="text-[13px] text-[color:var(--gold)]">{d.name}, day by day</p>
              <h2 className={`${serif} mt-4 text-[clamp(2.5rem,4vw,4.5rem)] leading-[0.95]`}>
                {d.itinerary.title}
              </h2>
              <ol className="mt-7 space-y-4">
                {d.itinerary.stops.map((stop) => (
                  <li
                    key={stop.name}
                    className={`flex gap-4 ${right ? "landscape:flex-row-reverse" : ""}`}
                  >
                    <span className="w-[68px] shrink-0 pt-[2px] text-[13px] tabular-nums text-[color:var(--gold)]">
                      {dayLabel(stop.days)}
                    </span>
                    <span>
                      <span className="block text-[15px]">{stop.name}</span>
                      <span className="block text-[13px] leading-snug text-[color:var(--muted)]">
                        {stop.note}
                      </span>
                    </span>
                  </li>
                ))}
              </ol>
            </Panel>,
          ];
        })}

        {/* Finale, resting: every journey, each one a way into the globe. */}
        <Panel active={exploring && picked === null} align="left">
          <p className="text-[13px] text-[color:var(--gold)]">{finale.eyebrow}</p>
          <h2 className={`${serif} mt-4 text-[clamp(2.75rem,4.6vw,5.25rem)] leading-[0.95]`}>
            {finale.title}
          </h2>
          <ul className="mt-8 border-t border-[color:var(--hairline)]">
            {destinations.map((d, i) => (
              <li key={d.id} className="border-b border-[color:var(--hairline)]">
                <button
                  type="button"
                  onClick={() => pick(i)}
                  tabIndex={exploring ? 0 : -1}
                  className={`group flex w-full items-baseline justify-between gap-4 py-4 text-left outline-offset-2 focus-visible:outline-2 focus-visible:outline-[color:var(--gold)] ${
                    exploring ? "pointer-events-auto" : ""
                  }`}
                >
                  <span>
                    <span className="block text-[16px] group-hover:text-[color:var(--gold)]">
                      {d.name}
                    </span>
                    <span className="block text-[13px] text-[color:var(--muted)]">
                      {d.country}, {d.days} days
                    </span>
                  </span>
                  <span className="text-right text-[13px] text-[color:var(--muted)]">
                    <span className="block text-[14px] tabular-nums text-[color:var(--gold)]">
                      {d.price}
                    </span>
                    <LiveTime now={now} destination={d} withName={false} />
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-[13px] text-[color:var(--muted)]">
            Drag the globe to turn it, or choose a journey to fly there.
          </p>
        </Panel>

        {/* Finale, picked: one journey, with the camera flown to it. */}
        {destinations.map((d, index) => (
          <Panel key={`${d.id}-picked`} active={exploring && picked === index} align="left">
            <p className="text-[13px] tabular-nums text-[color:var(--gold)]">
              {two(index + 1)} of {two(destinations.length)}, {d.country}
            </p>
            <h2 className={`${serif} mt-4 text-[clamp(2.5rem,4.2vw,4.75rem)] leading-[0.95]`}>
              {d.title}
            </h2>
            <div className="mt-6">
              <Thumbnails destination={d} />
            </div>
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-1 text-[13px] tabular-nums text-[color:var(--muted)]">
              <LiveTime now={now} destination={d} />
              <span>{d.days} days</span>
              <span className="text-[color:var(--gold)]">{d.price}</span>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-5">
              <a
                href="#"
                tabIndex={exploring && picked === index ? 0 : -1}
                className={`inline-flex h-12 items-center bg-[color:var(--gold)] px-6 text-[14px] font-medium text-[#0B0E14] outline-offset-4 transition-[filter] hover:brightness-110 focus-visible:outline-2 focus-visible:outline-[color:var(--gold)] ${
                  exploring && picked === index ? "pointer-events-auto" : ""
                }`}
              >
                {finale.cta}
              </a>
              <button
                type="button"
                onClick={goHome}
                tabIndex={exploring && picked === index ? 0 : -1}
                className={`text-[14px] text-[color:var(--muted)] underline underline-offset-4 hover:text-[color:var(--ink)] ${
                  exploring && picked === index ? "pointer-events-auto" : ""
                }`}
              >
                Back to the globe
              </button>
            </div>
          </Panel>
        ))}

        <FlightReadout destinations={destinations} />

        <p
          className={`absolute bottom-10 right-6 flex items-center gap-3 text-[12px] text-[color:var(--muted)] transition-opacity duration-500 md:right-10 ${
            shows(0) ? "opacity-100" : "opacity-0"
          }`}
        >
          Scroll
          <span className="scroll-line" aria-hidden="true" />
        </p>
      </div>

      {/*
        Above the text layer, so the brand never sits under a headline. The
        shadow keeps it readable in close-ups, where the planet fills the
        top of the frame.
      */}
      <header className="pointer-events-none fixed inset-x-0 top-0 z-30 flex items-baseline justify-between px-6 pt-6 [text-shadow:0_1px_12px_rgba(0,0,0,0.9)] md:px-10 md:pt-8">
        <span className={`${serif} text-[24px] leading-none`}>{brand}</span>
        {/* Required by the textures' CC BY 4.0 licence. Keep it. */}
        <span className="max-w-[50vw] text-right text-[11px] text-[color:var(--ink)] opacity-75">
          {credit}
        </span>
      </header>

      {/* The scroll's length: one empty screen per beat. */}
      <div aria-hidden="true">
        {Array.from({ length: sections }, (_, i) => (
          <div key={i} className="h-svh" />
        ))}
      </div>
    </main>
  );
}
