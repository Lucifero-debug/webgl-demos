import * as THREE from "three";
import { abutmentGeometry, clamp01, crownGeometry, gridGeometry, implantGeometry } from "@/components/clinic/toothGeometry";

/*
  The full-arch model ("All-on-4"): a lower jaw, four implants placed in
  it (the two at the back tilted, as the technique places them), a
  multi-unit abutment on each, and a fixed bridge of teeth that comes down
  and seats on all four.

  Plain three, no React: buildArch() makes the model once, poseArch()
  moves it for a point in the story (0 = the bare jaw, 1 = the bridge in
  place). ArchScene wraps both in React Three Fiber; keeping them plain
  means they can be checked outside React.

  Imports three, so only scene files may import this.

  Units: 1 = 10 mm, as in toothGeometry. The arch is about 45 mm across.
*/

/* ------------------------------------------------------------------ */
/* The arch                                                            */
/* ------------------------------------------------------------------ */

/** Half the arch's angular sweep, radians. */
const SWEEP = 1.3;
const ARCH_WIDTH = 2.25;
const ARCH_DEPTH = 3.0;
/** Where the arch curve sits front to back, so the model is centred. */
const ARCH_SHIFT = -1.5;

/** The arch centre line at u, from -1 (one end) through 0 (front) to 1. */
export function archPoint(u: number, out = new THREE.Vector3()) {
  const a = u * SWEEP;
  return out.set(ARCH_WIDTH * Math.sin(a), 0, ARCH_DEPTH * Math.cos(a) + ARCH_SHIFT);
}

/** Position, direction along the arch (towards +u) and outward (cheek-side) normal at u. */
export function archFrame(u: number) {
  const a = u * SWEEP;
  const position = archPoint(u);
  const tangent = new THREE.Vector3(ARCH_WIDTH * Math.cos(a), 0, -ARCH_DEPTH * Math.sin(a)).normalize();
  // Perpendicular to the tangent in the ground plane, pointing away from
  // the inside of the curve.
  const normal = new THREE.Vector3(tangent.z, 0, -tangent.x);
  // The arch is half an ellipse round (0, 0, ARCH_SHIFT): outward is away from it.
  if (normal.dot(new THREE.Vector3(position.x, 0, position.z - ARCH_SHIFT)) < 0) normal.negate();
  return { position, tangent, normal };
}

/**
 * A tube swept along the arch from u0 to u1, with a cross-section given
 * in the arch's own frame: (outward, up) for an angle s round the section.
 * Closed at both ends by shrinking the section to nothing.
 */
export function sweep(
  u0: number,
  u1: number,
  section: (s: number) => [outward: number, up: number],
  rows = 200,
  cols = 48,
) {
  const frames = Array.from({ length: rows }, (_, i) => {
    const f = i / (rows - 1);
    const u = u0 + (u1 - u0) * f;
    // Rounded ends: the last few percent of the tube closes up.
    const end = Math.min(f, 1 - f);
    const close = Math.sqrt(clamp01(end / 0.035));
    return { ...archFrame(u), close };
  });
  const p = new THREE.Vector3();
  return gridGeometry(
    rows,
    cols,
    (i, j) => {
      const { position, normal, close } = frames[i];
      const [out, up] = section((j / cols) * Math.PI * 2);
      // The ends close towards the section's middle, not its base.
      const mid = section(Math.PI / 2)[1] / 2 + section((3 * Math.PI) / 2)[1] / 2;
      p.copy(position)
        .addScaledVector(normal, out * close)
        .setY(mid + (up - mid) * close);
      return [p.x, p.y, p.z];
    },
    false,
  );
}

/** A soft, rounded section: |cos|^e and |sin|^e give a squarish ellipse. */
export const rounded = (halfWidth: number, bottom: number, top: number, e = 0.6) => (s: number): [number, number] => {
  const c = Math.cos(s);
  const n = Math.sin(s);
  const mid = (top + bottom) / 2;
  const half = (top - bottom) / 2;
  // Running the angle backwards keeps the triangles facing outwards.
  return [halfWidth * Math.sign(c) * Math.abs(c) ** e, mid - half * Math.sign(n) * Math.abs(n) ** e];
};

/*
  sweep, rounded, toothPositions and SIZE are exported for robotModel.ts,
  which builds two full arches the same way.
*/

/** The jaw: gum over bone, crest at GUM_TOP. */
export const GUM_TOP = 0.3;
const GUM_BOTTOM = -0.95;
/** The bridge's pink base sits on the gum; teeth stand on BRIDGE_TOP. */
const BRIDGE_BOTTOM = 0.34;
const BRIDGE_TOP = 0.62;

/* ------------------------------------------------------------------ */
/* Where things go                                                     */
/* ------------------------------------------------------------------ */

/**
 * All-on-4: two implants straight up at the front, two at the back
 * tilted 30 degrees so their tips lean forward, away from the nerve and
 * into the bone that is there, while their heads come up further back to
 * carry the back teeth.
 */
export const SITES = [
  { u: -0.78, tilt: 30 },
  { u: -0.3, tilt: 0 },
  { u: 0.3, tilt: 0 },
  { u: 0.78, tilt: 30 },
];

export type ToothKind = "molar" | "premolar" | "canine" | "incisor";

/** Twelve teeth from one end to the other: no third molars on a bridge. */
const TEETH: ToothKind[] = [
  "molar",
  "premolar",
  "premolar",
  "canine",
  "incisor",
  "incisor",
  "incisor",
  "incisor",
  "canine",
  "premolar",
  "premolar",
  "molar",
];
/** Width along the arch, depth across it, height; crown geometry is 1 x 0.92 x 0.72. */
export const SIZE: Record<ToothKind, [along: number, across: number, tall: number]> = {
  molar: [1.0, 1.0, 0.95],
  premolar: [0.72, 0.85, 1.05],
  canine: [0.7, 0.78, 1.35],
  incisor: [0.55, 0.6, 1.25],
};

/** Each tooth's u, packed shoulder to shoulder along the arch. */
export function toothPositions(u0: number, u1: number) {
  // Arc length along u, sampled.
  const samples = 400;
  const lengths = [0];
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  for (let i = 1; i <= samples; i++) {
    archPoint(u0 + ((u1 - u0) * (i - 1)) / samples, a);
    archPoint(u0 + ((u1 - u0) * i) / samples, b);
    lengths.push(lengths[i - 1] + a.distanceTo(b));
  }
  const total = lengths[samples];
  const widths = TEETH.map((k) => SIZE[k][0]);
  const scale = total / widths.reduce((s, w) => s + w, 0);
  let run = 0;
  return TEETH.map((kind, i) => {
    const centre = run + (widths[i] * scale) / 2;
    run += widths[i] * scale;
    const k = lengths.findIndex((l) => l >= centre);
    return { kind, u: u0 + ((u1 - u0) * Math.max(0, k)) / samples, fit: scale };
  });
}

/* ------------------------------------------------------------------ */
/* The model                                                           */
/* ------------------------------------------------------------------ */

export type ArchModel = {
  root: THREE.Group;
  gum: THREE.MeshPhysicalMaterial;
  implants: { group: THREE.Group; spin: THREE.Group; rest: THREE.Vector3; axis: THREE.Vector3 }[];
  abutments: THREE.Group[];
  bridge: THREE.Group;
  dispose: () => void;
};

export function buildArch(): ArchModel {
  const disposables: { dispose: () => void }[] = [];
  const keep = <T extends { dispose: () => void }>(x: T) => (disposables.push(x), x);

  const materials = {
    gum: keep(
      new THREE.MeshPhysicalMaterial({
        color: "#c46f78",
        roughness: 0.42,
        clearcoat: 0.35,
        clearcoatRoughness: 0.3,
        sheen: 0.4,
        sheenColor: new THREE.Color("#ffb9bf"),
        transparent: true,
        opacity: 1,
      }),
    ),
    blasted: keep(new THREE.MeshPhysicalMaterial({ color: "#b9bec3", metalness: 1, roughness: 0.42 })),
    polished: keep(new THREE.MeshPhysicalMaterial({ color: "#cbcfd3", metalness: 1, roughness: 0.16 })),
    gold: keep(new THREE.MeshPhysicalMaterial({ color: "#d9b36c", metalness: 1, roughness: 0.26 })),
    base: keep(
      new THREE.MeshPhysicalMaterial({ color: "#d9838c", roughness: 0.3, clearcoat: 0.7, clearcoatRoughness: 0.18 }),
    ),
    zirconia: keep(
      new THREE.MeshPhysicalMaterial({
        color: "#f2eee6",
        roughness: 0.32,
        clearcoat: 0.9,
        clearcoatRoughness: 0.14,
        sheen: 0.3,
        sheenRoughness: 0.6,
        sheenColor: new THREE.Color("#fff6ea"),
      }),
    ),
  };

  const root = new THREE.Group();

  // The jaw.
  const gumGeometry = keep(sweep(-1, 1, rounded(0.56, GUM_BOTTOM, GUM_TOP, 0.55)));
  const gum = new THREE.Mesh(gumGeometry, materials.gum);
  gum.renderOrder = 2; // after the metal, so the metal shows through it
  root.add(gum);

  // The implants, one shared geometry. Lighter than the close-up's: four
  // of them at this distance don't need 60,000 vertices each.
  const implantGeo = keep(implantGeometry(160, 96));
  const abutmentGeo = keep(abutmentGeometry());
  const up = new THREE.Vector3(0, 1, 0);
  const implants: ArchModel["implants"] = [];
  const abutments: THREE.Group[] = [];

  for (const site of SITES) {
    const { position, tangent } = archFrame(site.u);
    // The head sits just under the gum crest.
    const rest = position.clone().setY(GUM_TOP - 0.06);
    // Tilt about the cheek-to-tongue axis, tip leaning towards the front
    // of the mouth (towards u = 0).
    const towardsFront = tangent.clone().multiplyScalar(-Math.sign(site.u));
    const side = new THREE.Vector3().crossVectors(up, towardsFront).normalize();
    const q = new THREE.Quaternion().setFromAxisAngle(side, THREE.MathUtils.degToRad(site.tilt));
    // Check the direction rather than trust the sign: the tip (down the
    // axis) must move towards the front.
    const tip = new THREE.Vector3(0, -1, 0).applyQuaternion(q);
    if (tip.dot(towardsFront) < 0) q.invert();
    const axis = up.clone().applyQuaternion(q);

    const group = new THREE.Group();
    group.position.copy(rest);
    group.quaternion.copy(q);
    const spin = new THREE.Group();
    const mesh = new THREE.Mesh(implantGeo, [materials.blasted, materials.polished]);
    mesh.position.y = -1; // geometry runs 0 (tip) to 1 (platform)
    spin.add(mesh);
    group.add(spin);
    root.add(group);
    implants.push({ group, spin, rest, axis });

    // Multi-unit abutment: straight on the front implants; on the tilted
    // ones, angled so the bridge screws go in upright.
    const abutment = new THREE.Group();
    abutment.position.copy(rest);
    const post = new THREE.Mesh(abutmentGeo, materials.gold);
    post.scale.setScalar(0.62);
    post.position.y = 0.06;
    abutment.add(post);
    root.add(abutment);
    abutments.push(abutment);
  }

  // The bridge: a pink base along the arch, teeth standing on it.
  const bridge = new THREE.Group();
  const baseGeo = keep(sweep(-0.93, 0.93, rounded(0.5, BRIDGE_BOTTOM, BRIDGE_TOP, 0.5)));
  bridge.add(new THREE.Mesh(baseGeo, materials.base));
  const crownGeo = keep(crownGeometry());
  const basis = new THREE.Matrix4();
  for (const tooth of toothPositions(-0.9, 0.9)) {
    const { position, tangent, normal } = archFrame(tooth.u);
    const [along, across, tall] = SIZE[tooth.kind];
    const mesh = new THREE.Mesh(crownGeo, materials.zirconia);
    // Crown x runs along the arch, z across it.
    basis.makeBasis(tangent, up, normal);
    mesh.quaternion.setFromRotationMatrix(basis);
    // A whisker under the packed width, so neighbours touch without merging.
    mesh.scale.set(along * tooth.fit * 0.96, tall * 0.62, across * 0.78);
    mesh.position.copy(position).setY(BRIDGE_TOP - 0.06 + 0.36 * tall * 0.62);
    bridge.add(mesh);
  }
  root.add(bridge);

  return {
    root,
    gum: materials.gum,
    implants,
    abutments,
    bridge,
    dispose: () => disposables.forEach((d) => d.dispose()),
  };
}

/* ------------------------------------------------------------------ */
/* The story                                                           */
/* ------------------------------------------------------------------ */

const ease = (x: number) => {
  const t = clamp01(x);
  return t * t * (3 - 2 * t);
};
/** 0 before `from`, 1 after `to`, eased between. */
const span = (p: number, from: number, to: number) => ease((p - from) / (to - from));


/**
 * Poses the model for story position p (0 to 1), in step with ARCH_STEPS
 * in lib/clinic/archRuntime.ts (the page highlights the same steps):
 *   0.00  the jaw
 *   0.18  the gum clears, and the four implants screw in, one after another
 *   0.50  the abutments go on
 *   0.68  the bridge comes down and seats; the gum fills back in
 */
export function poseArch(model: ArchModel, p: number) {
  // The gum turns see-through while the implants go in, so you can watch
  // them, then fills back in once the teeth are on.
  const clear = span(p, 0.1, 0.22) * (1 - span(p, 0.82, 0.95));
  model.gum.opacity = 1 - 0.55 * clear;
  model.gum.depthWrite = clear < 0.05;

  model.implants.forEach((implant, i) => {
    const t = span(p, 0.2 + i * 0.065, 0.33 + i * 0.065);
    // Down its own axis into place, turning like a screw: 0.8 mm per turn.
    const travel = (1 - t) * 1.6;
    implant.group.position.copy(implant.rest).addScaledVector(implant.axis, travel);
    implant.spin.rotation.y = -(travel / 0.08) * Math.PI * 2 * 0.12;
    implant.group.visible = t > 0.001;
  });

  model.abutments.forEach((abutment, i) => {
    const t = span(p, 0.5 + i * 0.03, 0.58 + i * 0.03);
    abutment.position.y = GUM_TOP - 0.06 + (1 - t) * 0.6;
    abutment.scale.setScalar(Math.max(0.001, t));
    abutment.visible = t > 0.001;
  });

  const seat = span(p, 0.68, 0.88);
  model.bridge.position.y = (1 - seat) * 1.8;
  model.bridge.visible = seat > 0.001;
  model.bridge.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    const m = mesh.material as THREE.MeshPhysicalMaterial;
    m.transparent = seat < 1;
    m.opacity = Math.min(1, seat * 1.6);
  });
}
