"use client";

import type { Plan, PropertyConfig } from "@/lib/property/types";

/*
  The ordinary page, below the 3D story.

  A developer's site has to do more than impress: a buyer wants plans,
  specifications, distances and a way to get in touch. These sections
  scroll up over the fixed 3D stage on their own solid background, so the
  page reads as a complete property site rather than a 3D toy.

  Everything here is drawn from the config, including the floor plans,
  which are SVG built from room coordinates. No stock photography, nothing
  to license, and it stays sharp at any size.
*/

const ROOM_FILL = {
  room: "#E4E1D9",
  wet: "#D7D9D2",
  balcony: "#DCE3D8",
} as const;

function FloorPlan({ plan }: { plan: Plan }) {
  return (
    <figure>
      <svg
        viewBox="0 0 100 100"
        className="w-full rounded-[3px] border border-[color:var(--hairline)] bg-[#F6F4F0]"
        role="img"
        aria-label={`${plan.name} floor plan, ${plan.size}`}
      >
        {/* The outer wall. */}
        <rect x="2" y="2" width="96" height="96" fill="none" stroke="#1B1A17" strokeWidth="1.2" />
        {plan.rooms.map((room, i) => (
          <g key={`${room.label}-${i}`}>
            <rect
              x={room.x}
              y={room.y}
              width={room.w}
              height={room.h}
              fill={ROOM_FILL[room.kind ?? "room"]}
              stroke="#1B1A17"
              strokeWidth="0.5"
            />
            <text
              x={room.x + room.w / 2}
              y={room.y + room.h / 2 + 1.4}
              textAnchor="middle"
              fontSize="3.4"
              fill="#4A493F"
            >
              {room.label}
            </text>
          </g>
        ))}
      </svg>
      <figcaption className="mt-4 flex items-baseline justify-between gap-4">
        <span>
          <span className="block text-[16px]">{plan.name}</span>
          <span className="block text-[13px] text-[color:var(--muted)]">{plan.size}</span>
        </span>
        <span className="text-[15px] tabular-nums">{plan.price}</span>
      </figcaption>
    </figure>
  );
}

/** A section heading, in the page's own rhythm. */
function Heading({
  label,
  title,
  body,
  serif,
  dark = false,
}: {
  label: string;
  title: string;
  body?: string;
  serif: string;
  dark?: boolean;
}) {
  return (
    <header className="max-w-[46ch]">
      <p className={`text-[13px] ${dark ? "text-[#A9C6A4]" : "text-[color:var(--accent)]"}`}>
        {label}
      </p>
      <h2 className={`${serif} mt-3 text-[clamp(1.9rem,3.2vw,3rem)] leading-[1.08]`}>{title}</h2>
      {body && (
        <p
          className={`mt-4 text-[16px] leading-relaxed ${
            dark ? "text-[#BFC4B7]" : "text-[color:var(--muted)]"
          }`}
        >
          {body}
        </p>
      )}
    </header>
  );
}

export default function Details({
  config,
  serif,
}: {
  config: PropertyConfig;
  serif: string;
}) {
  const { plans, specs, location, enquiry, footer, project, brand, gallery } = config;
  const field =
    "h-12 w-full border border-[color:var(--hairline)] bg-white px-4 text-[15px] outline-none placeholder:text-[#9A998E] focus:border-[color:var(--ink)]";

  return (
    <div className="relative z-20 bg-[color:var(--ground)]">
      {/*
        Photographs, where photographs belong. The 3D above explains the
        building; these sell what living there feels like, which no
        real-time scene will do as well as a camera.
      */}
      {gallery && gallery.items.length > 0 && (
        <section className="border-t border-[color:var(--hairline)] px-6 py-20 md:px-10 md:py-28">
          <div className="mx-auto max-w-[72rem]">
            <Heading
              label={gallery.label}
              title={gallery.title}
              body={gallery.body}
              serif={serif}
            />
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {gallery.items.map((item) => (
                <figure key={item.src}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.src}
                    alt={item.alt}
                    loading="lazy"
                    decoding="async"
                    onError={(event) => {
                      event.currentTarget.parentElement!.style.display = "none";
                    }}
                    className="aspect-[4/5] w-full rounded-[3px] object-cover"
                  />
                  <figcaption className="mt-3 text-[13px] text-[color:var(--muted)]">
                    {item.caption}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Floor plans */}
      <section className="border-t border-[color:var(--hairline)] px-6 py-20 md:px-10 md:py-28">
        <div className="mx-auto max-w-[72rem]">
          <Heading label={plans.label} title={plans.title} body={plans.body} serif={serif} />
          <div className="mt-12 grid gap-10 sm:grid-cols-2 lg:gap-16">
            {plans.items.map((plan) => (
              <FloorPlan key={plan.id} plan={plan} />
            ))}
          </div>
        </div>
      </section>

      {/* Specifications, dark: the page needs a breath between the pale
          sections, and this is the part buyers read most slowly. */}
      <section className="bg-[#26312A] px-6 py-20 text-[#EDEAE2] md:px-10 md:py-28">
        <div className="mx-auto max-w-[72rem]">
          <Heading label={specs.label} title={specs.title} serif={serif} dark />
          <dl className="mt-12 grid gap-x-12 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {specs.groups.map((group) => (
              <div key={group.heading} className="border-t border-white/15 pt-4">
                <dt className="text-[15px]">{group.heading}</dt>
                <dd className="mt-2 space-y-1 text-[14px] leading-relaxed text-[#BFC4B7]">
                  {group.lines.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Location: a list of distances, and the same data as a simple diagram. */}
      <section className="border-t border-[color:var(--hairline)] px-6 py-20 md:px-10 md:py-28">
        <div className="mx-auto grid max-w-[72rem] gap-12 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <div>
            <Heading
              label={location.label}
              title={location.title}
              body={location.body}
              serif={serif}
            />
            <ul className="mt-10 border-t border-[color:var(--hairline)]">
              {location.places.map((place) => (
                <li
                  key={place.name}
                  className="flex items-baseline justify-between gap-6 border-b border-[color:var(--hairline)] py-3"
                >
                  <span className="text-[15px]">{place.name}</span>
                  <span className="shrink-0 text-[14px] tabular-nums text-[color:var(--muted)]">
                    {place.distance} · {place.minutes}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <svg
            viewBox="0 0 100 100"
            className="w-full rounded-[3px] border border-[color:var(--hairline)] bg-[#F6F4F0]"
            role="img"
            aria-label="Distances from the site"
          >
            {/* Rings at even distances, with the site at the centre. */}
            {[18, 32, 46].map((r) => (
              <circle
                key={r}
                cx="50"
                cy="50"
                r={r}
                fill="none"
                stroke="#1B1A17"
                strokeOpacity="0.12"
                strokeWidth="0.4"
              />
            ))}
            {location.places.map((place, i) => {
              const angle = (i / location.places.length) * Math.PI * 2 - Math.PI / 2;
              const radius = 14 + i * 8;
              const x = 50 + Math.cos(angle) * radius;
              const y = 50 + Math.sin(angle) * radius;
              return (
                <g key={place.name}>
                  <line x1="50" y1="50" x2={x} y2={y} stroke="#3F5B45" strokeWidth="0.4" />
                  <circle cx={x} cy={y} r="1.4" fill="#3F5B45" />
                  <text
                    x={x + (x > 50 ? 3 : -3)}
                    y={y + 1}
                    textAnchor={x > 50 ? "start" : "end"}
                    fontSize="3"
                    fill="#4A493F"
                  >
                    {place.name}
                  </text>
                </g>
              );
            })}
            <rect x="46" y="46" width="8" height="8" fill="#1B1A17" />
            <text x="50" y="58.5" textAnchor="middle" fontSize="3.2" fill="#1B1A17">
              {project}
            </text>
          </svg>
        </div>
      </section>

      {/* Enquiry */}
      <section
        id="enquire"
        className="border-t border-[color:var(--hairline)] px-6 py-20 md:px-10 md:py-28"
      >
        <div className="mx-auto grid max-w-[72rem] gap-12 lg:grid-cols-2">
          <Heading
            label={enquiry.label}
            title={enquiry.title}
            body={enquiry.body}
            serif={serif}
          />
          <div>
            {/*
              A real form, but deliberately inert: this is a demonstration
              page, and nothing should be collected from anyone visiting it.
            */}
            <div className="grid gap-3 sm:grid-cols-2">
              <input className={field} placeholder="Your name" aria-label="Your name" disabled />
              <input className={field} placeholder="Phone" aria-label="Phone" disabled />
              <input
                className={`${field} sm:col-span-2`}
                placeholder="Email"
                aria-label="Email"
                disabled
              />
              <select className={`${field} sm:col-span-2`} aria-label="Home type" disabled>
                {plans.items.map((plan) => (
                  <option key={plan.id}>{`${plan.name}, ${plan.size}`}</option>
                ))}
              </select>
            </div>
            <button
              type="button"
              disabled
              className="mt-4 inline-flex h-12 w-full items-center justify-center bg-[color:var(--ink)] px-6 text-[14px] font-medium text-white opacity-60"
            >
              {enquiry.cta}
            </button>
            <p className="mt-4 text-[12px] leading-snug text-[color:var(--muted)]">
              {enquiry.note}
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t border-[color:var(--hairline)] px-6 py-12 md:px-10">
        <div className="mx-auto max-w-[72rem] text-[12px] leading-relaxed text-[color:var(--muted)]">
          <p className="text-[color:var(--ink)]">
            {project}, by {brand}
          </p>
          <p className="mt-3">{footer.rera}</p>
          {footer.lines.map((line) => (
            <p key={line} className="mt-1">
              {line}
            </p>
          ))}
        </div>
      </footer>
    </div>
  );
}
