"use client";

import type { RootState } from "@react-three/fiber";
import type { ToneMapping } from "three";
import {
  Component,
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

/**
 * The canvas and all of Three.js behind it, fetched only when the stage
 * mounts. Type imports above are fine: they vanish at compile time. A value
 * import from three, @react-three/* or drei anywhere in this file (or in
 * anything the page imports directly) would put that code back into the
 * page's initial download.
 */
const StageCanvas = lazy(() => import("@/components/StageCanvas"));

/**
 * Poster-first canvas.
 *
 * The browser paints a compressed still immediately, so that image — not a
 * WebGL context — is what Lighthouse measures as Largest Contentful Paint.
 * The Canvas only mounts once the main thread goes idle, and only then is
 * the 3D code fetched. The poster cross-fades out when the scene inside
 * Suspense has resolved.
 *
 * Reused unchanged by the travel and clinic demos.
 */

function supportsWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext("webgl2") || canvas.getContext("webgl")),
    );
  } catch {
    return false;
  }
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Sits inside Suspense, so it only runs once the scene's assets resolve. */
function SceneReady({ onReady }: { onReady: () => void }) {
  useEffect(() => {
    onReady();
  }, [onReady]);
  return null;
}

/**
 * Catches anything the scene throws — a 404 on the GLB, a failed HDRI, a lost
 * context — and reports it upwards so the poster can take back over.
 *
 * This works from outside the Canvas because R3F wraps the children it renders
 * into its own reconciler root in an internal boundary, then rethrows the error
 * from the Canvas component itself. So by the time it reaches us it is an
 * ordinary render error in the DOM tree.
 */
class SceneErrorBoundary extends Component<
  { onError: (error: unknown) => void; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  /** Commit phase, so lifting state into the parent here is safe. */
  componentDidCatch(error: unknown) {
    this.props.onError(error);
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export type CameraSetup = {
  position: [number, number, number];
  fov: number;
};

const DEFAULT_CAMERA: CameraSetup = { position: [0, 0.35, 2.6], fov: 32 };

type Props = {
  poster: string;
  posterAlt: string;
  children: ReactNode;
  className?: string;
  /** Initial camera. Each scene frames its own subject. */
  camera?: CameraSetup;
  /** Render at most 1.5x device pixels. Retina phones do not need more. */
  maxDpr?: number;
  /**
   * Neutral by default: Khronos PBR Neutral keeps base colours true, so a
   * swatch chip and the 3D product match. R3F's own default is ACES, which
   * pushes light colours to white and shifts hues. A scene that wants a
   * filmic look (the travel demo, say) can pass ACESFilmicToneMapping.
   */
  toneMapping?: ToneMapping;
  /**
   * How the poster fills the stage. "cover" for full-bleed scenes. "contain"
   * for a product on a transparent poster, so a landscape capture still shows
   * the whole product on a portrait phone instead of cropping it.
   */
  posterFit?: "cover" | "contain";
  /**
   * "demand" renders only when something changes, which is right for a
   * still scene. A scene with continuous motion (levitation, idle drift)
   * needs "always".
   */
  frameloop?: "always" | "demand";
};

export default function CanvasStage({
  poster,
  posterAlt,
  children,
  className = "",
  camera = DEFAULT_CAMERA,
  maxDpr = 1.5,
  toneMapping,
  posterFit = "cover",
  frameloop = "demand",
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [ready, setReady] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [failed, setFailed] = useState(false);
  const [capture, setCapture] = useState(false);
  const three = useRef<Pick<RootState, "gl" | "scene" | "camera"> | null>(null);

  // Poster capture: development only, and only with ?poster in the URL.
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    setCapture(new URLSearchParams(window.location.search).has("poster"));
  }, []);

  /**
   * Renders one frame and saves the canvas as a WebP, named after this
   * stage's poster path so it drops straight into public/posters/. The
   * canvas background is transparent, so the poster is the product and its
   * shadow alone; the page's own backdrop shows through, as it does live.
   */
  const savePoster = () => {
    const state = three.current;
    if (!state) return;
    state.gl.render(state.scene, state.camera);
    state.gl.domElement.toBlob(
      (blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = poster.split("/").pop() || "poster.webp";
        link.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      },
      "image/webp",
      0.8,
    );
  };

  useEffect(() => {
    if (!supportsWebGL() || prefersReducedMotion()) {
      setBlocked(true);
      return;
    }

    const idle = window.requestIdleCallback;

    if (typeof idle === "function") {
      const handle = idle(() => setMounted(true));
      return () => window.cancelIdleCallback?.(handle);
    }

    const timer = window.setTimeout(() => setMounted(true), 240);
    return () => window.clearTimeout(timer);
  }, []);

  /**
   * Drop the canvas and fade the poster back in. Clearing `ready` matters for
   * a context loss, where the scene had already resolved and faded it out.
   *
   * Deliberately one-way: useGLTF caches the rejected promise, so remounting
   * would fail again without refetching. The poster is the resting state.
   */
  const handleError = useCallback((error: unknown) => {
    if (process.env.NODE_ENV !== "production") {
      console.error("[canvas-stage] scene failed, holding the poster:", error);
    }
    setFailed(true);
    setReady(false);
  }, []);

  return (
    <div className={`relative h-full w-full ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={poster}
        alt={posterAlt}
        fetchPriority="high"
        decoding="async"
        // A missing poster (not rendered yet) should be invisible, not a
        // broken-image icon sitting over the scene.
        onError={(event) => {
          event.currentTarget.style.visibility = "hidden";
        }}
        className={`absolute inset-0 h-full w-full ${
          posterFit === "contain" ? "object-contain" : "object-cover"
        } transition-opacity duration-500 ${
          ready ? "opacity-0" : "opacity-100"
        }`}
      />

      {mounted && !blocked && !failed && (
        <SceneErrorBoundary onError={handleError}>
          {/* Outer Suspense: waiting for the 3D code itself to download. */}
          <Suspense fallback={null}>
            <StageCanvas
              frameloop={frameloop}
              dpr={[1, maxDpr]}
              camera={camera}
              toneMapping={toneMapping}
              onCreated={(state) => {
                three.current = state;
              }}
            >
              {/* Inner Suspense: waiting for the model and textures. */}
              <Suspense fallback={null}>
                {children}
                <SceneReady onReady={() => setReady(true)} />
              </Suspense>
            </StageCanvas>
          </Suspense>
        </SceneErrorBoundary>
      )}

      {capture && ready && (
        <div className="pointer-events-auto absolute left-1/2 top-24 z-30 flex -translate-x-1/2 flex-col items-center gap-2 text-center">
          <button
            type="button"
            onClick={savePoster}
            className="bg-[#17181A] px-4 py-2 text-[13px] font-medium text-white"
          >
            Save poster
          </button>
          <p className="max-w-[260px] bg-white/80 px-2 py-1 text-[11px] text-[#3D4044]">
            Reload first, wait two seconds for the entrance to settle, and
            don&apos;t rotate: the poster must match the opening frame.
          </p>
        </div>
      )}
    </div>
  );
}
