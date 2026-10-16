"use client";

import { lazy, useMemo } from "react";
import PricedStory from "@/components/clinic/PricedStory";
import type { PricedStoryConfig } from "@/lib/clinic/types";
import { ROBOT_STEPS, robotRuntime } from "@/lib/clinic/robotRuntime";

/**
 * The robotic scene, fetched only when its canvas mounts. A plain import
 * would pull Three.js into the page's first download.
 */
const RobotScene = lazy(() => import("@/components/clinic/RobotScene"));

/*
  Full-mouth robotic implant rehabilitation: both arches scanned and
  planned, every implant placed by a robotic arm, titanium frames, then
  the zirconia prostheses, while the price builds up beside it. The page
  half is the shared PricedStory; this file only picks the scene.
*/
export default function RoboticStory({ story, ctaHref }: { story: PricedStoryConfig; ctaHref: string }) {
  const camera = useMemo(() => ({ position: [5, 4, 14] as [number, number, number], fov: 30 }), []);
  return (
    <PricedStory
      story={story}
      ctaHref={ctaHref}
      Scene={RobotScene}
      runtime={robotRuntime}
      steps={ROBOT_STEPS}
      camera={camera}
      posterAlt="Full-mouth robotic implant rehabilitation in 3D: a robotic arm placing implants in both jaws, titanium frames and zirconia teeth"
    />
  );
}
