"use client";

import { ContactShadows } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { buildArch, poseArch } from "@/components/clinic/archModel";
import { Studio } from "@/components/clinic/ImplantScene";
import { archRuntime } from "@/lib/clinic/archRuntime";

/*
  The 3D half of the full-arch section: a lower jaw, four implants going
  in (two tilted), abutments, and a fixed bridge coming down onto them, in
  step with the page's scroll (archRuntime.progress).

  The model itself is plain three in archModel.ts; this file only puts it
  on stage, moves the camera, and decides when to draw.
*/

const TARGET = new THREE.Vector3(0, -0.15, 0.1);

/**
 * Draws only while the section is on screen, or while the model is still
 * catching up with the scroll. The canvas runs "on demand", so without
 * this it would sit idle; with "always" it would draw 60 times a second
 * for the whole page, under the other sections.
 */
function Ticker({ shown }: { shown: { value: number } }) {
  const invalidate = useThree((state) => state.invalidate);
  useEffect(() => {
    let frame = 0;
    const tick = () => {
      if (archRuntime.visible || Math.abs(shown.value - archRuntime.progress) > 0.001) invalidate();
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [invalidate, shown]);
  return null;
}

function Arch({ shown }: { shown: { value: number } }) {
  const model = useMemo(() => buildArch(), []);
  useEffect(() => () => model.dispose(), [model]);

  const camera = useThree((state) => state.camera) as THREE.PerspectiveCamera;
  const aspect = useThree((state) => state.size.width / state.size.height);
  const w = useMemo(() => ({ pos: new THREE.Vector3() }), []);

  useFrame((state, delta) => {
    // Ease towards the scroll position: smooth even if scrolling is not.
    const k = 1 - Math.exp(-Math.min(delta, 0.1) * 5);
    shown.value += (archRuntime.progress - shown.value) * k;
    const p = shown.value;
    poseArch(model, p);

    // A slow orbit across the story, from above and to one side at the
    // start to almost face on, at bite level, when the teeth are in. A
    // little idle drift keeps it alive between scrolls.
    const drift = Math.sin(state.clock.elapsedTime * 0.35) * 3;
    const azimuth = THREE.MathUtils.degToRad(THREE.MathUtils.lerp(32, -18, p) + drift);
    const elevation = THREE.MathUtils.degToRad(THREE.MathUtils.lerp(36, 18, p));
    // Further back on a portrait screen, where the arch is wider than the view.
    const distance = 10 * (aspect < 1 ? 1.55 : aspect < 1.25 ? 1.2 : 1);
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

export default function ArchScene() {
  const shown = useRef({ value: archRuntime.progress }).current;
  return (
    <>
      <Ticker shown={shown} />
      <Arch shown={shown} />
      <Studio />
      <directionalLight position={[-2, 4, 3]} intensity={0.6} />
      <ContactShadows position={[0, -0.97, 0.1]} opacity={0.35} scale={7} blur={2.6} far={1.5} />
    </>
  );
}
