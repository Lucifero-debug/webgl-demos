"use client";

import { useEffect, useRef, useState } from "react";
import CanvasStage, { type CameraSetup } from "@/components/CanvasStage";
import Configurator, {
  type ViewName,
  type ViewRequest,
} from "@/components/Configurator";
import { CollapseIcon, ExpandIcon, RotateIcon } from "@/components/icons";
import type { Colorway } from "@/lib/colorways";

/**
 * Slightly above the shoe, looking down the way a product shot does. Its
 * distance from the origin (about 2.4) matches BASE_DISTANCE in the
 * Configurator, which backs it off further in narrow viewers.
 */
const CAMERA: CameraSetup = { position: [0, 0.5, 2.35], fov: 32 };

const VIEWS: { name: ViewName; label: string }[] = [
  { name: "hero", label: "Three-quarter" },
  { name: "side", label: "Side" },
  { name: "top", label: "Top" },
  { name: "heel", label: "Heel" },
];

export default function ProductViewer({
  colorway,
  productName,
}: {
  colorway: Colorway;
  productName: string;
}) {
  const frame = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<ViewRequest>({ name: "hero", key: 0 });
  const [canFullscreen, setCanFullscreen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    // iPhone Safari has no element fullscreen; hide the control there.
    setCanFullscreen(Boolean(document.fullscreenEnabled));
    const onChange = () =>
      setFullscreen(document.fullscreenElement === frame.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      frame.current?.requestFullscreen();
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div
        ref={frame}
        className="relative min-h-0 flex-1 overflow-hidden bg-[#D7DADB]"
      >
        {/* Seamless studio backdrop. */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(110%_75%_at_50%_20%,#E8EAEA_0%,#D7DADB_50%,#C2C6C8_100%)]" />

        <CanvasStage
          camera={CAMERA}
          poster="/posters/alder-runner.webp"
          posterAlt={`${productName} in ${colorway.name}`}
        >
          <Configurator colorway={colorway} view={view} />
        </CanvasStage>

        <p className="pointer-events-none absolute bottom-4 left-4 flex items-center gap-2 text-[12px] text-[#4A4E52]">
          <RotateIcon className="h-4 w-4" />
          Drag to rotate
        </p>

        {canFullscreen && (
          <button
            type="button"
            onClick={toggleFullscreen}
            aria-label={fullscreen ? "Exit full screen" : "View full screen"}
            className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center bg-white/80 text-[#17181A] outline-offset-2 hover:bg-white focus-visible:outline-2 focus-visible:outline-[#17181A]"
          >
            {fullscreen ? (
              <CollapseIcon className="h-5 w-5" />
            ) : (
              <ExpandIcon className="h-5 w-5" />
            )}
          </button>
        )}
      </div>

      <div
        role="group"
        aria-label="Camera angle"
        className="mt-3 flex gap-1 overflow-x-auto"
      >
        {VIEWS.map((item) => {
          const active = view.name === item.name;
          return (
            <button
              key={item.name}
              type="button"
              aria-pressed={active}
              onClick={() => setView({ name: item.name, key: Date.now() })}
              className={`h-9 shrink-0 px-3 text-[13px] outline-offset-2 transition-colors focus-visible:outline-2 focus-visible:outline-[#17181A] ${
                active
                  ? "bg-[#17181A] text-white"
                  : "text-[#3D4044] hover:bg-[#F2F3F3]"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
