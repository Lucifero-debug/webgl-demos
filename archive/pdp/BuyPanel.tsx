"use client";

import type { ReactNode, RefObject } from "react";
import { CheckIcon, HeartIcon, StarIcon } from "@/components/icons";
import {
  colorways,
  formatPrice,
  product,
  type Colorway,
} from "@/lib/colorways";

function Stars({ rating }: { rating: number }) {
  const row = (
    <span className="flex">
      {Array.from({ length: 5 }, (_, i) => (
        <StarIcon key={i} className="h-4 w-4 shrink-0" />
      ))}
    </span>
  );

  // Two rows of stars; the dark one is clipped to the rating.
  return (
    <span
      role="img"
      aria-label={`Rated ${rating} out of 5`}
      className="relative inline-flex text-[#D3D5D6]"
    >
      {row}
      <span
        className="absolute inset-y-0 left-0 overflow-hidden text-[#17181A]"
        style={{ width: `${(rating / 5) * 100}%` }}
      >
        {row}
      </span>
    </span>
  );
}

function Section({
  title,
  open = false,
  children,
}: {
  title: string;
  open?: boolean;
  children: ReactNode;
}) {
  return (
    <details open={open} className="group border-b border-[#E3E5E6]">
      <summary className="flex cursor-pointer items-center justify-between py-5 text-[15px] font-medium outline-offset-2 focus-visible:outline-2 focus-visible:outline-[#17181A]">
        {title}
        {/* Plus that becomes a minus when open. */}
        <span aria-hidden="true" className="relative h-3 w-3">
          <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-current" />
          <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-current transition-transform duration-200 group-open:scale-y-0" />
        </span>
      </summary>
      <div className="pb-6 text-[14px] leading-relaxed text-[#3D4044]">
        {children}
      </div>
    </details>
  );
}

type Props = {
  colorway: Colorway;
  onColorway: (colorway: Colorway) => void;
  size: string | null;
  onSize: (size: string) => void;
  sizeError: boolean;
  added: boolean;
  onAdd: () => void;
  saved: boolean;
  onSave: () => void;
  addRef: RefObject<HTMLButtonElement | null>;
  sizeRef: RefObject<HTMLDivElement | null>;
};

export default function BuyPanel({
  colorway,
  onColorway,
  size,
  onSize,
  sizeError,
  added,
  onAdd,
  saved,
  onSave,
  addRef,
  sizeRef,
}: Props) {
  return (
    <div>
      <p className="text-[13px] text-[#6B7075]">{product.category}</p>
      <h1 className="mt-1 text-[clamp(1.75rem,2.6vw,2.125rem)] font-semibold leading-[1.1] tracking-[-0.02em]">
        {product.name}
      </h1>

      <a
        href="#reviews"
        className="mt-3 inline-flex items-center gap-2 text-[13px] text-[#3D4044] underline-offset-4 hover:underline"
      >
        <Stars rating={product.rating} />
        <span className="tabular-nums">
          {product.rating} ({product.reviews} reviews)
        </span>
      </a>

      <p className="mt-5 text-[20px] font-medium tabular-nums">
        {formatPrice(product.price)}
      </p>
      <p className="mt-1 text-[13px] text-[#6B7075]">
        or 4 interest-free payments of {formatPrice(product.price / 4)}
      </p>

      {/* Colour */}
      <div className="mt-8">
        <p className="text-[14px]">
          <span className="font-medium">Colour</span>
          <span className="text-[#6B7075]"> {colorway.name}</span>
        </p>
        <div role="radiogroup" aria-label="Colour" className="mt-3 flex gap-3">
          {colorways.map((way) => {
            const selected = way.id === colorway.id;
            return (
              <button
                key={way.id}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={way.name}
                onClick={() => onColorway(way)}
                className={`h-11 w-11 rounded-full p-[3px] outline-offset-2 transition-shadow focus-visible:outline-2 focus-visible:outline-[#17181A] ${
                  selected
                    ? "ring-[1.5px] ring-[#17181A]"
                    : "ring-1 ring-[#D3D5D6] hover:ring-[#9DA3A6]"
                }`}
              >
                <span
                  className="block h-full w-full rounded-full"
                  style={{
                    background: `linear-gradient(135deg, ${way.swatch} 0 55%, ${way.accent} 55% 100%)`,
                  }}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* Size */}
      <div className="mt-8">
        <div className="flex items-baseline justify-between">
          <p className="text-[14px] font-medium">Size (US)</p>
          <a
            href="#"
            className="text-[13px] text-[#3D4044] underline underline-offset-4"
          >
            Size guide
          </a>
        </div>

        <div
          ref={sizeRef}
          role="radiogroup"
          aria-label="Size (US)"
          aria-describedby={sizeError ? "size-error" : undefined}
          className={`mt-3 grid scroll-mt-28 grid-cols-4 gap-2 sm:grid-cols-5 ${
            sizeError ? "outline outline-1 outline-offset-4 outline-[#C2272D]" : ""
          }`}
        >
          {product.sizes.map((option) => {
            const soldOut = colorway.soldOut.includes(option);
            const selected = option === size;
            return (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={soldOut ? `US ${option}, sold out` : `US ${option}`}
                disabled={soldOut}
                onClick={() => onSize(option)}
                className={`h-12 border text-[14px] tabular-nums outline-offset-2 transition-colors focus-visible:outline-2 focus-visible:outline-[#17181A] ${
                  soldOut
                    ? "cursor-not-allowed border-[#E3E5E6] bg-[linear-gradient(to_top_right,transparent_calc(50%-0.5px),#E3E5E6_50%,transparent_calc(50%+0.5px))] text-[#A9ADB0]"
                    : selected
                      ? "border-[#17181A] ring-1 ring-inset ring-[#17181A]"
                      : "border-[#D3D5D6] hover:border-[#17181A]"
                }`}
              >
                {option}
              </button>
            );
          })}
        </div>

        {sizeError && (
          <p id="size-error" className="mt-3 text-[13px] text-[#C2272D]">
            Select a size to add this to your bag.
          </p>
        )}
      </div>

      <button
        ref={addRef}
        type="button"
        onClick={onAdd}
        className="mt-8 flex h-14 w-full items-center justify-center gap-2 bg-[#17181A] text-[15px] font-medium text-white outline-offset-2 transition-colors hover:bg-[#2E3033] focus-visible:outline-2 focus-visible:outline-[#17181A]"
      >
        {added ? (
          <>
            <CheckIcon className="h-5 w-5" />
            Added to bag
          </>
        ) : (
          "Add to bag"
        )}
      </button>

      <button
        type="button"
        onClick={onSave}
        aria-pressed={saved}
        className="mt-3 flex h-14 w-full items-center justify-center gap-2 border border-[#D3D5D6] text-[15px] font-medium outline-offset-2 transition-colors hover:border-[#17181A] focus-visible:outline-2 focus-visible:outline-[#17181A]"
      >
        <HeartIcon filled={saved} className="h-5 w-5" />
        {saved ? "Saved" : "Save for later"}
      </button>

      <div className="mt-6 space-y-1 text-[13px] text-[#3D4044]">
        <p>Free delivery on orders over $100.</p>
        <p>Free returns within 30 days.</p>
      </div>

      <div className="mt-10 border-t border-[#E3E5E6]">
        <Section title="Description" open>
          <p>
            A daily trainer for easy miles and everything between. The
            seamless knit upper moves with your foot instead of against it,
            and a foam midsole keeps its bounce long after the first run.
          </p>
        </Section>

        <Section title="Details">
          <ul className="space-y-1">
            <li>Seamless engineered knit upper</li>
            <li>Foam midsole, 8 mm heel-to-toe drop</li>
            <li>Rubber outsole with flex grooves</li>
            <li>Weight: 255 g (US 9)</li>
            <li className="tabular-nums">Style: {colorway.sku}</li>
          </ul>
        </Section>

        <Section title="Materials & care">
          <p>
            Upper: recycled polyester knit. Midsole: EVA foam. Outsole:
            rubber. Hand wash cold with mild soap and air dry away from
            direct heat.
          </p>
        </Section>

        <Section title="Delivery & returns">
          <p>
            Standard delivery in 3 to 5 working days, free on orders over
            $100. Return unworn items within 30 days for a full refund.
          </p>
        </Section>
      </div>
    </div>
  );
}
