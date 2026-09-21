"use client";

import { useEffect, useState } from "react";
import { runtime } from "@/lib/showcase/runtime";
import type { ShowcaseConfig } from "@/lib/showcase/types";

/**
 * Shot helper: frames camera shots by eye instead of by maths.
 *
 * Development only. Open the page with ?shots in the URL. Orbit, pan and
 * zoom until the product looks right, slide it clear of the dashed text
 * box, then copy the shot and paste it into the product's config file.
 */

const round = (n: number) => Math.round(n * 1000) / 1000;
const vec = (v: readonly number[]) => `[${v.map(round).join(", ")}]`;

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block">
      <span className="flex justify-between text-[12px] text-[#3D4044]">
        {label}
        <span className="tabular-nums">{round(value)}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-1 w-full accent-[#17181A]"
      />
    </label>
  );
}

export default function ShotHelper({ config }: { config: ShowcaseConfig }) {
  const [, redraw] = useState(0);
  const [open, setOpen] = useState(true);
  const [copied, setCopied] = useState(false);

  // Start from the configured hero, and refresh the readout as the camera moves.
  useEffect(() => {
    runtime.helper.jump = -1;
    const timer = window.setInterval(() => redraw((n) => n + 1), 150);
    return () => window.clearInterval(timer);
  }, []);

  const helper = runtime.helper;
  const orientation = window.innerWidth < window.innerHeight ? "portrait" : "landscape";
  const snippet =
    `${orientation}: {\n` +
    `  position: ${vec(helper.position)},\n` +
    `  target: ${vec(helper.target)},\n` +
    `  fov: ${round(helper.fov)},\n` +
    `  offset: ${vec(helper.offset)},\n` +
    `},`;

  const copy = () => {
    navigator.clipboard.writeText(snippet).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    });
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed left-4 top-4 z-50 bg-[#17181A] px-3 py-2 text-[12px] font-medium text-white"
      >
        Show shot helper
      </button>
    );
  }

  return (
    <div className="fixed left-4 top-4 z-50 max-h-[calc(100dvh-32px)] w-[300px] overflow-y-auto border border-[#D3D5D6] bg-white p-4 text-[#17181A] shadow-[0_16px_40px_rgba(23,24,26,0.14)]">
      <div className="flex items-baseline justify-between">
        <p className="text-[14px] font-semibold">Shot helper</p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-[12px] text-[#6B7075] underline underline-offset-2"
        >
          Hide
        </button>
      </div>
      <p className="mt-1 text-[12px] leading-snug text-[#6B7075]">
        Drag to orbit, right-drag to pan, scroll to zoom. Keep the product
        clear of the dashed boxes. Framing a {orientation} shot; for the
        other, resize the window or use the browser&apos;s device toolbar.
      </p>

      <p className="mt-4 text-[12px] font-medium">Start from</p>
      <div className="mt-2 flex flex-wrap gap-1">
        <button
          type="button"
          onClick={() => (runtime.helper.jump = -1)}
          className="border border-[#D3D5D6] px-2 py-1 text-[12px] hover:border-[#17181A]"
        >
          Hero
        </button>
        {config.chapters.map((chapter, i) => (
          <button
            key={chapter.label}
            type="button"
            onClick={() => (runtime.helper.jump = i)}
            className="border border-[#D3D5D6] px-2 py-1 text-[12px] hover:border-[#17181A]"
          >
            {chapter.label}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        <Slider
          label="Lens (fov, lower is longer)"
          value={helper.fov}
          min={10}
          max={50}
          step={0.5}
          onChange={(value) => (runtime.helper.fov = value)}
        />
        <Slider
          label="Shift sideways"
          value={helper.offset[0]}
          min={-0.4}
          max={0.4}
          step={0.01}
          onChange={(value) => (runtime.helper.offset = [value, runtime.helper.offset[1]])}
        />
        <Slider
          label="Shift up and down"
          value={helper.offset[1]}
          min={-0.4}
          max={0.4}
          step={0.01}
          onChange={(value) => (runtime.helper.offset = [runtime.helper.offset[0], value])}
        />
      </div>

      <pre className="mt-4 overflow-x-auto bg-[#F2F3F3] p-2 text-[11px] leading-relaxed">
        {snippet}
      </pre>
      <button
        type="button"
        onClick={copy}
        className="mt-2 h-9 w-full bg-[#17181A] text-[13px] font-medium text-white"
      >
        {copied ? "Copied" : `Copy ${orientation} shot`}
      </button>
      <p className="mt-2 text-[11px] leading-snug text-[#6B7075]">
        Paste it over that chapter&apos;s <code>{orientation}</code> shot in the
        config file.
      </p>

      <details className="mt-4">
        <summary className="cursor-pointer text-[12px] font-medium">
          Model part names ({helper.parts.length})
        </summary>
        <p className="mt-1 text-[11px] text-[#6B7075]">
          Use these in tint and texture colourways.
        </p>
        <ul className="mt-2 space-y-0.5 text-[11px] tabular-nums">
          {helper.parts.map((name) => (
            <li key={name}>
              <code>{name}</code>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
