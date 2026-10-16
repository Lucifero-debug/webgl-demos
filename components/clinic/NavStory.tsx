"use client";

import { lazy, useMemo } from "react";
import PricedStory from "@/components/clinic/PricedStory";
import type { PricedStoryConfig } from "@/lib/clinic/types";
import { NAV_STEPS, navRuntime } from "@/lib/clinic/navRuntime";

/**
 * The X-Nav scene, fetched only when its canvas mounts. A plain import
 * would pull Three.js into the page's first download.
 */
const NavScene = lazy(() => import("@/components/clinic/NavScene"));

/*
  X-Nav computer-navigated implant surgery: plans, drills, places and
  crowns one implant in 3D while the price builds up beside it. The page
  half is the shared PricedStory; this file only picks the scene.
*/
export default function NavStory({ nav, ctaHref }: { nav: PricedStoryConfig; ctaHref: string }) {
  const camera = useMemo(() => ({ position: [4, 4.5, 6.5] as [number, number, number], fov: 30 }), []);
  return (
    <PricedStory
      story={nav}
      ctaHref={ctaHref}
      Scene={NavScene}
      runtime={navRuntime}
      steps={NAV_STEPS}
      camera={camera}
      posterAlt="Computer-navigated implant surgery in 3D: a planned implant, a tracked drill and a zirconia crown"
    />
  );
}
