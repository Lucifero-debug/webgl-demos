"use client";

import { Canvas, type RootState } from "@react-three/fiber";
import { NeutralToneMapping, type ToneMapping } from "three";
import type { ReactNode } from "react";

/**
 * The WebGL canvas itself, in its own file so CanvasStage can load it on
 * demand.
 *
 * This file is the doorway to Three.js: importing it pulls in roughly a
 * megabyte of 3D code. CanvasStage loads it lazily, after the poster has
 * painted, so that code never delays the first paint or blocks the page
 * while it loads. Keep every value import from three, @react-three/* and
 * drei behind this boundary (type-only imports are fine anywhere, since
 * they vanish at compile time).
 */

export type StageCanvasProps = {
  frameloop: "always" | "demand";
  dpr: [number, number];
  camera: { position: [number, number, number]; fov: number };
  /**
   * Neutral by default: Khronos PBR Neutral keeps base colours true, so a
   * swatch chip and the 3D product match. R3F's own default is ACES, which
   * pushes light colours to white and shifts hues.
   */
  toneMapping?: ToneMapping;
  onCreated?: (state: RootState) => void;
  children: ReactNode;
};

export default function StageCanvas({
  frameloop,
  dpr,
  camera,
  toneMapping = NeutralToneMapping,
  onCreated,
  children,
}: StageCanvasProps) {
  return (
    <Canvas
      frameloop={frameloop}
      shadows
      dpr={dpr}
      camera={camera}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      onCreated={(state) => {
        state.gl.toneMapping = toneMapping;
        onCreated?.(state);
      }}
      className="absolute inset-0"
    >
      {children}
    </Canvas>
  );
}
