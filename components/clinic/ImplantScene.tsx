"use client";

import { ContactShadows, Environment, Lightformer } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { ClinicConfig, PartKey } from "@/lib/clinic/types";
import { runtime } from "@/lib/showcase/runtime";
import { setAnchor } from "@/lib/stage/anchors";
import { applyLens } from "@/lib/stage/lens";
import { dwell } from "@/lib/stage/timing";

/*
  The 3D half of the clinic explainer: a dental implant, built in code at
  real clinical proportions, that separates into its three parts as the
  page scrolls, with a close-up on each.

  Units: 1 = 10 mm. The implant is 4.1 mm across and 10 mm long.
*/

/* Implant thread: 0.8 mm pitch, 0.4 mm deep. */
const PITCH = 0.08;
const DEPTH = 0.04;
/** Where each part's origin sits when assembled. */
const SEAT: Record<PartKey, number> = { implant: 0, abutment: 1.0, crown: 1.48 };
/** How far each part rises when the tooth separates. */
const LIFT: Record<PartKey, number> = { implant: 0, abutment: 0.45, crown: 1.05 };
/** Each part's middle, relative to its origin, and its half-width. */
const CENTRE: Record<PartKey, number> = { implant: 0.5, abutment: 0.2, crown: 0.0 };
const RADIUS: Record<PartKey, number> = { implant: 0.21, abutment: 0.24, crown: 0.5 };
/** Top of the crown's cusps, relative to its origin. */
const CROWN_TOP = 0.44;
/** Lowers the whole object so the assembled tooth's middle sits at the origin. */
const BASE = 0.96;
/** Turntable speed, radians per second. The threads spiral like a screw going in. */
const SPIN = 0.22;

const partY = (part: PartKey, explode: number) =>
  SEAT[part] + LIFT[part] * explode + CENTRE[part] - BASE;
const stackMiddle = (explode: number) =>
  (SEAT.crown + LIFT.crown * explode + CROWN_TOP) / 2 - BASE;

/* ------------------------------------------------------------------ */
/* Geometry                                                            */
/* ------------------------------------------------------------------ */

/**
 * A grid of rows x (cols + 1) vertices, closed around its seam. The last
 * column repeats the first; computeVertexNormals treats them as strangers,
 * so their normals are averaged back together afterwards, or a hairline
 * shows down the seam.
 *
 * `outward` picks the triangle winding that faces outwards for the given
 * parametrisation: rows running up with columns running around (lathe
 * style), or rows running down (sphere style).
 */
function gridGeometry(
  rows: number,
  cols: number,
  at: (i: number, j: number) => [number, number, number],
  rowsRunUp: boolean,
) {
  const positions = new Float32Array(rows * (cols + 1) * 3);
  let p = 0;
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j <= cols; j++) {
      const [x, y, z] = at(i, j);
      positions[p++] = x;
      positions[p++] = y;
      positions[p++] = z;
    }
  }
  const indices: number[] = [];
  const w = cols + 1;
  for (let i = 0; i < rows - 1; i++) {
    for (let j = 0; j < cols; j++) {
      const a = i * w + j;
      const b = a + 1;
      const d = a + w;
      const c = d + 1;
      if (rowsRunUp) indices.push(a, d, b, b, d, c);
      else indices.push(a, b, d, b, c, d);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  const normal = geometry.getAttribute("normal") as THREE.BufferAttribute;
  const n = new THREE.Vector3();
  const m = new THREE.Vector3();
  for (let i = 0; i < rows; i++) {
    n.fromBufferAttribute(normal, i * w);
    m.fromBufferAttribute(normal, i * w + cols);
    n.add(m).normalize();
    normal.setXYZ(i * w, n.x, n.y, n.z);
    normal.setXYZ(i * w + cols, n.x, n.y, n.z);
  }
  normal.needsUpdate = true;
  return geometry;
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

/**
 * The implant radius at height y (0 at the tip, 1 at the platform) and
 * angle th. A helical thread, faded out at both ends; a smooth polished
 * collar at the top; a tapered tip with three self-tapping flutes, and a
 * rounded apex.
 */
function implantRadius(y: number, th: number) {
  if (y > 0.9) {
    // Polished collar, with a small chamfer at the platform edge.
    return 0.205 - Math.max(0, y - 0.985) * 1.2;
  }
  const core = 0.165 - Math.pow(clamp01((0.3 - y) / 0.3), 1.6) * 0.055;
  const t = (((y / PITCH + th / (2 * Math.PI)) % 1) + 1) % 1;
  const thread =
    Math.pow(0.5 + 0.5 * Math.cos(2 * Math.PI * t), 1.8) *
    DEPTH *
    clamp01((0.9 - y) / 0.03) *
    clamp01(y / 0.03);
  let r = core + thread;

  // Flutes: three flat faces cut into the tip, as they are machined on real
  // implants. Each is a plane that starts deep at the tip and moves out
  // until it clears the threads 3.5 mm up. (Soft dents here read as melted.)
  const flute = clamp01((0.35 - y) / 0.35);
  if (flute > 0) {
    const plane = 0.21 - flute * 0.075;
    for (const a of FLUTES) {
      const c = Math.cos(th - a);
      if (c > 0) r = Math.min(r, plane / c);
    }
  }

  return r * Math.sqrt(clamp01(y / 0.03));
}

const FLUTES = [0, (2 * Math.PI) / 3, (4 * Math.PI) / 3];

function implantGeometry() {
  const rows = 320;
  const cols = 192;
  const geometry = gridGeometry(
    rows,
    cols,
    (i, j) => {
      const y = i / (rows - 1);
      const th = (j / cols) * Math.PI * 2;
      const r = implantRadius(y, th);
      return [r * Math.cos(th), y, r * Math.sin(th)];
    },
    true,
  );
  // Two materials: blasted titanium on the threads, polished on the collar.
  const collarRow = Math.ceil(0.9 * (rows - 1));
  const split = collarRow * cols * 6;
  const total = geometry.getIndex()!.count;
  geometry.addGroup(0, split, 0);
  geometry.addGroup(split, total - split, 1);
  return geometry;
}

function abutmentGeometry() {
  const profile = [
    [0, -0.12],
    [0.12, -0.12],
    [0.14, -0.02],
    [0.205, 0.0],
    [0.235, 0.06],
    [0.225, 0.1],
    [0.17, 0.12],
    [0.165, 0.14],
    [0.15, 0.5],
    [0.14, 0.53],
    [0.1, 0.55],
    [0, 0.55],
  ].map(([r, y]) => new THREE.Vector2(r, y));
  const geometry = new THREE.LatheGeometry(profile, 128);

  // A flat on one side of the post, as real abutments have, so the crown
  // can only go on one way and can't rotate.
  const position = geometry.getAttribute("position") as THREE.BufferAttribute;
  for (let i = 0; i < position.count; i++) {
    const y = position.getY(i);
    if (y > 0.15 && y < 0.53 && position.getX(i) > 0.118) position.setX(i, 0.118);
  }
  position.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * A molar crown: a rounded block, widest a little above its middle and
 * narrowing to a neck at the gum line, with a chewing surface of four low
 * cusps and fine grooves between them. A stand-in until a scanned model is
 * used.
 */
function crownGeometry() {
  const rows = 120;
  const cols = 128;
  const e = 0.5;
  const sgn = (a: number) => Math.sign(a) * Math.abs(a) ** e;
  const cusps: [number, number][] = [
    [0.19, 0.17],
    [-0.19, 0.17],
    [0.19, -0.16],
    [-0.19, -0.16],
  ];

  const geometry = gridGeometry(
    rows,
    cols,
    (i, j) => {
      const u = (i / (rows - 1)) * Math.PI;
      const v = (j / cols) * Math.PI * 2;
      let x = 0.5 * sgn(Math.sin(u)) * sgn(Math.cos(v));
      let z = 0.46 * sgn(Math.sin(u)) * sgn(Math.sin(v));
      let y = 0.36 * sgn(Math.cos(u));
      const h = (y + 0.36) / 0.72;
      const waist = Math.min(
        1,
        0.62 +
          0.38 *
            Math.pow(
              clamp01(Math.sin(clamp01(h) * Math.PI * 0.62) / Math.sin(Math.PI * 0.62 * 0.8)),
              0.9,
            ),
      );
      x *= waist;
      z *= waist;
      const top = Math.pow(clamp01((h - 0.6) / 0.4), 1.5);
      let bump = 0;
      for (const [cx, cz] of cusps) {
        bump += Math.exp(-(((x - cx) / 0.15) ** 2 + ((z - cz) / 0.15) ** 2));
      }
      const groove = Math.exp(-((x / 0.035) ** 2)) + Math.exp(-((z / 0.035) ** 2));
      y += top * (bump * 0.055 - groove * 0.05);
      return [x, y, z];
    },
    false,
  );

  // The poles are single points repeated round the grid: give them one
  // shared normal, or they shade as a little star.
  const normal = geometry.getAttribute("normal") as THREE.BufferAttribute;
  const w = cols + 1;
  for (let j = 0; j <= cols; j++) {
    normal.setXYZ(j, 0, 1, 0);
    normal.setXYZ((rows - 1) * w + j, 0, -1, 0);
  }
  normal.needsUpdate = true;
  return geometry;
}

/* ------------------------------------------------------------------ */
/* Camera                                                              */
/* ------------------------------------------------------------------ */

type Shot = {
  pos: THREE.Vector3;
  target: THREE.Vector3;
  fov: number;
  offset: THREE.Vector2;
};

/**
 * One shot per beat: opening, explode, a close-up per part, finale. Each
 * orbits its subject at a distance, angle and height; the subject sits
 * opposite the text on landscape screens, above it on portrait.
 */
function buildShots(config: ClinicConfig, aspect: number) {
  const portrait = aspect < 1;
  const back = portrait ? 1.6 : 1;
  const side = (align: "left" | "right") =>
    portrait
      ? new THREE.Vector2(0, 0.18)
      : new THREE.Vector2(align === "left" ? 0.2 : -0.2, 0);

  const orbit = (
    y: number,
    distance: number,
    azimuth: number,
    elevation: number,
    align: "left" | "right",
  ): Shot => {
    const az = THREE.MathUtils.degToRad(azimuth);
    const el = THREE.MathUtils.degToRad(elevation);
    const target = new THREE.Vector3(0, y, 0);
    const d = distance * back;
    return {
      pos: target
        .clone()
        .add(new THREE.Vector3(Math.cos(el) * Math.sin(az), Math.sin(el), Math.cos(el) * Math.cos(az)).multiplyScalar(d)),
      target,
      fov: 26,
      offset: side(align),
    };
  };

  const close: Record<PartKey, [distance: number, azimuth: number, elevation: number]> = {
    implant: [3.0, 18, 3],
    abutment: [2.3, 40, 10],
    // From above, so the cusps and groove read.
    crown: [2.8, 30, 26],
  };

  return [
    orbit(stackMiddle(0), 6.2, 25, 8, "left"),
    orbit(stackMiddle(1), 8.4, 35, 6, "right"),
    ...config.parts.map((beat) => {
      const [distance, azimuth, elevation] = close[beat.part];
      return orbit(partY(beat.part, 1), distance, azimuth, elevation, beat.align);
    }),
    orbit(stackMiddle(0), 6.4, 20, 8, "left"),
  ];
}

/** Separated from the explode beat to the last close-up; together at the ends. */
function explodeAt(beats: number) {
  return Array.from({ length: beats }, (_, i) => (i === 0 || i === beats - 1 ? 0 : 1));
}

/** Shared per frame: how far apart the parts are, written by the rig. */
type Motion = { explode: number };

function CameraRig({ shots, motion }: { shots: Shot[]; motion: Motion }) {
  const camera = useThree((state) => state.camera) as THREE.PerspectiveCamera;
  const look = useRef<THREE.Vector3 | null>(null);
  const lens = useRef({ fov: shots[0].fov, offset: shots[0].offset.clone() });
  const apart = useMemo(() => explodeAt(shots.length), [shots.length]);
  const w = useMemo(
    () => ({ pos: new THREE.Vector3(), target: new THREE.Vector3(), offset: new THREE.Vector2() }),
    [],
  );

  useFrame((state, delta) => {
    const span = shots.length - 1;
    const x = THREE.MathUtils.clamp(runtime.progress, 0, 1) * span;
    const i = Math.min(span - 1, Math.floor(x));
    const t = dwell(x - i);
    const a = shots[i];
    const b = shots[i + 1];

    w.pos.lerpVectors(a.pos, b.pos, t);
    w.target.lerpVectors(a.target, b.target, t);
    w.offset.lerpVectors(a.offset, b.offset, t);
    const fov = THREE.MathUtils.lerp(a.fov, b.fov, t);
    const explode = THREE.MathUtils.lerp(apart[i], apart[i + 1], t);

    // Ease towards the goal every frame: smooth even if scrolling is not.
    const k = 1 - Math.exp(-delta * 4);
    camera.position.lerp(w.pos, k);
    if (!look.current) look.current = w.target.clone();
    look.current.lerp(w.target, k);
    camera.lookAt(look.current);
    motion.explode += (explode - motion.explode) * k;

    lens.current.fov += (fov - lens.current.fov) * k;
    lens.current.offset.lerp(w.offset, k);
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
/* The implant                                                         */
/* ------------------------------------------------------------------ */

function Implant({ motion }: { motion: Motion }) {
  const turntable = useRef<THREE.Group>(null);
  const abutment = useRef<THREE.Group>(null);
  const crown = useRef<THREE.Group>(null);

  const geometry = useMemo(
    () => ({
      implant: implantGeometry(),
      abutment: abutmentGeometry(),
      crown: crownGeometry(),
    }),
    [],
  );

  const materials = useMemo(
    () => ({
      // Grade 5 titanium: blasted matte on the threads, polished collar.
      blasted: new THREE.MeshPhysicalMaterial({ color: "#b9bec3", metalness: 1, roughness: 0.42 }),
      polished: new THREE.MeshPhysicalMaterial({ color: "#cbcfd3", metalness: 1, roughness: 0.16 }),
      socket: new THREE.MeshStandardMaterial({
        color: "#2b2e31",
        metalness: 0.5,
        roughness: 0.6,
        side: THREE.DoubleSide,
      }),
      // Gold-anodised titanium.
      gold: new THREE.MeshPhysicalMaterial({ color: "#d9b36c", metalness: 1, roughness: 0.26 }),
      // Zirconia: warm white under a glaze.
      zirconia: new THREE.MeshPhysicalMaterial({
        color: "#f2eee6",
        metalness: 0,
        roughness: 0.32,
        clearcoat: 0.9,
        clearcoatRoughness: 0.14,
        sheen: 0.3,
        sheenRoughness: 0.6,
        sheenColor: new THREE.Color("#fff6ea"),
      }),
    }),
    [],
  );

  useFrame((_, delta) => {
    if (turntable.current) turntable.current.rotation.y += delta * SPIN;
    if (abutment.current) abutment.current.position.y = SEAT.abutment + LIFT.abutment * motion.explode;
    if (crown.current) crown.current.position.y = SEAT.crown + LIFT.crown * motion.explode;
  });

  return (
    <group position={[0, -BASE, 0]}>
      <group ref={turntable}>
        <mesh geometry={geometry.implant} material={[materials.blasted, materials.polished]} castShadow />
        {/* The platform, with the hexagonal socket the abutment locks into. */}
        <mesh position={[0, 1.0, 0]} rotation={[-Math.PI / 2, 0, 0]} material={materials.polished}>
          <ringGeometry args={[0.075, 0.2, 64]} />
        </mesh>
        <mesh position={[0, 0.95, 0]} material={materials.socket}>
          <cylinderGeometry args={[0.075, 0.075, 0.1, 6, 1, true]} />
        </mesh>
        <group ref={abutment} position={[0, SEAT.abutment, 0]}>
          <mesh geometry={geometry.abutment} material={materials.gold} castShadow />
        </group>
        <group ref={crown} position={[0, SEAT.crown, 0]}>
          <mesh geometry={geometry.crown} material={materials.zirconia} castShadow />
        </group>
      </group>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Labels                                                              */
/* ------------------------------------------------------------------ */

/**
 * Projects the points the page's HTML hangs off: each part's left and right
 * edges (for the labels drawn to it), and the implant's top and bottom (for
 * its dimension line). Points on the turntable's axis, pushed sideways along
 * the camera's own right, so they stay put as the implant turns.
 */
function Anchors({ motion }: { motion: Motion }) {
  const w = useMemo(
    () => ({ right: new THREE.Vector3(), p: new THREE.Vector3(), ndc: new THREE.Vector3() }),
    [],
  );

  useFrame(({ camera, size }) => {
    camera.updateMatrixWorld();
    w.right.setFromMatrixColumn(camera.matrixWorld, 0).normalize();

    const put = (key: string, y: number, sideways: number) => {
      w.p.set(0, y, 0).addScaledVector(w.right, sideways);
      w.ndc.copy(w.p).project(camera);
      setAnchor(
        key,
        (w.ndc.x * 0.5 + 0.5) * size.width,
        (-w.ndc.y * 0.5 + 0.5) * size.height,
        w.ndc.z < 1 && Math.abs(w.ndc.x) < 1.1 && Math.abs(w.ndc.y) < 1.1,
      );
    };

    for (const part of ["implant", "abutment", "crown"] as PartKey[]) {
      const y = partY(part, motion.explode);
      const r = RADIUS[part] * 1.08;
      put(`clinic:${part}:left`, y, -r);
      put(`clinic:${part}:right`, y, r);
    }
    put("clinic:dim:top", SEAT.implant + 1.0 - BASE, 0.3);
    put("clinic:dim:bottom", SEAT.implant - BASE, 0.3);
  });

  return null;
}

/* ------------------------------------------------------------------ */
/* Lighting and scene                                                  */
/* ------------------------------------------------------------------ */

function aim(self: THREE.Object3D) {
  self.lookAt(0, 0, 0);
}

/**
 * A product-photography studio for polished metal and white ceramic, built
 * in code. A light grey surround, because white ceramic needs light from
 * all around to read as white, and polished metal takes on whatever
 * surrounds it (in a black studio, titanium looks like black steel).
 * Bright softboxes draw long highlights down the threads; two black flags,
 * as photographers use, draw the crisp dark lines that give metal its shape.
 */
function Studio() {
  return (
    <Environment resolution={256} background={false}>
      <color attach="background" args={["#8d949a"]} />
      <Lightformer form="rect" intensity={4} position={[-3, 1.2, 3]} scale={[1.6, 6, 1]} onUpdate={aim} />
      <Lightformer form="rect" intensity={3} position={[3.4, 0.8, -1.2]} scale={[0.6, 6, 1]} onUpdate={aim} />
      <Lightformer form="rect" intensity={2} position={[0, 4.5, 0.6]} scale={[4, 3, 1]} onUpdate={aim} />
      <Lightformer form="rect" intensity={1} position={[2.2, 0, 4.5]} scale={[5, 4, 1]} onUpdate={aim} />
      <Lightformer form="rect" intensity={1.2} position={[0, -2.2, 3.2]} scale={[6, 2, 1]} onUpdate={aim} />
      <Lightformer form="rect" color="black" intensity={1} position={[-1.6, 0.5, -3.2]} scale={[1.2, 6, 1]} onUpdate={aim} />
      <Lightformer form="rect" color="black" intensity={1} position={[3.2, 0.5, 2.6]} scale={[0.8, 6, 1]} onUpdate={aim} />
    </Environment>
  );
}

export default function ImplantScene({ config }: { config: ClinicConfig }) {
  const aspect = useThree((state) => state.size.width / state.size.height);
  const shots = useMemo(() => buildShots(config, aspect), [config, aspect]);
  const motion = useMemo<Motion>(() => ({ explode: 0 }), []);

  return (
    <>
      {/* Order matters: the rig sets the camera and explode first, then the
          implant and the labels read them in the same frame. */}
      <CameraRig shots={shots} motion={motion} />
      <Implant motion={motion} />
      <Anchors motion={motion} />
      <Studio />
      <directionalLight position={[-2, 4, 3]} intensity={0.5} />
      <ContactShadows
        position={[0, -BASE - 0.01, 0]}
        opacity={0.35}
        scale={4}
        blur={2.6}
        far={1.5}
      />
    </>
  );
}
