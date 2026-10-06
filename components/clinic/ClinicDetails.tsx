"use client";

import { useEffect, useRef, type ReactNode } from "react";
import type { ClinicConfig } from "@/lib/clinic/types";

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

export default function ClinicDetails({ config }: { config: ClinicConfig }) {
  const { doctor, treatments, faq, visit, clinic, ctaHref, brand, website } = config;
  // Shown without the scheme or the www: a web address a patient reads,
  // not a URL.
  const websiteLabel = website?.replace(/^https?:\/\/(www\.)?/i, "").replace(/\/$/, "");

  const gold =
    "inline-flex h-12 items-center bg-[color:var(--accent)] px-6 text-[14px] font-semibold text-[#14161A] transition-colors hover:bg-[#E8C68A]";
  const outline =
    "inline-flex h-12 items-center border border-[color:var(--hairline)] px-6 text-[14px] font-medium transition-colors hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]";

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
                <div>
                  <dt className="text-[12px] text-[color:var(--muted)]">Clinic</dt>
                  <dd>{clinic.address}</dd>
                </div>
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
                <div>
                  <dt className="text-[12px] text-[color:var(--muted)]">Hours</dt>
                  <dd className="text-[color:var(--muted)]">
                    Mon–Sat 9:30–13:30 and 16:30–20:30 · Sun 10:00–13:30
                  </dd>
                </div>
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
        </section>
      )}

      <footer className="border-t border-[color:var(--hairline)] px-6 py-10 md:px-10">
        <div className="mx-auto flex max-w-[72rem] flex-wrap items-center justify-between gap-4 text-[12px] text-[color:var(--muted)]">
          <span>{brand}</span>
          <span>{clinic.address}</span>
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
