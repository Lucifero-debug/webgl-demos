import Link from "next/link";

/**
 * Only finished demos appear. Flip `ready` to true when a new one is done;
 * a visitor should never land on a list with unfinished work in it.
 */
const demos = [
  {
    href: "/shop",
    title: "Product configurator",
    note: "Three textured colourways, switched live on a real product model.",
    ready: true,
  },
  {
    href: "/travel",
    title: "Scroll journey",
    note: "Procedural terrain with a camera flown along a scroll path.",
    ready: false,
  },
  {
    href: "/clinic",
    title: "Clinic",
    note: "A single glossy object, slow orbit, calm typography.",
    ready: false,
  },
].filter((demo) => demo.ready);

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-[46rem] flex-col justify-center px-6 py-20 text-[#17181A]">
      <h1 className="text-[clamp(2rem,5vw,3rem)] font-semibold leading-[1.05] tracking-[-0.03em]">
        Interactive 3D, built to stay fast on a phone
      </h1>
      <p className="mt-5 max-w-[34rem] text-[15px] leading-relaxed text-[#5B5F63]">
        Built in Next.js and React Three Fiber. Each page paints a static
        poster first, so the 3D scene loads without costing the page its speed
        score.
      </p>

      <ul className="mt-14 border-t border-[#D3D5D6]">
        {demos.map((demo) => (
          <li key={demo.href} className="border-b border-[#D3D5D6]">
            <Link
              href={demo.href}
              className="group flex items-baseline justify-between gap-6 py-5 outline-offset-4 focus-visible:outline-2 focus-visible:outline-[#17181A]"
            >
              <span>
                <span className="block text-[17px] font-medium group-hover:underline">
                  {demo.title}
                </span>
                <span className="mt-1 block text-[14px] text-[#5B5F63]">
                  {demo.note}
                </span>
              </span>
              <span aria-hidden="true" className="shrink-0 text-[15px] text-[#8A8F93] transition-transform group-hover:translate-x-1">
                →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
