"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import ArchStory from "@/components/clinic/ArchStory";
import NavStory from "@/components/clinic/NavStory";
import RoboticStory from "@/components/clinic/RoboticStory";
import EnquiryForm from "@/components/clinic/EnquiryForm";
import { PhoneMark, WhatsAppMark } from "@/components/clinic/marks";
import type { ClinicConfig } from "@/lib/clinic/types";
import { telLink, waLink } from "@/lib/clinic/whatsapp";

/*
  The clinic's landing page, below the 3D story.

  The 3D explains the treatment. These sections do the rest of the job a
  patient needs before they ring: who is holding the drill, what else he
  does, the questions everyone asks, and where to come.

  Dark and gold, following the clinic's own logo, so the page reads as his
  brand rather than as a medical leaflet. His photographs are cut-outs on
  transparent backgrounds, so they sit directly on the page rather than in
  boxes. One per section, each beside something it illustrates.
*/

const serif = "font-[family-name:var(--font-serif)]";

/**
 * Rises in when it arrives on screen.
 *
 * Most of what people mean by "feels expensive" is this: content that
 * arrives rather than being already there. Once only, because a section
 * that re-animates every time you scroll past it is irritating.
 */
function Reveal({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const el = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = el.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      node.dataset.shown = "true";
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          node.dataset.shown = "true";
          observer.disconnect();
        }
      },
      { threshold: 0.18 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={el} data-reveal data-shown="false" style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

function Heading({ label, title, body }: { label: string; title: string; body?: string }) {
  return (
    <header className="max-w-[46ch]">
      <p className="text-[13px] tracking-wide text-[color:var(--accent)]">{label}</p>
      <h2 className={`${serif} mt-3 text-[clamp(2rem,3.6vw,3.25rem)] font-light leading-[1.04]`}>
        {title}
      </h2>
      {body && (
        <p className="mt-4 text-[16px] leading-relaxed text-[color:var(--muted)]">{body}</p>
      )}
    </header>
  );
}

/**
 * Before and after in one frame: the "after" picture underneath, the
 * "before" on top, cut off at the handle. A native range input does the
 * dragging, so it works with a finger, a mouse and the arrow keys.
 */
function Compare({ title, before, after }: { title: string; before: string; after: string }) {
  const [split, setSplit] = useState(50);
  const pic = "absolute inset-0 h-full w-full object-contain";
  return (
    <figure>
      <div className="relative aspect-[4/3] overflow-hidden bg-[#18191A] select-none">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={after} alt={`${title}, after`} className={pic} loading="lazy" decoding="async" />
        <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={before} alt={`${title}, before`} className={pic} loading="lazy" decoding="async" />
        </div>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 w-px bg-[color:var(--accent)]"
          style={{ left: `${split}%` }}
        >
          <span className="absolute left-1/2 top-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[color:var(--accent)] text-[13px] text-[#14161A]">
            ↔
          </span>
        </div>
        <span className="pointer-events-none absolute left-3 top-3 bg-black/55 px-2 py-1 text-[11px]">Before</span>
        <span className="pointer-events-none absolute right-3 top-3 bg-black/55 px-2 py-1 text-[11px]">After</span>
        <input
          type="range"
          min={0}
          max={100}
          value={split}
          onChange={(e) => setSplit(Number(e.target.value))}
          aria-label={`${title}: drag to compare before and after`}
          className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
        />
      </div>
      <figcaption className="mt-3 text-[14px]">{title}</figcaption>
    </figure>
  );
}

/**
 * A YouTube video that costs nothing until it is played: a thumbnail and a
 * play button, swapped for the real player on click. Four embedded players
 * would otherwise download several megabytes of YouTube before anyone has
 * asked for one.
 */
function Video({ id, index }: { id: string; index: number }) {
  const [playing, setPlaying] = useState(false);
  if (playing) {
    return (
      <iframe
        className="aspect-video w-full"
        src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
        title={`Patient testimonial ${index + 1}`}
        allow="autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
      />
    );
  }
  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      className="group relative block aspect-video w-full overflow-hidden bg-[#18191A]"
      aria-label={`Play patient testimonial ${index + 1}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
        alt=""
        className="h-full w-full object-cover opacity-80 transition-opacity group-hover:opacity-100"
        loading="lazy"
        decoding="async"
      />
      <span className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[color:var(--accent)] pl-1 text-[18px] text-[#14161A] transition-transform group-hover:scale-105">
        ▶
      </span>
    </button>
  );
}

const section = "border-t border-[color:var(--hairline)] px-6 py-24 md:px-10 md:py-32";

/**
 * Tilts its contents towards the mouse, like a card held up to the light,
 * with a soft glare that follows the pointer. CSS 3D only, no WebGL.
 *
 * Mouse only: on a touch screen a finger is scrolling, not hovering.
 * Off for visitors who ask for reduced motion.
 */
function Tilt({ children, className = "", max = 7 }: { children: ReactNode; className?: string; max?: number }) {
  const el = useRef<HTMLDivElement>(null);
  const glare = useRef<HTMLSpanElement>(null);

  const move = (event: ReactPointerEvent<HTMLDivElement>) => {
    const node = el.current;
    if (!node || event.pointerType !== "mouse") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rect = node.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    node.style.transition = "transform 120ms ease-out";
    node.style.transform = `perspective(1000px) rotateX(${(-y * max).toFixed(2)}deg) rotateY(${(x * max).toFixed(2)}deg) scale(1.02)`;
    if (glare.current) {
      glare.current.style.opacity = "1";
      glare.current.style.background = `radial-gradient(circle at ${((x + 0.5) * 100).toFixed(1)}% ${((y + 0.5) * 100).toFixed(1)}%, rgba(255,240,210,0.22), rgba(255,240,210,0) 55%)`;
    }
  };

  const leave = () => {
    const node = el.current;
    if (!node) return;
    node.style.transition = "transform 600ms cubic-bezier(.2,.7,.2,1)";
    node.style.transform = "";
    if (glare.current) glare.current.style.opacity = "0";
  };

  return (
    <div
      ref={el}
      onPointerMove={move}
      onPointerLeave={leave}
      className={`relative will-change-transform [transform-style:preserve-3d] ${className}`}
    >
      {children}
      <span
        ref={glare}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 mix-blend-screen transition-opacity duration-300"
      />
    </div>
  );
}

type Feature = NonNullable<ClinicConfig["features"]>[number];

/**
 * One of his own pictures beside a short story. Alternate ones put the
 * picture on the other side, so a run of them doesn't read as a template.
 */
function FeatureSection({ feature, flip }: { feature: Feature; flip: boolean }) {
  // No picture: one column, held to a reading width. A two-column grid
  // with nothing in the second column leaves the text stretched across
  // the page beside an empty half.
  const columns = !feature.image
    ? "lg:max-w-[52rem]"
    : // The picture's column stays the narrow one on whichever side it sits.
      feature.tall
      ? flip
        ? "lg:grid-cols-[0.6fr_1fr]"
        : "lg:grid-cols-[1fr_0.6fr]"
      : flip
        ? "lg:grid-cols-[0.85fr_1fr]"
        : "lg:grid-cols-[1fr_0.85fr]";

  return (
    <section className={`relative overflow-hidden ${section}`}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(45%_55%_at_70%_50%,rgba(217,179,108,0.10)_0%,rgba(217,179,108,0)_70%)]" />
      <div className={`relative mx-auto grid max-w-[72rem] items-center gap-12 ${columns}`}>
        <div className={flip && feature.image ? "lg:order-2" : ""}>
          <Reveal>
            <Heading label={feature.label} title={feature.title} body={feature.body} />
            {feature.figures && (
              <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-6 border-t border-[color:var(--hairline)] pt-7 sm:grid-cols-3">
                {feature.figures.map((item) => (
                  <div key={item.label}>
                    <dt className="font-[family-name:var(--font-serif)] text-[clamp(1.5rem,2.6vw,2rem)] font-light leading-none text-[color:var(--accent)]">
                      {item.figure}
                    </dt>
                    <dd className="mt-1.5 text-[12px] leading-snug text-[color:var(--muted)]">{item.label}</dd>
                  </div>
                ))}
              </dl>
            )}
            {feature.points && (
              <ul className="mt-9 space-y-3 border-t border-[color:var(--hairline)] pt-7 text-[15px]">
                {feature.points.map((point) => (
                  <li key={point} className="flex gap-3">
                    <span aria-hidden="true" className="text-[color:var(--accent)]">—</span>
                    {point}
                  </li>
                ))}
              </ul>
            )}
            {feature.link && (
              <a
                href={feature.link.href}
                target="_blank"
                rel="noreferrer"
                className="mt-9 inline-flex h-12 items-center border border-[color:var(--hairline)] px-6 text-[14px] font-medium transition-colors hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]"
              >
                {feature.link.text}
              </a>
            )}
          </Reveal>
        </div>
        {feature.image && (
          <div className={flip ? "lg:order-1" : ""}>
            <Reveal delay={120}>
              <Tilt className={`mx-auto w-full ${feature.tall ? "max-w-[380px]" : "max-w-[520px]"}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={feature.image}
                  alt={feature.imageAlt || ""}
                  className="block w-full shadow-[0_40px_90px_rgba(0,0,0,0.6)]"
                  loading="lazy"
                  decoding="async"
                />
              </Tilt>
            </Reveal>
          </div>
        )}
      </div>
    </section>
  );
}

export default function ClinicDetails({ config }: { config: ClinicConfig }) {
  const {
    doctor,
    stats,
    treatments,
    technology,
    gallery,
    recognition,
    reasons,
    testimonials,
    faq,
    priceList,
    visit,
    branches,
    socials,
    features,
    arch,
    navigated,
    robotic,
    clinic,
    ctaHref,
    contact,
    brand,
    website,
  } = config;
  // Shown without the scheme or the www: a web address a patient reads,
  // not a URL.
  const websiteLabel = website?.replace(/^https?:\/\/(www\.)?/i, "").replace(/\/$/, "");

  const gold =
    "inline-flex h-12 items-center bg-[color:var(--accent)] px-6 text-[14px] font-semibold text-[#14161A] transition-colors hover:bg-[#E8C68A]";
  const outline =
    "inline-flex h-12 items-center border border-[color:var(--hairline)] px-6 text-[14px] font-medium transition-colors hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]";

  const featuresAfter = (where: Feature["after"]) =>
    (features ?? [])
      .map((feature, i) => ({ feature, i }))
      .filter(({ feature }) => feature.after === where)
      .map(({ feature, i }) => <FeatureSection key={feature.title} feature={feature} flip={i % 2 === 1} />);

  return (
    <div className="relative z-20 bg-[color:var(--ground)]">
      {/* The dentist: the first thing after the 3D, and the reason a
          patient chooses this clinic over the one down the road. */}
      {doctor && (
        <section className="relative overflow-hidden px-6 py-24 md:px-10 md:py-32">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_75%_40%,rgba(217,179,108,0.14)_0%,rgba(217,179,108,0)_70%)]" />
          <div className="relative mx-auto grid max-w-[72rem] items-center gap-12 lg:grid-cols-[1fr_0.85fr]">
            <Reveal>
              <p className="text-[13px] tracking-wide text-[color:var(--accent)]">The dentist</p>
              <h2 className={`${serif} mt-3 text-[clamp(2.4rem,4.6vw,4rem)] font-light leading-[1.02]`}>
                {doctor.name}
              </h2>
              <p className="mt-3 text-[15px] text-[color:var(--accent)]">{doctor.credentials}</p>
              <p className="text-[13px] text-[color:var(--muted)]">{doctor.role}</p>
              <div className="mt-7 space-y-4 text-[17px] leading-relaxed text-[color:var(--muted)]">
                {doctor.bio.map((para) => (
                  <p key={para.slice(0, 24)}>{para}</p>
                ))}
              </div>
              <dl className="mt-10 grid grid-cols-3 gap-4 border-t border-[color:var(--hairline)] pt-7">
                {doctor.proof.map((item) => (
                  <div key={item.label}>
                    <dt className={`${serif} text-[clamp(1.6rem,3.2vw,2.4rem)] font-light text-[color:var(--accent)]`}>
                      {item.figure}
                    </dt>
                    <dd className="mt-1 text-[12px] leading-snug text-[color:var(--muted)]">
                      {item.label}
                    </dd>
                  </div>
                ))}
              </dl>
              <a href={ctaHref} className={`mt-9 ${gold}`}>
                Book a consultation
              </a>
            </Reveal>

            <Reveal delay={120}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={doctor.photo}
                alt={doctor.name}
                className="mx-auto w-full max-w-[460px] drop-shadow-[0_40px_80px_rgba(0,0,0,0.6)]"
                loading="lazy"
                decoding="async"
              />
            </Reveal>
          </div>
        </section>
      )}

      {featuresAfter("doctor")}

      {/* The clinic in numbers, straight after the man who runs it. */}
      {stats && stats.length > 0 && (
        <section className="border-t border-[color:var(--hairline)] px-6 py-16 md:px-10 md:py-20">
          <Reveal>
            <dl className="mx-auto grid max-w-[72rem] grid-cols-2 gap-x-8 gap-y-10 md:grid-cols-4">
              {stats.map((item) => (
                <div key={item.label}>
                  <dt className={`${serif} text-[clamp(2rem,3.6vw,3rem)] font-light leading-none text-[color:var(--accent)]`}>
                    {item.figure}
                  </dt>
                  <dd className="mt-2 text-[13px] leading-snug text-[color:var(--muted)]">{item.label}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </section>
      )}

      {treatments && (
        <section className="border-t border-[color:var(--hairline)] px-6 py-24 md:px-10 md:py-32">
          <div className="mx-auto grid max-w-[72rem] items-center gap-12 lg:grid-cols-[1fr_0.72fr]">
            <Reveal>
              <Heading label={treatments.label} title={treatments.title} />
              <dl className="mt-12 grid gap-x-12 gap-y-7 sm:grid-cols-2">
                {treatments.items.map((item) => (
                  <div key={item.name} className="border-t border-[color:var(--hairline)] pt-4">
                    <dt className="text-[16px]">{item.name}</dt>
                    <dd className="mt-1.5 text-[14px] leading-relaxed text-[color:var(--muted)]">
                      {item.detail}
                    </dd>
                  </div>
                ))}
              </dl>
            </Reveal>
            {treatments.photo && (
              <Reveal delay={120}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={treatments.photo}
                  alt=""
                  aria-hidden="true"
                  className="mx-auto hidden w-full max-w-[400px] drop-shadow-[0_30px_60px_rgba(0,0,0,0.55)] lg:block"
                  loading="lazy"
                  decoding="async"
                />
              </Reveal>
            )}
          </div>
        </section>
      )}

      {/* Full-arch in 3D, then his own poster of a real full-arch case. */}
      {arch && <ArchStory arch={arch} ctaHref={ctaHref} />}

      {featuresAfter("treatments")}

      {technology && (
        <section className={section}>
          <div className="mx-auto max-w-[72rem]">
            <Reveal>
              <Heading label={technology.label} title={technology.title} body={technology.body} />
            </Reveal>
            <div className="mt-12 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
              {technology.items.map((item, i) => (
                <Reveal key={item.name} delay={(i % 4) * 80}>
                  <figure>
                    <Tilt max={9}>
                    <div className="aspect-[4/3] overflow-hidden bg-[#18191A]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.photo}
                        alt={item.name}
                        className="h-full w-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                    </Tilt>
                    <figcaption className="mt-4">
                      <span className="block text-[16px]">{item.name}</span>
                      <span className="mt-1 block text-[14px] leading-relaxed text-[color:var(--muted)]">
                        {item.detail}
                      </span>
                    </figcaption>
                  </figure>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* X-Nav navigated surgery in 3D, its price building up beside it:
          the clinic's technology, shown at work. Kept apart from the
          full-arch story on purpose -- two 3D stories back to back blur
          into one and neither lands (the client's call, 16 Oct 2026). */}
      {navigated && <NavStory nav={navigated} ctaHref={ctaHref} />}

      {gallery && (
        <section className={section}>
          <div className="mx-auto max-w-[72rem]">
            <div className="grid items-end gap-10 md:grid-cols-[1fr_auto]">
              <Reveal>
                <Heading label={gallery.label} title={gallery.title} body={gallery.body} />
              </Reveal>
              {gallery.photo && (
                <Reveal delay={120}>
                  <Tilt className="w-fit">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={gallery.photo}
                      alt={gallery.photoAlt ?? ""}
                      className="block w-[220px] shadow-[0_30px_70px_rgba(0,0,0,0.55)] md:w-[260px]"
                      loading="lazy"
                      decoding="async"
                    />
                  </Tilt>
                </Reveal>
              )}
            </div>
            <div className="mt-12 grid gap-x-8 gap-y-12 md:grid-cols-2">
              {gallery.items.map((item, i) => (
                <Reveal key={item.title} delay={(i % 2) * 100}>
                  <Compare {...item} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {recognition && (
        <section className={`relative overflow-hidden ${section}`}>
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_50%_at_50%_30%,rgba(217,179,108,0.12)_0%,rgba(217,179,108,0)_70%)]" />
          <div className="relative mx-auto max-w-[72rem]">
            <Reveal>
              <Heading label={recognition.label} title={recognition.title} body={recognition.body} />
            </Reveal>
            <ol className="mt-12 grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-5">
              {recognition.awards.map((award, i) => (
                <li key={award.year}>
                  <Reveal delay={i * 80}>
                    {award.photo && (
                      <Tilt max={14} className="w-fit">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={award.photo}
                          alt={`${award.year} award trophy`}
                          className="block h-36 w-auto object-contain"
                          loading="lazy"
                          decoding="async"
                        />
                      </Tilt>
                    )}
                    <p className={`${serif} mt-4 text-[28px] font-light leading-none text-[color:var(--accent)]`}>
                      {award.year}
                    </p>
                    <p className="mt-2 text-[15px] leading-snug">{award.name}</p>
                    <p className="mt-1 text-[13px] text-[color:var(--muted)]">{award.by}</p>
                  </Reveal>
                </li>
              ))}
            </ol>

            {recognition.honour && (
              <Reveal>
                <figure className="mt-20 grid items-center gap-8 border-t border-[color:var(--hairline)] pt-12 md:grid-cols-[0.9fr_1fr]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={recognition.honour.photo}
                    alt={recognition.honour.text}
                    className="w-full object-contain"
                    loading="lazy"
                    decoding="async"
                  />
                  <figcaption className={`${serif} text-[clamp(1.6rem,2.8vw,2.4rem)] font-light leading-[1.15]`}>
                    {recognition.honour.text}
                  </figcaption>
                </figure>
              </Reveal>
            )}

            {!!(recognition.ratings?.length || recognition.press?.length) && (
              <Reveal>
                <div className="mt-20 grid gap-12 border-t border-[color:var(--hairline)] pt-12 lg:grid-cols-2">
                  {recognition.ratings && recognition.ratings.length > 0 && (
                    <div>
                      {recognition.reviewsLine && <p className="text-[17px]">{recognition.reviewsLine}</p>}
                      <ul className="mt-6 grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-4">
                        {recognition.ratings.map((r) => (
                          <li key={r.site} className="flex items-baseline justify-between border-b border-[color:var(--hairline)] pb-2 text-[14px]">
                            <span className="text-[color:var(--muted)]">{r.site}</span>
                            <span className="tabular-nums text-[color:var(--accent)]">{r.score}★</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {recognition.press && recognition.press.length > 0 && (
                    <div>
                      <p className="text-[13px] tracking-wide text-[color:var(--accent)]">Featured in</p>
                      <ul className={`${serif} mt-5 flex flex-wrap gap-x-7 gap-y-3 text-[clamp(1.1rem,1.8vw,1.4rem)] font-light`}>
                        {recognition.press.map((name) => (
                          <li key={name}>{name}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </Reveal>
            )}
          </div>
        </section>
      )}

      {reasons && (
        <section className={section}>
          <div className="mx-auto max-w-[72rem]">
            <Reveal>
              <Heading label={reasons.label} title={reasons.title} />
            </Reveal>
            <div className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
              {reasons.groups.map((group, i) => (
                <Reveal key={group.title} delay={i * 80}>
                  <div className="border-t border-[color:var(--accent)] pt-5">
                    <h3 className="text-[17px]">{group.title}</h3>
                    <ul className="mt-4 space-y-2 text-[14px] leading-relaxed text-[color:var(--muted)]">
                      {group.points.map((point) => (
                        <li key={point}>{point}</li>
                      ))}
                    </ul>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {featuresAfter("reasons")}

      {/* Full-mouth robotic rehabilitation in 3D, its price building up
          beside it. Well apart from the other 3D stories: two back to back
          blur into one (the client's call, 16 Oct 2026). */}
      {robotic && <RoboticStory story={robotic} ctaHref={ctaHref} />}

      {testimonials && testimonials.videos.length > 0 && (
        <section className={section}>
          <div className="mx-auto max-w-[72rem]">
            <Reveal>
              <Heading label={testimonials.label} title={testimonials.title} body={testimonials.body} />
            </Reveal>
            <div className="mt-12 grid gap-6 md:grid-cols-2">
              {testimonials.videos.map((id, i) => (
                <Reveal key={id} delay={(i % 2) * 100}>
                  <Video id={id} index={i} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {priceList && (
        <section id="prices" className={section}>
          <div className="mx-auto max-w-[72rem]">
            <Reveal>
              <Heading label={priceList.label} title={priceList.title} body={priceList.body} />
            </Reveal>
            <Reveal delay={100}>
              <div className="mt-12 grid gap-x-12 lg:grid-cols-2">
                {[0, 1].map((col) => (
                  <div key={col} className="divide-y divide-[color:var(--hairline)] border-y border-[color:var(--hairline)] lg:border-b-0 [&:last-child]:border-t-0 lg:[&:last-child]:border-t">
                    {/* Split in two halves, not alternately, so on a phone
                        (one column) the groups keep their order. */}
                    {priceList.groups
                      .slice(col === 0 ? 0 : Math.ceil(priceList.groups.length / 2), col === 0 ? Math.ceil(priceList.groups.length / 2) : undefined)
                      .map((group, i) => (
                        /* Native details, like the FAQ: no script needed, and the
                           browser's find reaches the prices inside. The first
                           group (implants, the reason for this page) starts open. */
                        <details key={group.title} className="group py-5" open={col === 0 && i === 0}>
                          <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-[17px] transition-colors hover:text-[color:var(--accent)]">
                            {group.title}
                            <span className="shrink-0 text-[color:var(--accent)] transition-transform duration-300 group-open:rotate-45">
                              +
                            </span>
                          </summary>
                          <ul className="mt-4">
                            {group.rows.map((row) => (
                              <li
                                key={row.item}
                                className="flex items-baseline justify-between gap-6 border-t border-[color:var(--hairline)] py-2.5 text-[14px]"
                              >
                                <span className="text-[color:var(--muted)]">{row.item}</span>
                                <span className="shrink-0 text-right tabular-nums">
                                  {row.price}
                                  {row.usd && (
                                    <span className="block text-[12px] text-[color:var(--muted)]">{row.usd}</span>
                                  )}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </details>
                      ))}
                  </div>
                ))}
              </div>
            </Reveal>
            <p className="mt-8 max-w-[62ch] text-[12px] leading-relaxed text-[color:var(--muted)]">{priceList.note}</p>
            <a href={ctaHref} className={`mt-8 ${gold}`}>
              Book a consultation
            </a>
          </div>
        </section>
      )}

      {faq && (
        <section className="border-t border-[color:var(--hairline)] px-6 py-24 md:px-10 md:py-32">
          <div className="mx-auto max-w-[72rem]">
            <Reveal>
              <Heading label={faq.label} title={faq.title} />
            </Reveal>
            <Reveal delay={100}>
              <div className="mt-12 divide-y divide-[color:var(--hairline)] border-y border-[color:var(--hairline)]">
                {faq.items.map((item) => (
                  /*
                    Native details elements: they work without JavaScript,
                    the browser's own find reaches inside them, and screen
                    readers already understand them.
                  */
                  <details key={item.q} className="group py-5">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-[17px] transition-colors hover:text-[color:var(--accent)]">
                      {item.q}
                      <span className="shrink-0 text-[color:var(--accent)] transition-transform duration-300 group-open:rotate-45">
                        +
                      </span>
                    </summary>
                    <p className="mt-3 max-w-[62ch] text-[15px] leading-relaxed text-[color:var(--muted)]">
                      {item.a}
                    </p>
                  </details>
                ))}
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {visit && (
        <section
          id="visit"
          className="relative overflow-hidden border-t border-[color:var(--hairline)] px-6 py-24 md:px-10 md:py-32"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_60%_at_30%_50%,rgba(217,179,108,0.12)_0%,rgba(217,179,108,0)_70%)]" />
          <div className="relative mx-auto grid max-w-[72rem] gap-12 lg:grid-cols-[1fr_0.72fr] lg:items-center">
            <Reveal>
              <Heading label={visit.label} title={visit.title} body={visit.body} />
              <dl className="mt-9 space-y-5 text-[15px]">
                {branches && branches.length > 0 ? (
                  branches.map((branch) => (
                    <div key={branch.name}>
                      <dt className="text-[12px] text-[color:var(--muted)]">{branch.name}</dt>
                      <dd>
                        {branch.address}{" "}
                        <a
                          className="whitespace-nowrap text-[13px] text-[color:var(--accent)] hover:underline"
                          href={branch.directions}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Directions
                        </a>
                      </dd>
                    </div>
                  ))
                ) : (
                  <div>
                    <dt className="text-[12px] text-[color:var(--muted)]">Clinic</dt>
                    <dd>{clinic.address}</dd>
                  </div>
                )}
                {clinic.phone && (
                  <div>
                    <dt className="text-[12px] text-[color:var(--muted)]">Phone</dt>
                    <dd>
                      <a className="hover:text-[color:var(--accent)]" href={`tel:${clinic.phone.replace(/\s/g, "")}`}>
                        {clinic.phone}
                      </a>
                    </dd>
                  </div>
                )}
                {clinic.hoursText && (
                  <div>
                    <dt className="text-[12px] text-[color:var(--muted)]">Hours</dt>
                    <dd className="text-[color:var(--muted)]">{clinic.hoursText}</dd>
                  </div>
                )}
              </dl>
              <div className="mt-9 flex flex-wrap gap-3">
                <a className={gold} href={ctaHref}>
                  Book a consultation
                </a>
                {visit.mapUrl && (
                  <a className={outline} href={visit.mapUrl} target="_blank" rel="noreferrer">
                    Get directions
                  </a>
                )}
                {website && (
                  <a className={outline} href={website}>
                    Main website
                  </a>
                )}
              </div>
            </Reveal>
            {visit.photo && (
              <Reveal delay={120}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={visit.photo}
                  alt=""
                  aria-hidden="true"
                  className="mx-auto w-full max-w-[400px] drop-shadow-[0_30px_60px_rgba(0,0,0,0.55)]"
                  loading="lazy"
                  decoding="async"
                />
              </Reveal>
            )}
          </div>
          {/* A map per branch. Loaded lazily: two Google Maps frames are
              heavy, and most visitors never scroll this far. */}
          {branches && branches.length > 0 && (
            <div className="relative mx-auto mt-16 grid max-w-[72rem] gap-6 md:grid-cols-2">
              {branches.map((branch) => (
                <figure key={branch.name}>
                  <iframe
                    src={branch.mapEmbed}
                    title={`Map: ${brand}, ${branch.name}`}
                    className="aspect-[4/3] w-full border-0 grayscale-[0.4] invert-[0.9] hue-rotate-180"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                  <figcaption className="mt-3 text-[14px]">
                    {branch.name}
                    <span className="text-[color:var(--muted)]"> · {branch.address}</span>
                  </figcaption>
                </figure>
              ))}
            </div>
          )}
        </section>
      )}

      {/*
        The enquiry form in the page, not only in the dialog.

        The floating bar's "Enquire" button is for whoever has already
        decided; this is for whoever read to the end. Same form (one
        EnquiryForm, so the two cannot drift), with the two direct routes
        beside it, because a patient who would rather just ring should not
        have to fill anything in.
      */}
      {contact && (
        <section
          id="enquiry"
          className="relative overflow-hidden border-t border-[color:var(--hairline)] px-6 py-24 md:px-10 md:py-32"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(45%_55%_at_70%_50%,rgba(217,179,108,0.12)_0%,rgba(217,179,108,0)_70%)]" />
          {/*
            Two columns of roughly equal weight: his poster under the
            heading on one side, the form on the other.

            The quick-contact buttons sit UNDER the form rather than under
            the heading, and that is what makes the poster fit. With the
            buttons, hours and link all stacked on the left, the poster had
            to shrink to about 200px to keep the two sides level -- at
            which point its own small type is unreadable and it is a
            decoration rather than a claim. Moved across, the left column
            has room for it at a size you can actually read, and the right
            column's form plus buttons comes out to about the same height.
          */}
          <div className="relative mx-auto grid max-w-[72rem] gap-12 lg:grid-cols-[1fr_0.9fr] lg:items-start">
            <Reveal>
              <Heading
                label={contact.form?.label || "Enquiry"}
                title={contact.form?.title || "Send an enquiry"}
                body={contact.form?.body}
              />

              {/*
                His recognition poster, here rather than in the awards
                section. Among the trophies it was a second, louder telling
                of the same thing; beside the form it is doing a job --
                this is the moment a patient decides whether to hand over
                their number, and it answers "who am I writing to?" without
                another paragraph of copy.
              */}
              {recognition?.poster && (
                <figure className="mt-10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={recognition.poster.image}
                    alt={recognition.poster.alt}
                    className="block w-full max-w-[480px] shadow-[0_30px_70px_rgba(0,0,0,0.55)]"
                    loading="lazy"
                    decoding="async"
                  />
                  {/* Balanced, and held to the picture's own width: the
                      last outlet was dropping onto a line of its own. */}
                  {recognition.poster.caption && (
                    <figcaption className="mt-4 max-w-[480px] text-[12px] leading-relaxed text-[color:var(--muted)] [text-wrap:balance]">
                      {recognition.poster.caption}
                    </figcaption>
                  )}
                </figure>
              )}
            </Reveal>

            <Reveal delay={120}>
              <div className="border border-[color:var(--hairline)] bg-white/[0.02] p-6 md:p-8">
                <EnquiryForm config={config} />
              </div>

              {/* For whoever would rather not type at all. */}
              <p className="mt-9 text-[13px] text-[color:var(--muted)]">Or reach him directly</p>
              <div className="mt-3 flex flex-wrap gap-3">
                <a
                  href={waLink(contact.whatsapp, contact.openingMessage || "")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-12 items-center gap-2 bg-[#25D366] px-6 text-[14px] font-semibold text-[#0B1C11] transition-colors hover:bg-[#3BDE7C]"
                >
                  <WhatsAppMark />
                  {contact.whatsappLabel || "WhatsApp"}
                </a>
                <a href={telLink(contact.phone)} className={`${outline} gap-2`}>
                  <PhoneMark />
                  {contact.phone}
                </a>
              </div>
              {clinic.hoursText && (
                <p className="mt-5 text-[13px] text-[color:var(--muted)]">{clinic.hoursText}</p>
              )}
              {/* For the patient who would rather read than message: his
                  own clinic page, named so they can see where it goes. */}
              {website && (
                <a
                  href={website}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-6 inline-flex items-center gap-2 border-b border-[color:var(--hairline)] pb-1 text-[13px] text-[color:var(--accent)] transition-colors hover:border-[color:var(--accent)]"
                >
                  More about the clinic at {websiteLabel}
                  <span aria-hidden="true">→</span>
                </a>
              )}
            </Reveal>
          </div>
        </section>
      )}

      {/* Extra room at the bottom on a phone: the contact bar is fixed over
          it, and would otherwise cover the last line. */}
      <footer className="border-t border-[color:var(--hairline)] px-6 pb-24 pt-10 md:px-10 md:pb-10">
        <div className="mx-auto flex max-w-[72rem] flex-wrap items-center justify-between gap-4 text-[12px] text-[color:var(--muted)]">
          <span>{brand}</span>
          <span>{branches && branches.length > 1 ? branches.map((b) => b.name).join(" · ") : clinic.address}</span>
          {socials && socials.length > 0 && (
            <span className="flex flex-wrap gap-x-4">
              {socials.map((s) => (
                <a key={s.name} className="hover:text-[color:var(--accent)]" href={s.href} target="_blank" rel="noreferrer">
                  {s.name}
                </a>
              ))}
            </span>
          )}
          {website && (
            <a className="hover:text-[color:var(--accent)]" href={website}>
              {websiteLabel}
            </a>
          )}
        </div>
      </footer>
    </div>
  );
}
