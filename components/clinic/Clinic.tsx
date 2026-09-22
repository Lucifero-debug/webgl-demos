"use client";

import { lazy, useMemo, useRef, type CSSProperties, type ReactNode } from "react";
import CanvasStage, { type CameraSetup } from "@/components/CanvasStage";
import type { ClinicConfig, PartKey } from "@/lib/clinic/types";
import { anchors } from "@/lib/stage/anchors";
import { useNow, zonedTime } from "@/lib/stage/clock";
import { useDirector } from "@/lib/stage/director";
import { useFrameLoop, usePinned } from "@/lib/stage/pinned";
import { useScrollStory } from "@/lib/stage/useScrollStory";

/**
 * The implant scene, fetched only when the canvas mounts, after the poster
 * has painted. A plain import would pull Three.js into the first download.
 */
const ImplantScene = lazy(() => import("@/components/clinic/ImplantScene"));

/*
  The page half of the clinic explainer. Like the travel demo, the text
  does not scroll: each beat's panel sits in one fixed layer and swaps in
  place as the camera settles, so the parts separate and the camera moves
  with nothing over them.

  Beats: opening, explode, one close-up per part, finale.
  Headlines use the serif set up in the route's page file (--font-serif).
*/

const theme = {
  "--ink": "#14191C",
  "--muted": "#58636C",
  // The abutment's gold, darkened until it reads as text on the pale ground.
  "--accent": "#8C6A2F",
  "--hairline": "rgba(20, 25, 28, 0.14)",
  "--ground": "#E9EDEF",
} as CSSProperties;

const serif = "font-[family-name:var(--font-serif)]";

/* ------------------------------------------------------------------ */
/* Opening hours                                                       */
/* ------------------------------------------------------------------ */

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** "Open now, until 19:00" or "Closed, opens tomorrow at 08:00", in the clinic's own time zone. */
function openStatus(now: Date, clinic: ClinicConfig["clinic"]) {
  const { day, time } = zonedTime(now, clinic.timeZone);
  const today = clinic.hours[day];
  if (today && time >= today[0] && time < today[1]) {
    return { open: true, text: `Open now, until ${today[1]}` };
  }
  if (today && time < today[0]) {
    return { open: false, text: `Closed, opens today at ${today[0]}` };
  }
  for (let ahead = 1; ahead <= 7; ahead++) {
    const next = (day + ahead) % 7;
    const hours = clinic.hours[next];
    if (hours) {
      const when = ahead === 1 ? "tomorrow" : DAY_NAMES[next];
      return { open: false, text: `Closed, opens ${when} at ${hours[0]}` };
    }
  }
  return { open: false, text: "Closed" };
}

function OpenStatus({ now, clinic }: { now: Date | null; clinic: ClinicConfig["clinic"] }) {
  if (!now) return null;
  const status = openStatus(now, clinic);
  return (
    <span className="inline-flex items-center gap-2">
      <span
        aria-hidden="true"
        className={status.open ? "live-dot text-[#3F8F5B]" : "inline-block h-[6px] w-[6px] rounded-full bg-[color:var(--muted)]"}
      />
      {status.text}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Text panels                                                         */
/* ------------------------------------------------------------------ */

/** A soft wash of the page colour behind the text, so it reads over the object. */
const SCRIM = {
  left:
    "landscape:bg-[linear-gradient(90deg,rgba(233,237,239,0.92)_0%,rgba(233,237,239,0.6)_30%,rgba(233,237,239,0)_55%)] " +
    "portrait:bg-[linear-gradient(0deg,rgba(233,237,239,0.95)_0%,rgba(233,237,239,0.7)_40%,rgba(233,237,239,0)_65%)]",
  right:
    "landscape:bg-[linear-gradient(270deg,rgba(233,237,239,0.92)_0%,rgba(233,237,239,0.6)_30%,rgba(233,237,239,0)_55%)] " +
    "portrait:bg-[linear-gradient(0deg,rgba(233,237,239,0.95)_0%,rgba(233,237,239,0.7)_40%,rgba(233,237,239,0)_65%)]",
};

/**
 * One beat's text, fixed in place. The rise-in comes from the data-reveal
 * styles in globals.css, driven here by `active`.
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
    <div className="absolute inset-0 flex items-end px-6 pb-14 landscape:items-center landscape:px-10 landscape:pb-0">
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
          wide ? "landscape:max-w-[min(560px,36vw)]" : "landscape:max-w-[min(480px,30vw)]"
        } ${right ? "landscape:ml-auto landscape:text-right" : ""}`}
      >
        {children}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Pinned to the 3D scene                                              */
/* ------------------------------------------------------------------ */

/**
 * A label drawn to one part while the tooth is separated: a short line
 * from the part's left edge, then its name. Landscape only; on a phone
 * there is no room beside the parts.
 */
function Callout({
  part,
  name,
  detail,
  index,
  active,
}: {
  part: PartKey;
  name: string;
  detail: string;
  index: number;
  active: boolean;
}) {
  const el = useRef<HTMLDivElement>(null);
  usePinned(el, `clinic:${part}:left`, active);
  return (
    <div
      ref={el}
      className="pointer-events-none absolute left-0 top-0 hidden opacity-0 transition-opacity duration-500 landscape:block"
      style={{ transitionDelay: active ? `${250 + index * 120}ms` : "0ms" }}
    >
      <div className="absolute right-0 top-0 flex -translate-y-1/2 items-center gap-3">
        <span className="whitespace-nowrap text-right leading-tight">
          <span className="block text-[14px]">{name}</span>
          <span className="block text-[12px] text-[color:var(--muted)]">{detail}</span>
        </span>
        <span className="h-px w-12 bg-[color:var(--ink)] opacity-35" />
      </div>
    </div>
  );
}

/**
 * A technical dimension line beside the implant, top to bottom, with its
 * length. Follows the implant's projected top and bottom every frame.
 */
function Dimension({ active, label }: { active: boolean; label: string }) {
  const el = useRef<HTMLDivElement>(null);
  useFrameLoop(() => {
    const node = el.current;
    const top = anchors.get("clinic:dim:top");
    const bottom = anchors.get("clinic:dim:bottom");
    if (!node || !top || !bottom) return;
    const dx = bottom.x - top.x;
    const dy = bottom.y - top.y;
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI - 90;
    node.style.transform = `translate3d(${top.x}px, ${top.y}px, 0) rotate(${angle}deg)`;
    node.style.height = `${Math.hypot(dx, dy)}px`;
    node.style.opacity = active && top.visible && bottom.visible ? "1" : "0";
  });
  return (
    <div
      ref={el}
      aria-hidden="true"
      className="pointer-events-none absolute left-0 top-0 w-px origin-top bg-[color:var(--ink)]/50 opacity-0 transition-opacity duration-500"
    >
      <span className="absolute -left-[5px] top-0 h-px w-[11px] bg-[color:var(--ink)]/50" />
      <span className="absolute -left-[5px] bottom-0 h-px w-[11px] bg-[color:var(--ink)]/50" />
      <span className="absolute left-3 top-1/2 -translate-y-1/2 whitespace-nowrap text-[12px] tabular-nums text-[color:var(--ink)]">
        {label}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function Clinic({ config }: { config: ClinicConfig }) {
  const { brand, hero, explode, callouts, parts, finale, clinic } = config;
  const sections = parts.length + 3;
  const { section, settled } = useScrollStory(sections);
  const shows = (index: number) => section === index && settled;
  const now = useNow();

  /* Recording mode (?record, then Space): each beat in turn, at reading pace. */
  useDirector(async ({ wait, toBeat }) => {
    await wait(2500);
    for (let i = 1; i < sections; i++) {
      await toBeat(i, 2000);
      await wait(3000);
    }
    await wait(1500);
  });

  // Start further out than the opening shot, so the tooth drifts in.
  const camera = useMemo<CameraSetup>(() => ({ position: [3.4, 1.1, 7.2], fov: 26 }), []);

  const partIndex = (part: PartKey) => parts.findIndex((p) => p.part === part);
  const implantShown = shows(2 + partIndex("implant"));
  const heroShown = shows(0);
  const finaleShown = shows(sections - 1);

  const button =
    "inline-flex h-12 items-center bg-[color:var(--ink)] px-6 text-[14px] font-medium text-white outline-offset-4 transition-colors hover:bg-[#2A3238] focus-visible:outline-2 focus-visible:outline-[color:var(--ink)]";

  return (
    <main className="relative text-[color:var(--ink)]" style={theme}>
      {/* Fixed stage: a pale studio ground with a soft light behind the object. */}
      <div className="fixed inset-0">
        <div className="pointer-events-none absolute inset-0 bg-[color:var(--ground)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_65%_at_62%_45%,#F8FAFB_0%,rgba(248,250,251,0)_100%)]" />
        <div className="pointer-events-none absolute inset-0 z-10">
          <CanvasStage
            camera={camera}
            frameloop="always"
            posterFit="contain"
            poster={config.poster}
            posterAlt={`${brand}: a dental implant with its crown`}
          >
            <ImplantScene config={config} />
          </CanvasStage>
        </div>
      </div>

      {/* Pinned to the scene: part labels and the implant's dimension line. */}
      <div className="pointer-events-none fixed inset-0 z-[15]">
        {(["crown", "abutment", "implant"] as PartKey[]).map((part, i) => (
          <Callout
            key={part}
            part={part}
            name={callouts[part].name}
            detail={callouts[part].detail}
            index={i}
            active={shows(1)}
          />
        ))}
        <Dimension active={implantShown} label="10 mm" />
      </div>

      {/* Fixed text: one panel at a time, swapped as the camera settles. */}
      <div className="pointer-events-none fixed inset-0 z-20">
        <Panel active={heroShown} align="left" wide>
          <p className="text-[13px] text-[color:var(--accent)]">{hero.eyebrow}</p>
          <h1 className={`${serif} mt-4 text-[clamp(2.75rem,5.4vw,5.75rem)] font-light leading-[0.98]`}>
            {hero.title}
          </h1>
          <p className="mt-6 max-w-[40ch] text-[17px] leading-relaxed text-[color:var(--muted)]">
            {hero.tagline}
          </p>
          <a
            href="#"
            tabIndex={heroShown ? 0 : -1}
            className={`mt-8 ${button} ${heroShown ? "pointer-events-auto" : ""}`}
          >
            {hero.cta}
          </a>
        </Panel>

        <Panel active={shows(1)} align="right">
          <p className="text-[13px] text-[color:var(--accent)]">{explode.label}</p>
          <h2 className={`${serif} mt-4 text-[clamp(2.4rem,4vw,4.25rem)] font-light leading-[1]`}>
            {explode.title}
          </h2>
          <p className="mt-5 text-[16px] leading-relaxed text-[color:var(--muted)] landscape:ml-auto landscape:max-w-[38ch]">
            {explode.body}
          </p>
        </Panel>

        {parts.map((beat, i) => {
          const right = beat.align === "right";
          return (
            <Panel key={beat.part} active={shows(2 + i)} align={beat.align}>
              <p className="text-[13px] text-[color:var(--accent)]">{beat.label}</p>
              <h2 className={`${serif} mt-4 text-[clamp(2.4rem,4vw,4.25rem)] font-light leading-[1]`}>
                {beat.title}
              </h2>
              <p
                className={`mt-5 max-w-[38ch] text-[16px] leading-relaxed text-[color:var(--muted)] ${
                  right ? "landscape:ml-auto" : ""
                }`}
              >
                {beat.body}
              </p>
              <ul
                className={`mt-6 flex flex-wrap gap-x-5 gap-y-1 text-[13px] tabular-nums ${
                  right ? "landscape:justify-end" : ""
                }`}
              >
                {beat.specs.map((spec) => (
                  <li key={spec}>{spec}</li>
                ))}
              </ul>
            </Panel>
          );
        })}

        <Panel active={finaleShown} align="left">
          <p className="text-[13px] text-[color:var(--accent)]">{finale.eyebrow}</p>
          <h2 className={`${serif} mt-4 text-[clamp(2.4rem,4vw,4.25rem)] font-light leading-[1]`}>
            {finale.title}
          </h2>
          {/* Two by two on wide screens: as a single column the finale
              ran up into the header on a laptop. */}
          <ol className="mt-7 grid gap-x-8 gap-y-5 landscape:grid-cols-2">
            {finale.steps.map((step, i) => (
              <li key={step.title} className="border-t border-[color:var(--hairline)] pt-3">
                <span className="block text-[12px] tabular-nums text-[color:var(--accent)]">
                  {String(i + 1).padStart(2, "0")}, {step.when}
                </span>
                <span className="mt-1 block text-[15px]">{step.title}</span>
                <span className="block text-[13px] leading-snug text-[color:var(--muted)] portrait:hidden">
                  {step.detail}
                </span>
              </li>
            ))}
          </ol>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
            <a
              href="#"
              tabIndex={finaleShown ? 0 : -1}
              className={`${button} ${finaleShown ? "pointer-events-auto" : ""}`}
            >
              {finale.cta}
            </a>
            <span className="text-[13px] leading-snug text-[color:var(--muted)]">
              {clinic.address}
              <br />
              {clinic.phone}
            </span>
          </div>
          <p className="mt-6 text-[11px] text-[color:var(--muted)]">{config.note}</p>
        </Panel>

        <p
          className={`absolute bottom-10 right-6 flex items-center gap-3 text-[12px] text-[color:var(--muted)] transition-opacity duration-500 md:right-10 ${
            heroShown ? "opacity-100" : "opacity-0"
          }`}
        >
          Scroll
          <span className="scroll-line" aria-hidden="true" />
        </p>
      </div>

      {/* Above the text: the brand, and whether the clinic is open right now. */}
      <header className="pointer-events-none fixed inset-x-0 top-0 z-30 flex items-baseline justify-between px-6 pt-6 md:px-10 md:pt-8">
        <span className={`${serif} text-[22px] leading-none`}>{brand}</span>
        <span className="text-[12px] text-[color:var(--muted)]">
          <OpenStatus now={now} clinic={clinic} />
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
