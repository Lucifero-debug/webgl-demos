"use client";

import { ContactShadows } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { buildNav, poseNav } from "@/components/clinic/navModel";
import { Studio } from "@/components/clinic/ImplantScene";
import { navRuntime } from "@/lib/clinic/navRuntime";

/*
  The 3D half of the X-Nav section: a gap in the jaw, the implant planned
  in gold clear of the nerve, a tracked drill following the plan, the
  implant screwed in, and a zirconia crown on top, in step with the page's
  scroll (navRuntime.progress).

  The model itself is plain three in navModel.ts; this file only puts it
  on stage, moves the camera, and decides when to draw. The same shape as
  ArchScene.tsx.
*/

const TARGET = new THREE.Vector3(0.15, -0.05, 0);

/** Draws only while the section is on screen or still catching up. See ArchScene. */
function Ticker({ shown }: { shown: { value: number } }) {
  const invalidate = useThree((state) => state.invalidate);
  useEffect(() => {
    let frame = 0;
    const tick = () => {
      if (navRuntime.visible || Math.abs(shown.value - navRuntime.progress) > 0.001) invalidate();
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [invalidate, shown]);
  return null;
}

function Nav({ shown }: { shown: { value: number } }) {
  const model = useMemo(() => buildNav(), []);
  useEffect(() => () => model.dispose(), [model]);

  const camera = useThree((state) => state.camera) as THREE.PerspectiveCamera;
  const aspect = useThree((state) => state.size.width / state.size.height);
  const w = useMemo(() => ({ pos: new THREE.Vector3() }), []);

  useFrame((state, delta) => {
    // Ease towards the scroll position: smooth even if scrolling is not.
    const k = 1 - Math.exp(-Math.min(delta, 0.1) * 5);
    shown.value += (navRuntime.progress - shown.value) * k;
    const p = shown.value;
    poseNav(model, p);

    // From above and to one side, where the plan reads best, round to
    // nearly face on at bite level as the crown goes in. Closer in while
    // the drill is working. A little idle drift keeps it alive.
    const drift = Math.sin(state.clock.elapsedTime * 0.35) * 2.5;
    const azimuth = THREE.MathUtils.degToRad(THREE.MathUtils.lerp(34, -12, p) + drift);
    const elevation = THREE.MathUtils.degToRad(THREE.MathUtils.lerp(30, 14, p));
    const closer = 1 - 0.05 * Math.sin(Math.PI * THREE.MathUtils.clamp((p - 0.18) / 0.5, 0, 1));
    // Further back on a portrait screen, where the jaw is wider than the view.
    const distance = 8.2 * closer * (aspect < 1 ? 1.5 : aspect < 1.25 ? 1.18 : 1);
    w.pos.set(
      TARGET.x + distance * Math.cos(elevation) * Math.sin(azimuth),
      TARGET.y + distance * Math.sin(elevation),
      TARGET.z + distance * Math.cos(elevation) * Math.cos(azimuth),
    );
    camera.position.copy(w.pos);
    camera.lookAt(TARGET);
  });

  return <primitive object={model.root} />;
}

export default function NavScene() {
  const shown = useRef({ value: navRuntime.progress }).current;
  return (
    <>
      <Ticker shown={shown} />
      <Nav shown={shown} />
      <Studio />
      <directionalLight position={[-2, 4, 3]} intensity={0.6} />
      <ContactShadows position={[0, -1.47, 0]} opacity={0.35} scale={7} blur={2.6} far={1.5} />
    </>
  );
}
