"use client";

import type { ClinicConfig } from "@/lib/clinic/types";

/*
  The clinic's landing page, below the 3D story.

  The 3D explains the treatment. These sections do the rest of the job a
  patient needs before they ring: who is holding the drill, what else he
  does, the questions everyone asks, and where to come.

  His photographs are cut-outs on transparent backgrounds, so they sit
  directly on the page's own colour rather than in boxes. Used sparingly:
  one per section, each next to something it illustrates.
*/

const serif = "font-[family-name:var(--font-serif)]";

function Heading({
  label,
  title,
  body,
  dark = false,
}: {
  label: string;
  title: string;
  body?: string;
  dark?: boolean;
}) {
  return (
    <header className="max-w-[46ch]">
      <p className={`text-[13px] ${dark ? "text-[#D9B36C]" : "text-[color:var(--accent)]"}`}>{label}</p>
      <h2 className={`${serif} mt-3 text-[clamp(1.9rem,3.4vw,3rem)] font-light leading-[1.06]`}>{title}</h2>
      {body && (
        <p className={`mt-4 text-[16px] leading-relaxed ${dark ? "text-white/70" : "text-[color:var(--muted)]"}`}>
          {body}
        </p>
      )}
    </header>
  );
}

export default function ClinicDetails({ config }: { config: ClinicConfig }) {
  const { doctor, treatments, faq, visit, clinic, ctaHref, brand, website } = config;
  // Shown without the scheme or the www: a web address a patient reads,
  // not a URL.
  const websiteLabel = website?.replace(/^https?:\/\/(www\.)?/i, "").replace(/\/$/, "");

  return (
    <div className="relative z-20 bg-[color:var(--paper)]">
      {/* The dentist. Dark, because this is the moment the page should
          feel like his brand rather than a medical leaflet. */}
      {doctor && (
        <section className="bg-[#18191A] px-6 py-20 text-white md:px-10 md:py-28">
          <div className="mx-auto grid max-w-[72rem] items-center gap-10 lg:grid-cols-[1fr_0.9fr]">
            <div>
              <Heading label="The dentist" title={doctor.name} dark />
              <p className="mt-2 text-[14px] text-[#D9B36C]">{doctor.credentials}</p>
              <p className="text-[13px] text-white/50">{doctor.role}</p>
              <div className="mt-6 space-y-4 text-[16px] leading-relaxed text-white/75">
                {doctor.bio.map((para) => (
                  <p key={para.slice(0, 24)}>{para}</p>
                ))}
              </div>
              <dl className="mt-9 grid grid-cols-3 gap-4 border-t border-white/15 pt-6">
                {doctor.proof.map((item) => (
                  <div key={item.label}>
                    <dt className={`${serif} text-[clamp(1.5rem,3vw,2.1rem)] text-[#D9B36C]`}>{item.figure}</dt>
                    <dd className="mt-1 text-[12px] leading-snug text-white/60">{item.label}</dd>
                  </div>
                ))}
              </dl>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={doctor.photo}
              alt={doctor.name}
              className="mx-auto w-full max-w-[460px] drop-shadow-[0_30px_60px_rgba(0,0,0,0.5)]"
              loading="lazy"
              decoding="async"
            />
          </div>
        </section>
      )}

      {treatments && (
        <section className="px-6 py-20 md:px-10 md:py-28">
          <div className="mx-auto max-w-[72rem]">
            <div className="grid items-center gap-10 lg:grid-cols-[1fr_0.8fr]">
              <div>
                <Heading label={treatments.label} title={treatments.title} />
                <dl className="mt-10 grid gap-x-10 gap-y-6 sm:grid-cols-2">
                  {treatments.items.map((item) => (
                    <div key={item.name} className="border-t border-[color:var(--hairline)] pt-4">
                      <dt className="text-[15px]">{item.name}</dt>
                      <dd className="mt-1 text-[14px] leading-relaxed text-[color:var(--muted)]">
                        {item.detail}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
              {treatments.photo && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={treatments.photo}
                  alt=""
                  aria-hidden="true"
                  className="mx-auto hidden w-full max-w-[380px] lg:block"
                  loading="lazy"
                  decoding="async"
                />
              )}
            </div>
          </div>
        </section>
      )}

      {faq && (
        <section className="border-t border-[color:var(--hairline)] px-6 py-20 md:px-10 md:py-28">
          <div className="mx-auto max-w-[72rem]">
            <Heading label={faq.label} title={faq.title} />
            <div className="mt-10 divide-y divide-[color:var(--hairline)] border-y border-[color:var(--hairline)]">
              {faq.items.map((item) => (
                /*
                  Native details elements: they work without JavaScript,
                  they are searchable by the browser's own find, and screen
                  readers already understand them.
                */
                <details key={item.q} className="group py-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-[16px]">
                    {item.q}
                    <span className="shrink-0 text-[color:var(--muted)] transition-transform group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="mt-3 max-w-[62ch] text-[15px] leading-relaxed text-[color:var(--muted)]">
                    {item.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      {visit && (
        <section id="visit" className="border-t border-[color:var(--hairline)] px-6 py-20 md:px-10 md:py-28">
          <div className="mx-auto grid max-w-[72rem] gap-10 lg:grid-cols-[1fr_0.8fr] lg:items-center">
            <div>
              <Heading label={visit.label} title={visit.title} body={visit.body} />
              <dl className="mt-8 space-y-4 text-[15px]">
                <div>
                  <dt className="text-[12px] text-[color:var(--muted)]">Clinic</dt>
                  <dd>{clinic.address}</dd>
                </div>
                {clinic.phone && (
                  <div>
                    <dt className="text-[12px] text-[color:var(--muted)]">Phone</dt>
                    <dd>
                      <a className="hover:underline" href={`tel:${clinic.phone.replace(/\s/g, "")}`}>
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
              <div className="mt-8 flex flex-wrap gap-3">
                <a className="inline-flex h-12 items-center bg-[color:var(--ink)] px-6 text-[14px] font-medium text-white" href={ctaHref}>
                  Book a consultation
                </a>
                {visit.mapUrl && (
                  <a
                    className="inline-flex h-12 items-center border border-[color:var(--hairline)] px-6 text-[14px] font-medium"
                    href={visit.mapUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Get directions
                  </a>
                )}
                {website && (
                  <a
                    className="inline-flex h-12 items-center border border-[color:var(--hairline)] px-6 text-[14px] font-medium"
                    href={website}
                  >
                    Main website
                  </a>
                )}
              </div>
            </div>
            {visit.photo && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={visit.photo}
                alt=""
                aria-hidden="true"
                className="mx-auto w-full max-w-[400px]"
                loading="lazy"
                decoding="async"
              />
            )}
          </div>
        </section>
      )}

      <footer className="border-t border-[color:var(--hairline)] px-6 py-10 md:px-10">
        <div className="mx-auto flex max-w-[72rem] flex-wrap items-center justify-between gap-4 text-[12px] text-[color:var(--muted)]">
          <span>{brand}</span>
          <span>{clinic.address}</span>
          {website && (
            <a className="hover:text-[color:var(--ink)] hover:underline" href={website}>
              {websiteLabel}
            </a>
          )}
        </div>
      </footer>
    </div>
  );
}
