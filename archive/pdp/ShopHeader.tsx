"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { BagIcon, CheckIcon, HeartIcon, SearchIcon } from "@/components/icons";

export type BagNotice = {
  id: number;
  name: string;
  colour: string;
  size: string;
  swatch: string;
  accent: string;
  price: string;
};

const NAV = ["New", "Men", "Women", "Running"];

function IconButton({ label, children }: { label: string; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      className="relative flex h-10 w-10 items-center justify-center text-[#17181A] outline-offset-2 hover:bg-[#F2F3F3] focus-visible:outline-2 focus-visible:outline-[#17181A]"
    >
      {children}
    </button>
  );
}

export default function ShopHeader({
  bagCount,
  saved,
  notice,
}: {
  bagCount: number;
  saved: boolean;
  notice: BagNotice | null;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-[#E3E5E6] bg-white">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-5 md:px-8">
        <Link href="/" className="text-[17px] font-semibold tracking-[0.14em]">
          Alder
        </Link>

        <nav aria-label="Main" className="hidden gap-8 text-[14px] md:flex">
          {NAV.map((item) => (
            <a
              key={item}
              href="#"
              aria-current={item === "Running" ? "page" : undefined}
              className={`underline-offset-[6px] hover:underline ${
                item === "Running" ? "font-medium underline" : "text-[#3D4044]"
              }`}
            >
              {item}
            </a>
          ))}
        </nav>

        <div className="relative flex items-center">
          <IconButton label="Search">
            <SearchIcon className="h-[22px] w-[22px]" />
          </IconButton>
          <IconButton label={saved ? "Saved items, 1 item" : "Saved items"}>
            <HeartIcon filled={saved} className="h-[22px] w-[22px]" />
          </IconButton>
          <IconButton label={`Bag, ${bagCount} ${bagCount === 1 ? "item" : "items"}`}>
            <BagIcon className="h-[22px] w-[22px]" />
            {bagCount > 0 && (
              <span className="absolute right-1 top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#17181A] px-1 text-[11px] font-medium tabular-nums text-white">
                {bagCount}
              </span>
            )}
          </IconButton>

          {/* Mini-bag confirmation, the way real shops acknowledge an add. */}
          {notice && (
            <div
              key={notice.id}
              className="absolute right-0 top-[calc(100%+13px)] w-[min(320px,calc(100vw-40px))] border border-[#E3E5E6] bg-white p-4 shadow-[0_16px_40px_rgba(23,24,26,0.12)]"
            >
              <p className="flex items-center gap-2 text-[13px] font-medium">
                <CheckIcon className="h-4 w-4" />
                Added to bag
              </p>
              <div className="mt-3 flex gap-3">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center bg-[#E4E6E7]">
                  <span
                    className="h-6 w-6 rounded-full"
                    style={{
                      background: `linear-gradient(135deg, ${notice.swatch} 0 55%, ${notice.accent} 55% 100%)`,
                    }}
                  />
                </span>
                <div className="min-w-0 text-[13px] leading-snug">
                  <p className="font-medium">{notice.name}</p>
                  <p className="text-[#6B7075]">{notice.colour}</p>
                  <p className="text-[#6B7075]">US {notice.size}</p>
                </div>
                <p className="ml-auto text-[13px] tabular-nums">{notice.price}</p>
              </div>
              <a
                href="#"
                className="mt-4 flex h-11 items-center justify-center bg-[#17181A] text-[13px] font-medium text-white hover:bg-[#2E3033]"
              >
                View bag ({bagCount})
              </a>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
