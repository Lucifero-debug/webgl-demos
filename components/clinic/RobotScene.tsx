"use client";

import { ContactShadows } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { buildRobot, poseRobot } from "@/components/clinic/robotModel";
import { Studio } from "@/components/clinic/ImplantScene";
import { robotRuntime } from "@/lib/clinic/robotRuntime";

/*
  The 3D half of the full-mouth robotic section: both jaws, a scan, a
  robotic arm placing twelve implants, titanium frames and zirconia
  prostheses, in step with the page's scroll (robotRuntime.progress).

  The model itself is plain three in robotModel.ts; this file only puts it
  on stage, moves the camera, and decides when to draw. The same shape as
  ArchScene.tsx and NavScene.tsx.
*/

/** Draws only while the section is on screen or still catching up. See ArchScene. */
function Ticker({ shown }: { shown: { value: number } }) {
  const invalidate = useThree((state) => state.invalidate);
  useEffect(() => {
    let frame = 0;
    const tick = () => {
      if (robotRuntime.visible || Math.abs(shown.value - robotRuntime.progress) > 0.001) invalidate();
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [invalidate, shown]);
  return null;
}

function Robot({ shown }: { shown: { value: number } }) {
  const model = useMemo(() => buildRobot(), []);
  useEffect(() => () => model.dispose(), [model]);

  const camera = useThree((state) => state.camera) as THREE.PerspectiveCamera;
  const aspect = useThree((state) => state.size.width / state.size.height);
  const w = useMemo(() => ({ pos: new THREE.Vector3(), target: new THREE.Vector3() }), []);

  useFrame((state, delta) => {
    // Ease towards the scroll position: smooth even if scrolling is not.
    const k = 1 - Math.exp(-Math.min(delta, 0.1) * 5);
    shown.value += (robotRuntime.progress - shown.value) * k;
    const p = shown.value;
    poseRobot(model, p);

    // The open mouth from the front and a little to the side, the robot
    // on the right; closing in, lower, as the jaws come together.
    const end = THREE.MathUtils.smoothstep(p, 0.82, 1);
    const drift = Math.sin(state.clock.elapsedTime * 0.3) * 2.5;
    const azimuth = THREE.MathUtils.degToRad(THREE.MathUtils.lerp(24, 12, p) + drift);
    const elevation = THREE.MathUtils.degToRad(THREE.MathUtils.lerp(16, 8, end));
    w.target.set(0.4, THREE.MathUtils.lerp(2.4, 1.3, end), 0.4);
    // Further back on a portrait screen, where the mouth is wider than the view.
    const distance = THREE.MathUtils.lerp(15, 12, end) * (aspect < 1 ? 1.45 : aspect < 1.25 ? 1.15 : 1);
    w.pos.set(
      w.target.x + distance * Math.cos(elevation) * Math.sin(azimuth),
      w.target.y + distance * Math.sin(elevation),
      w.target.z + distance * Math.cos(elevation) * Math.cos(azimuth),
    );
    camera.position.copy(w.pos);
    camera.lookAt(w.target);
  });

  return <primitive object={model.root} />;
}

export default function RobotScene() {
  const shown = useRef({ value: robotRuntime.progress }).current;
  return (
    <>
      <Ticker shown={shown} />
      <Robot shown={shown} />
      <Studio />
      <directionalLight position={[-2, 6, 4]} intensity={0.6} />
      <ContactShadows position={[0, -0.97, 0.3]} opacity={0.3} scale={10} blur={2.8} far={2} />
    </>
  );
}
