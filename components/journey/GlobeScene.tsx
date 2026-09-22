"use client";

import { useTexture } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { latLonToArray } from "@/lib/journey/geo";
import { anchorKey, beats, explore, overlay } from "@/lib/journey/overlay";
import type { Destination, JourneyConfig } from "@/lib/journey/types";
import { runtime } from "@/lib/showcase/runtime";
import { applyLens } from "@/lib/stage/lens";
import { dwell, smooth } from "@/lib/stage/timing";

/*
  The 3D half of a globe journey: a photoreal Earth the camera flies
  across as the page scrolls. Each destination is two beats: arrive, then
  lean in while the day-by-day route draws itself. Earth's radius is 1.
*/

const UP = new THREE.Vector3(0, 1, 0);

/**
 * Direction to the sun, in camera space: from the front left and a little
 * above. The face towards the viewer is always lit, and the line between
 * day and night, with its city lights, runs down the right-hand edge.
 */
const SUN_VIEW = new THREE.Vector3(-0.85, 0.35, 0.55).normalize();
/** The slow turn in the opening and finale, radians per second. */
const ORBIT_SPEED = 0.035;
/** Finale flights to and from a picked destination, in seconds. */
const FLIGHT_SECONDS = 1.8;
/** How long the slow turn waits after a drag before resuming, in ms. */
const DRAG_PAUSE = 3000;
/** How far the camera pulls back mid-flight, per half-turn of travel. */
const LIFT = 1.2;
/** Never closer than this to the centre: stays outside the atmosphere. */
const MIN_DISTANCE = 1.3;
/** Cloud drift, in texture widths per second. */
const CLOUD_DRIFT = 0.0015;
/** Atmosphere shell radius: thin, as it looks from orbit. */
const HALO_RADIUS = 1.035;
/**
 * How strongly the terrain map bends the light. If mountains look lit from
 * the wrong side, the map uses the other green-channel convention: negate
 * the second value in the shader's relief line.
 */
const RELIEF_STRENGTH = 0.8;
const ROUTE_COLOR = "#FFC98A";
const DAY_ROUTE_COLOR = "#FFE2B8";
const MARKER_COLOR = "#FFE2B8";

/** Arrival shot: how far south of the place the camera stands, and how far out. */
const ARRIVE = { tilt: 0.55, distance: 2.3 };
/**
 * Route shot: closer and more overhead, framed on the middle of the
 * itinerary. As close as the 8K texture stays sharp.
 */
const ROUTE = { tilt: 0.3, distance: 1.6 };

/**
 * Where the camera is aiming, shared from the camera rig to the clouds so
 * they can clear over a destination on arrival.
 */
type Focus = { dir: THREE.Vector3; strength: number };

/**
 * Additive light that leaves the canvas's alpha alone.
 *
 * The canvas is transparent so the page's backdrop glow shows through it.
 * Three's AdditiveBlending also adds to alpha, which makes every glowing
 * pixel fully opaque: the atmosphere shell became a dark ring blotting out
 * the backdrop behind it. Adding colour only, with alpha untouched, lets the
 * browser composite the glow as light over the page instead.
 */
const ADD_LIGHT = {
  transparent: true,
  depthWrite: false,
  blending: THREE.CustomBlending,
  blendEquation: THREE.AddEquation,
  blendSrc: THREE.OneFactor,
  blendDst: THREE.OneFactor,
  blendEquationAlpha: THREE.AddEquation,
  blendSrcAlpha: THREE.ZeroFactor,
  blendDstAlpha: THREE.OneFactor,
} as const;

const toVector = (lat: number, lon: number) =>
  new THREE.Vector3(...latLonToArray(lat, lon));

/** Local north at a point on the sphere: world up, flattened onto the surface. */
const localNorth = (p: THREE.Vector3) =>
  UP.clone().addScaledVector(p, -p.y).normalize();

/** Scroll position in beats: 0 at the opening, beats.count - 1 at the finale. */
const storyX = (destinations: number) =>
  THREE.MathUtils.clamp(runtime.progress, 0, 1) * (beats.count(destinations) - 1);

/* ------------------------------------------------------------------ */
/* Camera                                                              */
/* ------------------------------------------------------------------ */

type GlobeShot = {
  /** Camera direction from Earth's centre. */
  dir: THREE.Vector3;
  dist: number;
  target: THREE.Vector3;
  up: THREE.Vector3;
  fov: number;
  offset: THREE.Vector2;
  /** Wide views turn slowly while shown. */
  orbit: boolean;
};

/**
 * Shots come from coordinates; nothing to frame by hand.
 *
 * Close shots stand south of their subject, looking north across it, with
 * local north as "up". The planet's curve then arches across the top of the
 * frame with space above, the same in either hemisphere. (With the world's
 * vertical axis as "up" instead, a southern stop comes out upside down.)
 */
function buildShots(config: JourneyConfig, aspect: number) {
  const portrait = aspect < 1;
  // Portrait screens are narrow: stand further back so the globe fits.
  const wideBack = portrait ? Math.min(2.4, 1.1 / aspect) : 1;
  const nearBack = portrait ? 1.35 : 1;

  const wide = (view: { lat: number; lon: number; distance: number }): GlobeShot => ({
    dir: toVector(view.lat, view.lon),
    dist: view.distance * wideBack,
    target: new THREE.Vector3(),
    up: UP.clone(),
    fov: 30,
    // Globe to the right of the text on landscape screens, above it on portrait.
    offset: portrait ? new THREE.Vector2(0, 0.16) : new THREE.Vector2(0.22, 0),
    orbit: true,
  });

  // The subject sits opposite the text on landscape, above it on portrait.
  const side = (align: "left" | "right") =>
    portrait
      ? new THREE.Vector2(0, 0.2)
      : new THREE.Vector2(align === "left" ? 0.18 : -0.18, -0.02);

  const lookNorth = (
    target: THREE.Vector3,
    framing: { tilt: number; distance: number },
    offset: THREE.Vector2,
  ): GlobeShot => {
    const north = localNorth(target);
    return {
      dir: target.clone().addScaledVector(north, -framing.tilt).normalize(),
      dist: framing.distance * nearBack,
      target: target.clone(),
      up: north,
      fov: 28,
      offset,
      orbit: false,
    };
  };

  const shots: GlobeShot[] = [wide(config.views.hero)];
  for (const d of config.destinations) {
    shots.push(lookNorth(toVector(d.lat, d.lon), ARRIVE, side(d.align)));
    const centre = d.itinerary.stops
      .reduce((sum, s) => sum.add(toVector(s.lat, s.lon)), new THREE.Vector3())
      .normalize();
    shots.push(lookNorth(centre, ROUTE, side(d.align)));
  }
  shots.push(wide(config.views.finale));

  // Finale close-ups, flown to when a destination is picked. The panel sits
  // on the left there, so every destination frames to the right.
  const picks = config.destinations.map((d) =>
    lookNorth(toVector(d.lat, d.lon), ARRIVE, side("left")),
  );

  return { story: shots, picks };
}

/** Rotates unit vector a towards b by fraction t, along the sphere. */
function slerpUnit(
  a: THREE.Vector3,
  b: THREE.Vector3,
  t: number,
  out: THREE.Vector3,
  q: THREE.Quaternion,
  qi: THREE.Quaternion,
) {
  q.setFromUnitVectors(a, b);
  qi.identity().slerp(q, t);
  return out.copy(a).applyQuaternion(qi);
}

/** A camera state: where it stands, what it aims at, and the lens. */
type ShotState = {
  dir: THREE.Vector3;
  dist: number;
  target: THREE.Vector3;
  up: THREE.Vector3;
  offset: THREE.Vector2;
  fov: number;
};

const newState = (): ShotState => ({
  dir: new THREE.Vector3(0, 0, 1),
  dist: 3,
  target: new THREE.Vector3(),
  up: UP.clone(),
  offset: new THREE.Vector2(),
  fov: 30,
});

function copyState(out: ShotState, from: ShotState) {
  out.dir.copy(from.dir);
  out.dist = from.dist;
  out.target.copy(from.target);
  out.up.copy(from.up);
  out.offset.copy(from.offset);
  out.fov = from.fov;
  return out;
}

const pitchAxis = new THREE.Vector3();

/**
 * A shot's camera state. Wide shots turn: `yaw` about the vertical axis
 * (the slow automatic turn, plus any drag in the finale), while `pitch`
 * tips the view north or south.
 */
function shotState(shot: GlobeShot, yaw: number, pitch: number, out: ShotState) {
  out.dir.copy(shot.dir);
  if (shot.orbit) {
    out.dir.applyAxisAngle(UP, yaw);
    if (pitch !== 0) {
      pitchAxis.crossVectors(UP, out.dir).normalize();
      out.dir.applyAxisAngle(pitchAxis, -pitch);
    }
  }
  out.dist = shot.dist;
  out.target.copy(shot.target);
  out.up.copy(shot.up);
  out.offset.copy(shot.offset);
  out.fov = shot.fov;
  return out;
}

/**
 * Blends camera state a towards b by t. Travels around the globe rather
 * than through it, and pulls back mid-flight in proportion to how far it is
 * going, so long hops read as a flight.
 */
function blendShots(
  a: ShotState,
  b: ShotState,
  t: number,
  out: ShotState,
  q: THREE.Quaternion,
  qi: THREE.Quaternion,
) {
  slerpUnit(a.dir, b.dir, t, out.dir, q, qi);
  const turn = a.dir.angleTo(b.dir);
  out.dist =
    THREE.MathUtils.lerp(a.dist, b.dist, t) + Math.sin(Math.PI * t) * LIFT * (turn / Math.PI);
  // Between two surface points the aim sweeps along the surface; to or from
  // a wide view it moves straight between the centre and the surface.
  if (a.target.lengthSq() > 0.25 && b.target.lengthSq() > 0.25) {
    const ra = a.target.length();
    const rb = b.target.length();
    slerpUnit(a.target.clone().divideScalar(ra), b.target.clone().divideScalar(rb), t, out.target, q, qi);
    out.target.multiplyScalar(THREE.MathUtils.lerp(ra, rb, t));
  } else {
    out.target.lerpVectors(a.target, b.target, t);
  }
  out.up.lerpVectors(a.up, b.up, t).normalize();
  out.offset.lerpVectors(a.offset, b.offset, t);
  out.fov = THREE.MathUtils.lerp(a.fov, b.fov, t);
  return out;
}

/**
 * Moves the camera. Through the story it follows the scroll between shots.
 * At the finale it also takes requests from the page: fly to a picked
 * destination, or home to the whole globe, and turn the globe as it is
 * dragged. A flight always starts from wherever the camera is heading at
 * that moment, so interrupting one never jumps.
 */
function CameraRig({
  shots,
  picks,
  focus,
}: {
  shots: GlobeShot[];
  picks: GlobeShot[];
  focus: Focus;
}) {
  const camera = useThree((state) => state.camera) as THREE.PerspectiveCamera;
  const autoYaw = useRef(0);
  const look = useRef<THREE.Vector3 | null>(null);
  const lens = useRef({ fov: shots[0].fov, offset: shots[0].offset.clone() });
  /** The finale flight under way: a destination index, home, or none. */
  const flying = useRef<number | "home" | null>(null);
  const flightT = useRef(0);
  const w = useMemo(
    () => ({
      a: newState(),
      b: newState(),
      goal: newState(),
      last: newState(),
      from: newState(),
      to: newState(),
      position: new THREE.Vector3(),
      q: new THREE.Quaternion(),
      qi: new THREE.Quaternion(),
    }),
    [],
  );

  useFrame((state, delta) => {
    const finale = shots.length - 1;
    const atEnd = runtime.progress > 0.985;

    // A flick keeps the globe turning, slowing to a stop.
    explore.yaw += explore.spin;
    explore.spin *= Math.pow(0.92, delta * 60);

    if (!atEnd) {
      flying.current = null;
      explore.request = null;
      explore.selected = null;
    }

    // The slow turn of the wide views: paused during finale flights, and
    // for a moment after a drag so it doesn't fight the hand.
    if (flying.current === null && performance.now() - explore.lastDrag > DRAG_PAUSE) {
      autoYaw.current += delta * ORBIT_SPEED;
    }

    const finaleState = (out: ShotState) =>
      shotState(shots[finale], autoYaw.current + explore.yaw, explore.pitch, out);

    // A request from the page starts a flight from the current goal.
    if (atEnd && explore.request !== null) {
      copyState(w.from, w.last);
      flying.current = explore.request;
      explore.selected = typeof explore.request === "number" ? explore.request : null;
      explore.request = null;
      flightT.current = 0;
    }

    if (atEnd && flying.current !== null) {
      flightT.current = Math.min(1, flightT.current + delta / FLIGHT_SECONDS);
      const t = flightT.current;
      // Home aims at the live finale view, so a drag during the flight home
      // carries straight on when it lands.
      if (flying.current === "home") finaleState(w.to);
      else shotState(picks[flying.current], 0, 0, w.to);
      blendShots(w.from, w.to, t * t * (3 - 2 * t), w.goal, w.q, w.qi);
      if (flying.current === "home" && t >= 1) flying.current = null;
    } else {
      const x = THREE.MathUtils.clamp(runtime.progress, 0, 1) * finale;
      const i = Math.min(finale - 1, Math.floor(x));
      const stateOf = (index: number, out: ShotState) =>
        index === finale ? finaleState(out) : shotState(shots[index], autoYaw.current, 0, out);
      blendShots(stateOf(i, w.a), stateOf(i + 1, w.b), dwell(x - i), w.goal, w.q, w.qi);
    }
    copyState(w.last, w.goal);

    // Ease towards the goal every frame: smooth even if scrolling is not.
    const k = 1 - Math.exp(-delta * 4);
    w.position.copy(w.goal.dir).multiplyScalar(w.goal.dist);
    camera.position.lerp(w.position, k);
    if (camera.position.length() < MIN_DISTANCE) camera.position.setLength(MIN_DISTANCE);
    if (!look.current) look.current = w.goal.target.clone();
    look.current.lerp(w.goal.target, k);
    camera.up.lerp(w.goal.up, k).normalize();
    camera.lookAt(look.current);

    // Tell the clouds where to clear: fully at a destination (aim on the
    // surface), not at all in the wide views (aim at the centre).
    const aim = look.current.length();
    focus.dir.copy(look.current).divideScalar(Math.max(aim, 1e-6));
    focus.strength = THREE.MathUtils.smoothstep(aim, 0.5, 0.95);

    lens.current.fov += (w.goal.fov - lens.current.fov) * k;
    lens.current.offset.lerp(w.goal.offset, k);
    applyLens(
      camera,
      lens.current.fov,
      lens.current.offset.x,
      lens.current.offset.y,
      state.size.width,
      state.size.height,
    );
  });

  return null;
}

/* ------------------------------------------------------------------ */
/* Earth, clouds, atmosphere                                           */
/* ------------------------------------------------------------------ */

const SURFACE_VERT = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vPosW;
  void main() {
    vUv = uv;
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vec4 world = modelMatrix * vec4(position, 1.0);
    vPosW = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const EARTH_FRAG = /* glsl */ `
  uniform sampler2D uDay;
  uniform sampler2D uNight;
  uniform sampler2D uSpecClouds;
  uniform sampler2D uRelief;
  uniform float uReliefStrength;
  uniform vec3 uSun;
  uniform float uCloudShift;
  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vPosW;

  void main() {
    vec3 n = normalize(vNormalW);
    vec3 v = normalize(cameraPosition - vPosW);
    float sunDot = dot(n, uSun);
    float day = smoothstep(-0.12, 0.28, sunDot);

    vec3 dayColor = texture2D(uDay, vUv).rgb;
    vec3 nightColor = texture2D(uNight, vUv).rgb;
    float ocean = texture2D(uSpecClouds, vUv).r;
    // Clouds cast soft shadows on the ground beneath them.
    float cloudShadow = texture2D(uSpecClouds, vUv + vec2(uCloudShift, 0.0)).g;

    // Terrain relief: tilt the lighting normal by the terrain map, in the
    // sphere's own frame (east along the texture's u, north along its v),
    // so mountain ranges catch the light on one side and shade the other.
    vec3 relief = texture2D(uRelief, vUv).xyz * 2.0 - 1.0;
    vec3 east = normalize(cross(vec3(0.0, 1.0, 0.0), n) + vec3(1e-5, 0.0, 0.0));
    vec3 north = cross(n, east);
    vec3 nr = normalize(
      east * relief.x * uReliefStrength +
      north * relief.y * uReliefStrength +
      n * max(relief.z, 0.2)
    );

    // The texture paints every ocean one flat royal blue, which reads as a
    // school atlas. From orbit, oceans are dark navy: deepen them using the
    // ocean mask.
    dayColor *= 1.0 - ocean * (1.0 - vec3(0.3, 0.42, 0.55));

    vec3 lit = dayColor * (0.04 + 1.15 * max(dot(nr, uSun), 0.0)) * (1.0 - 0.3 * cloudShadow);
    // City lights, warmed, only where the sun has set.
    vec3 lights = nightColor * vec3(1.0, 0.8, 0.55) * 2.2 * (1.0 - day);
    vec3 color = lit * day + lights;

    // Sun glint: oceans only, so continents stay matte.
    vec3 h = normalize(uSun + v);
    float glint = pow(max(dot(n, h), 0.0), 90.0) * ocean * day;
    color += vec3(1.0, 0.92, 0.78) * glint * 0.9;

    // Atmosphere seen edge-on: blue haze along the lit limb, and a narrow
    // warm band only right at sunset. (A broad orange mix here turns the
    // whole night-side edge a muddy brown.)
    float fresnel = pow(1.0 - max(dot(n, v), 0.0), 3.0);
    float warm = exp(-pow((sunDot - 0.02) / 0.09, 2.0));
    vec3 haze = mix(vec3(0.35, 0.62, 1.0), vec3(1.0, 0.62, 0.38), warm);
    color = mix(color, haze, fresnel * smoothstep(-0.05, 0.35, sunDot) * 0.55);

    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

const CLOUDS_FRAG = /* glsl */ `
  uniform sampler2D uSpecClouds;
  uniform vec3 uSun;
  uniform float uCloudShift;
  // Where the camera is looking (xyz) and how much to clear there (w).
  uniform vec4 uClear;
  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vPosW;

  void main() {
    vec3 n = normalize(vNormalW);
    float cover = texture2D(uSpecClouds, vUv + vec2(uCloudShift, 0.0)).g;
    float light = smoothstep(-0.15, 0.35, dot(n, uSun));
    vec3 color = vec3(1.0, 0.99, 0.97) * (0.02 + 0.98 * light);
    float alpha = smoothstep(0.2, 0.85, cover) * (0.2 + 0.8 * light) * 0.95;

    // The sky clears over the destination on arrival: the real cloud map
    // is thick exactly where some stops are (the Southern Ocean off
    // Patagonia), and a destination hidden under cloud is no destination.
    float away = acos(clamp(dot(n, uClear.xyz), -1.0, 1.0));
    alpha *= 1.0 - (1.0 - smoothstep(0.04, 0.18, away)) * 0.85 * uClear.w;

    gl_FragColor = vec4(color, alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

/*
  The atmosphere as seen from orbit: a thin, bright line hugging Earth's
  edge, drawn on the inside of a sphere only 3.5% larger than the planet.
  (A thick glow reads as a cartoon globe.)

  For a ray passing the planet at distance b from its centre, the far side
  of the shell is met at dot(n, v) = -sqrt(1 - b^2 / R^2), whatever the
  camera distance. Dividing by uRimK, that value at b = 1, gives 1 right at
  Earth's edge fading to 0 at the shell's edge. Stronger on the sunlit side.
*/
const HALO_FRAG = /* glsl */ `
  uniform vec3 uSun;
  uniform float uRimK;
  varying vec3 vNormalW;
  varying vec3 vPosW;

  void main() {
    vec3 n = normalize(vNormalW);
    vec3 v = normalize(cameraPosition - vPosW);
    float rim = clamp(-dot(n, v) / uRimK, 0.0, 1.0);
    float sunSide = smoothstep(-0.35, 0.55, dot(normalize(vPosW), uSun));
    vec3 color = vec3(0.35, 0.62, 1.0) * pow(rim, 2.2) * 0.95 * (0.12 + 0.88 * sunSide);
    gl_FragColor = vec4(color, 1.0);
  }
`;

function Earth({
  textures,
  focus,
}: {
  textures: JourneyConfig["textures"];
  focus: Focus;
}) {
  const gl = useThree((state) => state.gl);

  /*
    8K on screens large enough to show it, and whose GPU accepts it; 4K on
    phones, where an 8K texture's ~180 MB of GPU memory risks a crash and
    the difference is hard to see anyway.
  */
  const highRes = useMemo(
    () =>
      gl.capabilities.maxTextureSize >= 8192 &&
      Math.min(window.screen.width, window.screen.height) >= 700,
    [gl],
  );

  const maps = useTexture({
    day: highRes ? textures.dayHigh : textures.day,
    night: textures.night,
    specClouds: textures.specClouds,
    relief: textures.relief,
  });

  // Colour textures decode as sRGB; the packed ocean/cloud texture and the
  // terrain map are data. Clouds repeat sideways so they can drift around.
  if (!maps.day.userData.ready) {
    const anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy());
    maps.day.colorSpace = THREE.SRGBColorSpace;
    maps.night.colorSpace = THREE.SRGBColorSpace;
    maps.specClouds.colorSpace = THREE.NoColorSpace;
    maps.specClouds.wrapS = THREE.RepeatWrapping;
    maps.relief.colorSpace = THREE.NoColorSpace;
    for (const texture of [maps.day, maps.night, maps.specClouds, maps.relief]) {
      texture.anisotropy = anisotropy;
      texture.needsUpdate = true;
    }
    maps.day.userData.ready = true;
  }

  // Shared by all three materials, so one update per frame moves them all.
  const shared = useMemo(
    () => ({
      uSun: { value: new THREE.Vector3(1, 0, 0) },
      uCloudShift: { value: 0 },
      uClear: { value: new THREE.Vector4(0, 1, 0, 0) },
    }),
    [],
  );

  const materials = useMemo(
    () => ({
      earth: new THREE.ShaderMaterial({
        uniforms: {
          uDay: { value: maps.day },
          uNight: { value: maps.night },
          uSpecClouds: { value: maps.specClouds },
          uRelief: { value: maps.relief },
          uReliefStrength: { value: RELIEF_STRENGTH },
          uSun: shared.uSun,
          uCloudShift: shared.uCloudShift,
        },
        vertexShader: SURFACE_VERT,
        fragmentShader: EARTH_FRAG,
      }),
      clouds: new THREE.ShaderMaterial({
        uniforms: {
          uSpecClouds: { value: maps.specClouds },
          uSun: shared.uSun,
          uCloudShift: shared.uCloudShift,
          uClear: shared.uClear,
        },
        vertexShader: SURFACE_VERT,
        fragmentShader: CLOUDS_FRAG,
        transparent: true,
        depthWrite: false,
      }),
      halo: new THREE.ShaderMaterial({
        uniforms: {
          uSun: shared.uSun,
          uRimK: { value: Math.sqrt(1 - 1 / (HALO_RADIUS * HALO_RADIUS)) },
        },
        vertexShader: SURFACE_VERT,
        fragmentShader: HALO_FRAG,
        side: THREE.BackSide,
        ...ADD_LIGHT,
      }),
    }),
    [maps, shared],
  );

  useFrame((state, delta) => {
    shared.uSun.value.copy(SUN_VIEW).applyQuaternion(state.camera.quaternion);
    shared.uCloudShift.value = (shared.uCloudShift.value + delta * CLOUD_DRIFT) % 1;
    shared.uClear.value.set(focus.dir.x, focus.dir.y, focus.dir.z, focus.strength);
  });

  return (
    <>
      <mesh material={materials.earth}>
        <sphereGeometry args={[1, 160, 80]} />
      </mesh>
      <mesh material={materials.clouds} renderOrder={1}>
        <sphereGeometry args={[1.006, 96, 48]} />
      </mesh>
      <mesh material={materials.halo} renderOrder={3}>
        <sphereGeometry args={[HALO_RADIUS, 96, 48]} />
      </mesh>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Stars                                                               */
/* ------------------------------------------------------------------ */

function Stars({ count = 2400 }: { count?: number }) {
  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const v = new THREE.Vector3();
    for (let i = 0; i < count; i++) {
      v.randomDirection().multiplyScalar(60);
      positions.set([v.x, v.y, v.z], i * 3);
      // Mostly faint, a few bright: how a real sky reads.
      const b = 0.2 + Math.pow(Math.random(), 4) * 0.8;
      colors.set([b, b, b], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return g;
  }, [count]);

  return (
    <points geometry={geometry}>
      <pointsMaterial
        size={1.6}
        sizeAttenuation={false}
        vertexColors
        transparent
        depthWrite={false}
        toneMapped={false}
      />
    </points>
  );
}

/* ------------------------------------------------------------------ */
/* Routes, markers, itineraries                                        */
/* ------------------------------------------------------------------ */

const ROUTE_VERT = /* glsl */ `
  varying float vAlong;
  void main() {
    vAlong = uv.x;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/*
  Drawn up to uProgress along its length, with a bright head while it is
  still travelling, like a plane's light crossing the map. uFade dims the
  whole line, for routes that come and go with their beat.
*/
const ROUTE_FRAG = /* glsl */ `
  uniform float uProgress;
  uniform float uFade;
  uniform vec3 uColor;
  varying float vAlong;
  void main() {
    if (uProgress <= 0.0 || vAlong > uProgress) discard;
    float head = smoothstep(uProgress - 0.1, uProgress, vAlong) * (1.0 - step(0.999, uProgress));
    float fadeIn = smoothstep(0.0, 0.04, vAlong);
    gl_FragColor = vec4(uColor * (0.55 + 1.6 * head) * fadeIn * uFade, 1.0);
  }
`;

function routeMaterial(color: string) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uProgress: { value: 0 },
      uFade: { value: 1 },
      uColor: { value: new THREE.Color(color) },
    },
    vertexShader: ROUTE_VERT,
    fragmentShader: ROUTE_FRAG,
    ...ADD_LIGHT,
  });
}

/**
 * Points along the great circle from a to b, lifted off the surface in a
 * gentle arch: `base` plus `perRadian` for every radian travelled, so long
 * hops arc higher, as flight paths do on a globe.
 */
function arcPoints(a: THREE.Vector3, b: THREE.Vector3, base: number, perRadian: number, steps = 64) {
  const q = new THREE.Quaternion().setFromUnitVectors(a, b);
  const qi = new THREE.Quaternion();
  const height = base + a.angleTo(b) * perRadian;
  const points: THREE.Vector3[] = [];
  for (let s = 0; s <= steps; s++) {
    const t = s / steps;
    qi.identity().slerp(q, t);
    points.push(a.clone().applyQuaternion(qi).multiplyScalar(1 + Math.sin(Math.PI * t) * height));
  }
  return points;
}

/** The flights between destinations, each drawn as its flight happens. */
function Routes({ destinations }: { destinations: Destination[] }) {
  const routes = useMemo(
    () =>
      destinations.slice(0, -1).map((from, k) => {
        const to = destinations[k + 1];
        const curve = new THREE.CatmullRomCurve3(
          // Kept low: from the side, a tall arc reads as a lasso thrown off
          // the planet rather than a flight path.
          arcPoints(toVector(from.lat, from.lon), toVector(to.lat, to.lon), 0.02, 0.035),
        );
        return {
          geometry: new THREE.TubeGeometry(curve, 200, 0.003, 8, false),
          material: routeMaterial(ROUTE_COLOR),
        };
      }),
    [destinations],
  );

  // Flight k leaves after destination k's route beat.
  useFrame(() => {
    const x = storyX(destinations.length);
    routes.forEach((route, k) => {
      const from = beats.route(k);
      route.material.uniforms.uProgress.value =
        x < from ? 0 : x >= from + 1 ? 1 : dwell(x - from);
    });
  });

  return (
    <>
      {routes.map((route, k) => (
        <mesh key={k} geometry={route.geometry} material={route.material} renderOrder={2} />
      ))}
    </>
  );
}

function Markers({ destinations }: { destinations: Destination[] }) {
  const points = useMemo(
    () => destinations.map((d) => toVector(d.lat, d.lon)),
    [destinations],
  );
  const groups = useRef<(THREE.Group | null)[]>([]);
  const rings = useRef<(THREE.Mesh | null)[]>([]);

  useFrame((state) => {
    const x = storyX(destinations.length);
    const time = state.clock.elapsedTime;

    points.forEach((_, k) => {
      const group = groups.current[k];
      const ring = rings.current[k];
      if (!group || !ring) return;
      const arrive = beats.arrive(k);

      // Appears as the camera arrives, then stays for the rest of the story,
      // except during its own route beat, where its day pins take over (one
      // of them usually sits on the same spot, and the two piled into a blob).
      const reach = THREE.MathUtils.clamp((x - arrive + 0.45) / 0.35, 0, 1);
      const routeBeat = 1 - smooth(0.35, 0.65, Math.abs(x - beats.route(k)));
      const size = reach * (1 - routeBeat);
      group.visible = size > 0.001;
      group.scale.setScalar(Math.max(size, 0.001));

      // Pulses while its arrival is on screen, or while picked in the
      // finale; glows quietly otherwise.
      const active = Math.round(x) === arrive || explore.selected === k;
      const phase = (time * 0.6 + k * 0.3) % 1;
      ring.scale.setScalar(1 + phase * 2.2);
      (ring.material as THREE.MeshBasicMaterial).opacity =
        (1 - phase) * (active ? 0.9 : 0.3) * size;
    });
  });

  return (
    <>
      {points.map((p, k) => (
        <group
          key={k}
          ref={(node) => {
            groups.current[k] = node;
          }}
          position={p.clone().multiplyScalar(1.002)}
          // Face outward, so the ring lies flat on the ground.
          onUpdate={(self) => self.lookAt(p.clone().multiplyScalar(2))}
        >
          <mesh>
            <sphereGeometry args={[0.006, 16, 12]} />
            <meshBasicMaterial color={MARKER_COLOR} toneMapped={false} />
          </mesh>
          <mesh
            ref={(node) => {
              rings.current[k] = node;
            }}
          >
            <ringGeometry args={[0.01, 0.013, 48]} />
            <meshBasicMaterial
              color={MARKER_COLOR}
              toneMapped={false}
              transparent
              depthWrite={false}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      ))}
    </>
  );
}

/**
 * Each destination's day-by-day route: pins at each stay, joined by a fine
 * line that draws itself as the camera leans in. Only shown during that
 * destination's route beat. The labels are HTML, placed by the page.
 */
function Itineraries({ destinations }: { destinations: Destination[] }) {
  const layers = useMemo(
    () =>
      destinations.map((d) => {
        const stops = d.itinerary.stops.map((s) => toVector(s.lat, s.lon));
        const path: THREE.Vector3[] = [];
        stops.slice(0, -1).forEach((a, k) => {
          const leg = arcPoints(a, stops[k + 1], 0.002, 0.05, 24);
          path.push(...(k === 0 ? leg : leg.slice(1)));
        });
        const curve = new THREE.CatmullRomCurve3(path, false, "centripetal");
        return {
          stops,
          geometry: new THREE.TubeGeometry(curve, 240, 0.0011, 6, false),
          line: routeMaterial(DAY_ROUTE_COLOR),
          pin: new THREE.MeshBasicMaterial({
            color: MARKER_COLOR,
            toneMapped: false,
            transparent: true,
            depthWrite: false,
          }),
        };
      }),
    [destinations],
  );
  const groups = useRef<(THREE.Group | null)[]>([]);

  useFrame(() => {
    const x = storyX(destinations.length);
    layers.forEach((layer, k) => {
      const at = beats.route(k);
      const fade = 1 - smooth(0.35, 0.65, Math.abs(x - at));
      layer.line.uniforms.uProgress.value = smooth(at - 0.75, at - 0.1, x);
      layer.line.uniforms.uFade.value = fade;
      layer.pin.opacity = fade;
      const group = groups.current[k];
      if (group) group.visible = fade > 0.01;
    });
  });

  return (
    <>
      {layers.map((layer, k) => (
        <group
          key={k}
          ref={(node) => {
            groups.current[k] = node;
          }}
        >
          <mesh geometry={layer.geometry} material={layer.line} renderOrder={2} />
          {layer.stops.map((p, s) => (
            <mesh key={s} position={p.clone().multiplyScalar(1.0015)} material={layer.pin}>
              <sphereGeometry args={[0.0035, 12, 10]} />
            </mesh>
          ))}
        </group>
      ))}
    </>
  );
}

/**
 * Projects every pinned point to the screen each frame, for the page's
 * HTML photos and labels. Runs after the camera rig (mounted after it), so
 * the positions match this frame's camera.
 */
function Anchors({ destinations }: { destinations: Destination[] }) {
  const points = useMemo(() => {
    const out: { key: string; p: THREE.Vector3 }[] = [];
    for (const d of destinations) {
      out.push({ key: anchorKey.stop(d.id), p: toVector(d.lat, d.lon) });
      d.itinerary.stops.forEach((s, k) =>
        out.push({ key: anchorKey.day(d.id, k), p: toVector(s.lat, s.lon) }),
      );
    }
    return out;
  }, [destinations]);
  const ndc = useMemo(() => new THREE.Vector3(), []);
  const toCamera = useMemo(() => new THREE.Vector3(), []);

  useFrame((state) => {
    const { camera, size } = state;
    camera.updateMatrixWorld();
    for (const { key, p } of points) {
      // On the near side of the planet: its outward direction faces the camera.
      const facing = p.dot(toCamera.copy(camera.position).sub(p).normalize());
      ndc.copy(p).project(camera);
      const anchor = overlay.anchors.get(key) ?? { x: 0, y: 0, visible: false };
      anchor.x = (ndc.x * 0.5 + 0.5) * size.width;
      anchor.y = (-ndc.y * 0.5 + 0.5) * size.height;
      anchor.visible = facing > 0.08 && Math.abs(ndc.x) < 1.1 && Math.abs(ndc.y) < 1.1;
      overlay.anchors.set(key, anchor);
    }
  });

  return null;
}

/* ------------------------------------------------------------------ */
/* Scene                                                               */
/* ------------------------------------------------------------------ */

export default function GlobeScene({ config }: { config: JourneyConfig }) {
  const aspect = useThree((state) => state.size.width / state.size.height);
  const { story, picks } = useMemo(() => buildShots(config, aspect), [config, aspect]);
  const focus = useMemo<Focus>(
    () => ({ dir: new THREE.Vector3(0, 1, 0), strength: 0 }),
    [],
  );

  return (
    <>
      <CameraRig shots={story} picks={picks} focus={focus} />
      <Anchors destinations={config.destinations} />
      <Stars />
      <Earth textures={config.textures} focus={focus} />
      <Routes destinations={config.destinations} />
      <Markers destinations={config.destinations} />
      <Itineraries destinations={config.destinations} />
    </>
  );
}
