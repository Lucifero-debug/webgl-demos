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
        /*
          R3F sets touch-action: none on the canvas element itself, so the
          style prop below cannot override it. On a phone that stops the
          page scrolling wherever the canvas covers the screen, which on
          these pages is everywhere: dragging does nothing and the story
          cannot be reached. (Desktop hides it, because wheel scrolling
          ignores touch-action.)

          pan-y gives the page back its vertical scrolling and leaves
          horizontal drags to the scene, which is what the product's
          drag-to-rotate and the globe's spin need.
        */
        state.gl.domElement.style.touchAction = "pan-y";
        onCreated?.(state);
      }}
      className="absolute inset-0"
      // The wrapper too, for the same reason.
      style={{ touchAction: "pan-y" }}
    >
      {children}
    </Canvas>
  );
}
