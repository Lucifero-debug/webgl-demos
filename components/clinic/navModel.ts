import * as THREE from "three";
import { abutmentGeometry, clamp01, crownGeometry, gridGeometry, implantGeometry } from "@/components/clinic/toothGeometry";

/*
  The X-Nav model: computer-navigated placement of a single implant.

  A short stretch of lower jaw with a gap between two teeth and the nerve
  running underneath. The implant is first PLANNED (a gold ghost and its
  axis, clear of the nerve); a drill carrying a navigation tracker then
  follows that axis down while the tracking camera's lines lock onto the
  markers; the real implant screws into the planned position; and an
  abutment and a zirconia crown go on top.

  Plain three, no React, like archModel.ts: buildNav() makes the model
  once, poseNav() moves it for a point in the story (0 = the gap, 1 = the
  crown in place). NavScene wraps both in React Three Fiber.

  Imports three, so only scene files may import this.

  Units: 1 = 10 mm, as in toothGeometry. The implant is 10 mm long.
*/

/* ------------------------------------------------------------------ */
/* The jaw                                                             */
/* ------------------------------------------------------------------ */

/** Gum crest; the implant head sits just under it. */
export const GUM_TOP = 0.3;
const GUM_BOTTOM = -1.45;
const HALF_LENGTH = 2.2;
const HALF_WIDTH = 0.62;
/** The nerve canal, running along the jaw below the gap. */
const NERVE_Y = -1.08;
const NERVE_R = 0.07;

/** A soft, squarish section: (across, up) for an angle s round it. */
function section(s: number): [number, number] {
  const e = 0.55;
  const c = Math.cos(s);
  const n = Math.sin(s);
  const mid = (GUM_TOP + GUM_BOTTOM) / 2;
  const half = (GUM_TOP - GUM_BOTTOM) / 2;
  return [HALF_WIDTH * Math.sign(c) * Math.abs(c) ** e, mid - half * Math.sign(n) * Math.abs(n) ** e];
}

/** The jaw segment: the section swept straight along x, ends rounded off. */
function jawGeometry(rows = 140, cols = 48) {
  const mid = (GUM_TOP + GUM_BOTTOM) / 2;
  return gridGeometry(
    rows,
    cols,
    (i, j) => {
      const f = i / (rows - 1);
      const end = Math.min(f, 1 - f);
      const close = Math.sqrt(clamp01(end / 0.05));
      const [across, up] = section((j / cols) * Math.PI * 2);
      return [-HALF_LENGTH + 2 * HALF_LENGTH * f, mid + (up - mid) * close, across * close];
    },
    false,
  );
}

/* ------------------------------------------------------------------ */
/* The plan                                                            */
/* ------------------------------------------------------------------ */

/**
 * The planned implant: in the gap, tilted a few degrees towards the
 * tongue, as a plan follows the bone rather than the vertical. Its tip
 * stops well above the nerve: that clearance is what the plan is for.
 */
const PLAN_TILT = THREE.MathUtils.degToRad(7);
const AXIS = new THREE.Vector3(0, 1, 0).applyAxisAngle(new THREE.Vector3(1, 0, 0), PLAN_TILT).normalize();
const HEAD = new THREE.Vector3(0, GUM_TOP - 0.06, 0);
const PLAN_QUATERNION = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), AXIS);

/** Where the tracking camera sits: above and in front, off screen. */
const CAMERA_AT = new THREE.Vector3(1.6, 7.5, 5.5);

/* ------------------------------------------------------------------ */
/* The model                                                           */
/* ------------------------------------------------------------------ */

type Fader = { material: THREE.Material & { opacity: number }; full: number };

export type NavModel = {
  root: THREE.Group;
  gum: THREE.MeshPhysicalMaterial;
  plan: { group: THREE.Group; faders: Fader[] };
  drill: { group: THREE.Group; bit: THREE.Group; faders: Fader[]; markers: THREE.Object3D[] };
  jawMarkers: THREE.Object3D[];
  rays: { line: THREE.Line; from: THREE.Object3D; material: THREE.LineBasicMaterial }[];
  hole: THREE.Mesh;
  implant: { group: THREE.Group; spin: THREE.Group };
  abutment: THREE.Group;
  crown: THREE.Group;
  dispose: () => void;
};

export function buildNav(): NavModel {
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
    nerve: keep(
      new THREE.MeshStandardMaterial({ color: "#e8c25a", emissive: "#a87818", emissiveIntensity: 0.6, roughness: 0.5 }),
    ),
    enamel: keep(
      new THREE.MeshPhysicalMaterial({ color: "#efe9df", roughness: 0.38, clearcoat: 0.6, clearcoatRoughness: 0.22 }),
    ),
    blasted: keep(new THREE.MeshPhysicalMaterial({ color: "#b9bec3", metalness: 1, roughness: 0.42 })),
    polished: keep(new THREE.MeshPhysicalMaterial({ color: "#cbcfd3", metalness: 1, roughness: 0.16 })),
    gold: keep(new THREE.MeshPhysicalMaterial({ color: "#d9b36c", metalness: 1, roughness: 0.26 })),
    zirconia: keep(
      new THREE.MeshPhysicalMaterial({
        color: "#f4f0e8",
        roughness: 0.3,
        clearcoat: 0.9,
        clearcoatRoughness: 0.14,
        sheen: 0.3,
        sheenRoughness: 0.6,
        sheenColor: new THREE.Color("#fff6ea"),
        transparent: true,
        opacity: 1,
      }),
    ),
    // The plan: gold light, seen through the gum, never hiding what is behind it.
    ghost: keep(
      new THREE.MeshBasicMaterial({ color: "#f0c76e", transparent: true, opacity: 0.4, depthWrite: false }),
    ),
    axis: keep(new THREE.MeshBasicMaterial({ color: "#ffd98a", transparent: true, opacity: 0.9, depthWrite: false })),
    ring: keep(new THREE.MeshBasicMaterial({ color: "#ffd98a", transparent: true, opacity: 0.9, depthWrite: false })),
    steel: keep(new THREE.MeshPhysicalMaterial({ color: "#d7dadd", metalness: 1, roughness: 0.22, transparent: true })),
    body: keep(new THREE.MeshPhysicalMaterial({ color: "#e9ebee", metalness: 0.2, roughness: 0.35, transparent: true })),
    marker: keep(
      new THREE.MeshPhysicalMaterial({ color: "#ffffff", roughness: 0.15, metalness: 0.1, clearcoat: 1, transparent: true }),
    ),
    bracket: keep(new THREE.MeshPhysicalMaterial({ color: "#3a3f45", metalness: 0.6, roughness: 0.4, transparent: true })),
    hole: keep(new THREE.MeshBasicMaterial({ color: "#3a1418", transparent: true, opacity: 0.85, depthWrite: false })),
  };

  const root = new THREE.Group();

  // The jaw, drawn after everything inside it so they show through.
  const gum = new THREE.Mesh(keep(jawGeometry()), materials.gum);
  gum.renderOrder = 2;
  root.add(gum);

  // The nerve: a canal along the jaw, the thing a plan keeps clear of.
  const nerveCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-HALF_LENGTH + 0.15, NERVE_Y + 0.12, 0.05),
    new THREE.Vector3(-0.8, NERVE_Y + 0.02, 0.02),
    new THREE.Vector3(0.6, NERVE_Y - 0.02, -0.02),
    new THREE.Vector3(HALF_LENGTH - 0.15, NERVE_Y + 0.1, -0.05),
  ]);
  root.add(new THREE.Mesh(keep(new THREE.TubeGeometry(nerveCurve, 80, NERVE_R, 16)), materials.nerve));

  // The two neighbouring teeth, either side of the gap.
  const crownGeo = keep(crownGeometry());
  for (const x of [-1.12, 1.12]) {
    const tooth = new THREE.Mesh(crownGeo, materials.enamel);
    tooth.scale.set(0.98, 0.95, 1.0);
    tooth.position.set(x, GUM_TOP + 0.36 * 0.95 - 0.08, 0);
    root.add(tooth);
  }

  // The jaw tracker: a small clip on the left tooth carrying three markers,
  // so the system knows where the jaw is as the patient moves.
  const jawMarkers: THREE.Object3D[] = [];
  const markerGeo = keep(new THREE.SphereGeometry(0.055, 24, 16));
  const clip = new THREE.Group();
  clip.position.set(-1.12, GUM_TOP + 0.45, 0.55);
  const clipBar = new THREE.Mesh(keep(new THREE.BoxGeometry(0.62, 0.06, 0.06)), materials.bracket);
  clip.add(clipBar);
  const clipStem = new THREE.Mesh(keep(new THREE.BoxGeometry(0.06, 0.06, 0.32)), materials.bracket);
  clipStem.position.set(0, -0.02, -0.18);
  clip.add(clipStem);
  for (const [x, y] of [
    [-0.28, 0.05],
    [0.28, 0.05],
    [0.05, 0.2],
  ]) {
    const m = new THREE.Mesh(markerGeo, materials.marker);
    m.position.set(x, y, 0);
    clip.add(m);
    jawMarkers.push(m);
  }
  root.add(clip);

  // The plan: a gold ghost of the implant, its axis, and the entry ring.
  const implantGeo = keep(implantGeometry(200, 120));
  const plan = new THREE.Group();
  plan.position.copy(HEAD);
  plan.quaternion.copy(PLAN_QUATERNION);
  const ghost = new THREE.Mesh(implantGeo, materials.ghost);
  ghost.position.y = -1;
  ghost.renderOrder = 3;
  plan.add(ghost);
  const axisLine = new THREE.Mesh(keep(new THREE.CylinderGeometry(0.008, 0.008, 3.2, 8)), materials.axis);
  axisLine.position.y = 0.4;
  axisLine.renderOrder = 3;
  plan.add(axisLine);
  const ring = new THREE.Mesh(keep(new THREE.TorusGeometry(0.27, 0.012, 8, 64)), materials.ring);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.07;
  ring.renderOrder = 3;
  plan.add(ring);
  root.add(plan);

  // The drill: a bit, the handpiece head above it, its handle running back
  // and up out of frame, and a tracker array on the handle.
  const drill = new THREE.Group();
  drill.quaternion.copy(PLAN_QUATERNION);
  const bit = new THREE.Group();
  const bitMesh = new THREE.Mesh(keep(new THREE.CylinderGeometry(0.1, 0.1, 1.3, 32)), materials.steel);
  bitMesh.position.y = 0.65; // bit runs from its tip (0) upwards
  bit.add(bitMesh);
  // Two flutes painted on as dark spirals would cost a texture; a few
  // narrow rings read as a cutting bit at this size.
  const grooveGeo = keep(new THREE.TorusGeometry(0.102, 0.006, 6, 32));
  for (let i = 0; i < 6; i++) {
    const g = new THREE.Mesh(grooveGeo, materials.bracket);
    g.rotation.x = Math.PI / 2;
    g.position.y = 0.12 + i * 0.13;
    bit.add(g);
  }
  drill.add(bit);
  const head = new THREE.Mesh(keep(new THREE.CylinderGeometry(0.3, 0.3, 0.5, 40)), materials.body);
  head.rotation.x = Math.PI / 2;
  head.position.y = 1.55;
  drill.add(head);
  const handle = new THREE.Mesh(keep(new THREE.CylinderGeometry(0.2, 0.24, 3.2, 32)), materials.body);
  // Runs up and away to the right, out of frame, as a hand holds it.
  handle.rotation.z = -(Math.PI / 2 - 0.25);
  handle.position.set(1.62, 1.95, 0);
  drill.add(handle);
  const drillMarkers: THREE.Object3D[] = [];
  const array = new THREE.Group();
  // Close to the head, so it stays in frame with the drill.
  array.position.set(0.95, 1.98, 0);
  const arm = new THREE.Mesh(keep(new THREE.BoxGeometry(0.06, 0.55, 0.06)), materials.bracket);
  arm.position.y = 0.15;
  array.add(arm);
  const bar = new THREE.Mesh(keep(new THREE.BoxGeometry(0.85, 0.06, 0.06)), materials.bracket);
  bar.position.y = 0.42;
  array.add(bar);
  for (const [x, y] of [
    [-0.4, 0.42],
    [0.4, 0.42],
    [0.12, 0.66],
  ]) {
    const m = new THREE.Mesh(markerGeo, materials.marker);
    m.position.set(x, y, 0);
    array.add(m);
    drillMarkers.push(m);
  }
  drill.add(array);
  root.add(drill);

  // The tracking camera's lines of sight to every marker.
  const rays: NavModel["rays"] = [];
  for (const from of [...jawMarkers, ...drillMarkers]) {
    const material = keep(new THREE.LineBasicMaterial({ color: "#ffd98a", transparent: true, opacity: 0 }));
    const geometry = keep(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), CAMERA_AT.clone()]));
    const line = new THREE.Line(geometry, material);
    line.frustumCulled = false;
    root.add(line);
    rays.push({ line, from, material });
  }

  // The osteotomy: the channel the drill leaves, growing as it goes down.
  const hole = new THREE.Mesh(keep(new THREE.CylinderGeometry(0.11, 0.11, 1, 24, 1, true)), materials.hole);
  hole.renderOrder = 1;
  root.add(hole);

  // The real implant.
  const implantGroup = new THREE.Group();
  implantGroup.quaternion.copy(PLAN_QUATERNION);
  const spin = new THREE.Group();
  const implantMesh = new THREE.Mesh(implantGeo, [materials.blasted, materials.polished]);
  implantMesh.position.y = -1;
  spin.add(implantMesh);
  implantGroup.add(spin);
  root.add(implantGroup);

  // The abutment, then the zirconia crown on it.
  const abutment = new THREE.Group();
  abutment.quaternion.copy(PLAN_QUATERNION);
  const post = new THREE.Mesh(keep(abutmentGeometry()), materials.gold);
  post.scale.setScalar(0.85);
  abutment.add(post);
  root.add(abutment);

  const crown = new THREE.Group();
  const crownMesh = new THREE.Mesh(crownGeo, materials.zirconia);
  crownMesh.scale.set(0.96, 0.98, 1.0);
  crown.add(crownMesh);
  root.add(crown);

  const fade = (material: Fader["material"]): Fader => ({ material, full: material.opacity });

  return {
    root,
    gum: materials.gum,
    plan: { group: plan, faders: [fade(materials.ghost), fade(materials.axis), fade(materials.ring)] },
    drill: {
      group: drill,
      bit,
      faders: [materials.steel, materials.body, materials.marker, materials.bracket].map(fade),
      markers: drillMarkers,
    },
    jawMarkers,
    rays,
    hole,
    implant: { group: implantGroup, spin },
    abutment,
    crown,
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

const setOpacity = (faders: Fader[], k: number) => {
  for (const f of faders) {
    f.material.opacity = f.full * k;
    f.material.transparent = true;
  }
};

const scratch = new THREE.Vector3();

/** How deep the drill goes: the planned length, to the implant's tip. */
const DRILL_DEPTH = 1.0;

/**
 * Poses the model for story position p (0 to 1), in step with NAV_STEPS
 * in lib/clinic/navRuntime.ts (the page highlights the same steps):
 *   0.00  planned in 3D: the gum clears, the nerve and the gold plan show
 *   0.22  the drill comes in on the planned axis, tracked, and drills
 *   0.50  the implant screws in exactly where the plan was
 *   0.74  the abutment, then the zirconia crown; the gum fills back in
 */
export function poseNav(model: NavModel, p: number) {
  // The gum turns see-through while the plan and surgery are shown, then
  // fills back in once the crown is on.
  const clear = span(p, 0.04, 0.16) * (1 - span(p, 0.86, 0.97));
  model.gum.opacity = 1 - 0.6 * clear;
  model.gum.depthWrite = clear < 0.05;

  // The plan: in early, gone once the real implant has taken its place.
  const planIn = span(p, 0.05, 0.16);
  const planOut = span(p, 0.64, 0.72);
  setOpacity(model.plan.faders, planIn * (1 - planOut));
  model.plan.group.visible = planIn * (1 - planOut) > 0.002;

  // The drill: in from above on the axis, down to depth, back out, away.
  const arrive = span(p, 0.2, 0.3);
  const cut = span(p, 0.3, 0.43);
  const leave = span(p, 0.44, 0.52);
  const height = (1 - arrive) * 2.4 + leave * 2.4;
  const depth = cut * (1 - leave) * DRILL_DEPTH;
  // Tip position: the entry point, plus the lift, minus the depth, along the axis.
  scratch.copy(HEAD).addScaledVector(AXIS, 0.08 + height - depth);
  model.drill.group.position.copy(scratch);
  const drillShown = arrive * (1 - leave);
  setOpacity(model.drill.faders, drillShown);
  model.drill.group.visible = drillShown > 0.002;
  // It spins only while it is cutting.
  model.drill.bit.rotation.y = -cut * (1 - leave) * 90;

  // The channel it leaves: as long as it has gone, then filled by the implant.
  const channel = Math.max(cut * DRILL_DEPTH, 0.001);
  const filled = span(p, 0.56, 0.66);
  model.hole.visible = cut > 0.002 && filled < 0.999;
  model.hole.scale.set(1, channel, 1);
  model.hole.quaternion.copy(PLAN_QUATERNION);
  model.hole.position.copy(HEAD).addScaledVector(AXIS, 0.06 - channel / 2);

  // The tracking: the camera's lines lock on while the drill is in.
  const tracking = span(p, 0.18, 0.26) * (1 - span(p, 0.5, 0.56));
  for (const ray of model.rays) {
    ray.from.getWorldPosition(scratch);
    model.root.worldToLocal(scratch);
    const position = ray.line.geometry.getAttribute("position") as THREE.BufferAttribute;
    position.setXYZ(0, scratch.x, scratch.y, scratch.z);
    position.needsUpdate = true;
    const isDrill = model.drill.markers.includes(ray.from);
    ray.material.opacity = 0.55 * tracking * (isDrill ? drillShown : 1);
    ray.line.visible = ray.material.opacity > 0.002;
  }

  // The implant: down its axis into the plan, turning like a screw.
  const t = span(p, 0.52, 0.68);
  const travel = (1 - t) * 1.4;
  model.implant.group.position.copy(HEAD).addScaledVector(AXIS, travel);
  model.implant.spin.rotation.y = -(travel / 0.08) * Math.PI * 2 * 0.12;
  model.implant.group.visible = t > 0.001;

  // The abutment, then the crown.
  const a = span(p, 0.74, 0.8);
  model.abutment.position.copy(HEAD).addScaledVector(AXIS, 0.04 + (1 - a) * 0.7);
  model.abutment.scale.setScalar(Math.max(0.001, a));
  model.abutment.visible = a > 0.001;

  const c = span(p, 0.8, 0.92);
  // The crown sits on the abutment, level with its neighbours.
  model.crown.position.set(HEAD.x, GUM_TOP + 0.36 * 0.98 - 0.08 + (1 - c) * 1.4, AXIS.z * 0.3);
  model.crown.visible = c > 0.001;
  const crownMaterial = (model.crown.children[0] as THREE.Mesh).material as THREE.MeshPhysicalMaterial;
  crownMaterial.opacity = Math.min(1, c * 1.6);
  crownMaterial.transparent = c < 1;
}
