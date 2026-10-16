import * as THREE from "three";
import { GUM_TOP, SIZE, archFrame, rounded, sweep, toothPositions } from "@/components/clinic/archModel";
import { clamp01, crownGeometry, implantGeometry } from "@/components/clinic/toothGeometry";

/*
  The full-mouth robotic model: both arches at once.

  The upper and lower jaws open wide; a scan line passes over both and
  every implant position appears as a gold plan; a robotic arm moves from
  site to site and places six implants in each jaw; a titanium frame seats
  on each arch's implants; then a full zirconia prosthesis goes over each
  frame and the jaws close into a bite.

  Plain three, no React, like archModel.ts and navModel.ts: buildRobot()
  makes the model once, poseRobot() moves it for a point in the story
  (0 = the open mouth, 1 = both prostheses in, biting). RobotScene wraps
  both in React Three Fiber. The jaws reuse archModel's sweep and teeth.

  Imports three, so only scene files may import this.

  Units: 1 = 10 mm, as in toothGeometry.
*/

/* ------------------------------------------------------------------ */
/* Layout                                                              */
/* ------------------------------------------------------------------ */

/** Six implants per arch: two tilted at the back, four straight in front. */
const SITES = [
  { u: -0.82, tilt: 30 },
  { u: -0.5, tilt: 0 },
  { u: -0.17, tilt: 0 },
  { u: 0.17, tilt: 0 },
  { u: 0.5, tilt: 0 },
  { u: 0.82, tilt: 30 },
];

/** The upper jaw is the lower one turned over and lifted: wide open, then biting. */
const UPPER_OPEN = 4.6;
const UPPER_CLOSED = 2.42;

/** The prosthesis's pink base and the teeth on it, as on the full-arch bridge. */
const BASE_BOTTOM = 0.34;
const BASE_TOP = 0.62;

/** Where the robot stands: in front and to the right, its base out of frame. */
const ROBOT_BASE = new THREE.Vector3(5.2, 1.4, 5.4);
const LINK_1 = 3.6;
const LINK_2 = 3.6;
/** From the tool's tip (the implant head) to its wrist, along the implant axis. */
const TOOL_LENGTH = 1.2;
/** How far above (or below) a site the tool waits before going in. */
const HOVER = 1.0;
/** Where the arm folds back to when it is done. */
const PARK = new THREE.Vector3(4.2, 2.4, 3.8);

/* ------------------------------------------------------------------ */
/* The model                                                           */
/* ------------------------------------------------------------------ */

type Implant = {
  group: THREE.Group;
  spin: THREE.Group;
  ghost: THREE.Object3D;
  /** Head position and outward axis, in the jaw's own frame. */
  rest: THREE.Vector3;
  axis: THREE.Vector3;
  jaw: THREE.Group;
};

type Jaw = {
  group: THREE.Group;
  frame: THREE.Group;
  prosthesis: THREE.Group;
};

export type RobotModel = {
  root: THREE.Group;
  lower: Jaw;
  upper: Jaw;
  gum: THREE.MeshPhysicalMaterial;
  ghost: THREE.MeshBasicMaterial;
  scan: THREE.Mesh;
  scanMaterial: THREE.MeshBasicMaterial;
  /** In the order the robot places them: lower left to right, then upper back. */
  implants: Implant[];
  frameMaterial: THREE.MeshPhysicalMaterial;
  prosthesisMaterials: THREE.MeshPhysicalMaterial[];
  robot: {
    group: THREE.Group;
    link1: THREE.Mesh;
    link2: THREE.Mesh;
    elbow: THREE.Mesh;
    wrist: THREE.Mesh;
    tool: THREE.Group;
    bit: THREE.Group;
    materials: THREE.Material[];
  };
  dispose: () => void;
};

export function buildRobot(): RobotModel {
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
    ghost: keep(new THREE.MeshBasicMaterial({ color: "#f0c76e", transparent: true, opacity: 0, depthWrite: false })),
    titanium: keep(
      new THREE.MeshPhysicalMaterial({ color: "#a9adb2", metalness: 1, roughness: 0.3, transparent: true, opacity: 1 }),
    ),
    base: keep(
      new THREE.MeshPhysicalMaterial({
        color: "#d9838c",
        roughness: 0.3,
        clearcoat: 0.7,
        clearcoatRoughness: 0.18,
        transparent: true,
        opacity: 1,
      }),
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
        transparent: true,
        opacity: 1,
      }),
    ),
    scan: keep(new THREE.MeshBasicMaterial({ color: "#ffd98a", transparent: true, opacity: 0, depthWrite: false })),
    robotBody: keep(
      new THREE.MeshPhysicalMaterial({ color: "#eceef1", metalness: 0.15, roughness: 0.32, clearcoat: 0.5, transparent: true }),
    ),
    robotJoint: keep(new THREE.MeshPhysicalMaterial({ color: "#2f3439", metalness: 0.6, roughness: 0.4, transparent: true })),
    robotAccent: keep(new THREE.MeshPhysicalMaterial({ color: "#d9b36c", metalness: 1, roughness: 0.26, transparent: true })),
    steel: keep(new THREE.MeshPhysicalMaterial({ color: "#d7dadd", metalness: 1, roughness: 0.22, transparent: true })),
  };

  const root = new THREE.Group();
  const gumGeo = keep(sweep(-1, 1, rounded(0.56, -0.95, GUM_TOP, 0.55)));
  const frameGeo = keep(sweep(-0.88, 0.88, rounded(0.2, 0.27, 0.42, 0.5)));
  const baseGeo = keep(sweep(-0.93, 0.93, rounded(0.5, BASE_BOTTOM, BASE_TOP, 0.5)));
  const implantGeo = keep(implantGeometry(150, 90));
  const crownGeo = keep(crownGeometry());
  const up = new THREE.Vector3(0, 1, 0);
  const basis = new THREE.Matrix4();

  const implantsByJaw: Implant[][] = [];

  const buildJaw = (upper: boolean): Jaw => {
    const group = new THREE.Group();
    if (upper) {
      // Turned over: three flips the triangle winding for a negative scale.
      group.scale.y = -1;
      group.position.y = UPPER_OPEN;
    }

    const gum = new THREE.Mesh(gumGeo, materials.gum);
    gum.renderOrder = 2; // after the metal, so the metal shows through it
    group.add(gum);

    const implants: Implant[] = [];
    for (const site of SITES) {
      const { position, tangent } = archFrame(site.u);
      const rest = position.clone().setY(GUM_TOP - 0.06);
      // Tilted about the cheek-to-tongue axis, tip towards the front. See archModel.
      const towardsFront = tangent.clone().multiplyScalar(-Math.sign(site.u));
      const side = new THREE.Vector3().crossVectors(up, towardsFront).normalize();
      const q = new THREE.Quaternion().setFromAxisAngle(side, THREE.MathUtils.degToRad(site.tilt));
      const tip = new THREE.Vector3(0, -1, 0).applyQuaternion(q);
      if (tip.dot(towardsFront) < 0) q.invert();
      const axis = up.clone().applyQuaternion(q);

      const implantGroup = new THREE.Group();
      implantGroup.position.copy(rest);
      implantGroup.quaternion.copy(q);
      const spin = new THREE.Group();
      const mesh = new THREE.Mesh(implantGeo, [materials.blasted, materials.polished]);
      mesh.position.y = -1;
      spin.add(mesh);
      implantGroup.add(spin);
      group.add(implantGroup);

      const ghost = new THREE.Mesh(implantGeo, materials.ghost);
      ghost.position.copy(rest);
      ghost.quaternion.copy(q);
      ghost.translateY(-1);
      ghost.renderOrder = 3;
      group.add(ghost);

      implants.push({ group: implantGroup, spin, ghost, rest, axis, jaw: group });
    }
    implantsByJaw.push(implants);

    // The titanium frame: a bar along the arch that every implant carries.
    const frame = new THREE.Group();
    frame.add(new THREE.Mesh(frameGeo, materials.titanium));
    group.add(frame);

    // The zirconia prosthesis over it: pink base, a full arch of teeth.
    const prosthesis = new THREE.Group();
    prosthesis.add(new THREE.Mesh(baseGeo, materials.base));
    for (const tooth of toothPositions(-0.9, 0.9)) {
      const { position, tangent, normal } = archFrame(tooth.u);
      const [along, across, tall] = SIZE[tooth.kind];
      const crown = new THREE.Mesh(crownGeo, materials.zirconia);
      basis.makeBasis(tangent, up, normal);
      crown.quaternion.setFromRotationMatrix(basis);
      crown.scale.set(along * tooth.fit * 0.96, tall * 0.62, across * 0.78);
      crown.position.copy(position).setY(BASE_TOP - 0.06 + 0.36 * tall * 0.62);
      prosthesis.add(crown);
    }
    group.add(prosthesis);

    root.add(group);
    return { group, frame, prosthesis };
  };

  const lower = buildJaw(false);
  const upper = buildJaw(true);

  // The scan line: a thin sheet of light passing over both jaws.
  const scan = new THREE.Mesh(keep(new THREE.BoxGeometry(0.035, 6.4, 3.4)), materials.scan);
  scan.position.set(-3, 2.4, 0.4);
  scan.renderOrder = 4;
  root.add(scan);

  // The robot: a pedestal, two links, three joints, and the tool.
  const robot = new THREE.Group();
  const pedestal = new THREE.Mesh(keep(new THREE.CylinderGeometry(0.45, 0.6, 5, 32)), materials.robotBody);
  pedestal.position.copy(ROBOT_BASE).setY(ROBOT_BASE.y - 2.5);
  robot.add(pedestal);
  const jointGeo = keep(new THREE.SphereGeometry(0.34, 32, 20));
  const shoulder = new THREE.Mesh(jointGeo, materials.robotJoint);
  shoulder.position.copy(ROBOT_BASE);
  robot.add(shoulder);
  const elbow = new THREE.Mesh(jointGeo, materials.robotJoint);
  robot.add(elbow);
  const wrist = new THREE.Mesh(keep(new THREE.SphereGeometry(0.22, 24, 16)), materials.robotJoint);
  robot.add(wrist);
  // Links: unit-length cylinders, stretched and aimed between joints each frame.
  const link1 = new THREE.Mesh(keep(new THREE.CylinderGeometry(0.24, 0.28, 1, 32)), materials.robotBody);
  const link2 = new THREE.Mesh(keep(new THREE.CylinderGeometry(0.17, 0.22, 1, 32)), materials.robotBody);
  robot.add(link1, link2);
  // The tool: its tip at the origin, running up its local y to the wrist.
  const tool = new THREE.Group();
  const bit = new THREE.Group();
  const bitMesh = new THREE.Mesh(keep(new THREE.CylinderGeometry(0.055, 0.055, 0.45, 20)), materials.steel);
  bitMesh.position.y = 0.225;
  bit.add(bitMesh);
  tool.add(bit);
  const housing = new THREE.Mesh(keep(new THREE.CylinderGeometry(0.2, 0.15, 0.6, 32)), materials.robotBody);
  housing.position.y = 0.75;
  tool.add(housing);
  const ring = new THREE.Mesh(keep(new THREE.TorusGeometry(0.2, 0.025, 10, 40)), materials.robotAccent);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 1.02;
  tool.add(ring);
  robot.add(tool);
  root.add(robot);

  return {
    root,
    lower,
    upper,
    gum: materials.gum,
    ghost: materials.ghost,
    scan,
    scanMaterial: materials.scan,
    // Lower, left to right; then upper, right to left: one sweep round the mouth.
    implants: [...implantsByJaw[0], ...implantsByJaw[1].slice().reverse()],
    frameMaterial: materials.titanium,
    prosthesisMaterials: [materials.base, materials.zirconia],
    robot: {
      group: robot,
      link1,
      link2,
      elbow,
      wrist,
      tool,
      bit,
      materials: [materials.robotBody, materials.robotJoint, materials.robotAccent, materials.steel],
    },
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

const v = {
  head: new THREE.Vector3(),
  out: new THREE.Vector3(),
  tip: new THREE.Vector3(),
  from: new THREE.Vector3(),
  to: new THREE.Vector3(),
  wristAt: new THREE.Vector3(),
  elbowAt: new THREE.Vector3(),
  mid: new THREE.Vector3(),
  dir: new THREE.Vector3(),
  perp: new THREE.Vector3(),
};
const yAxis = new THREE.Vector3(0, 1, 0);
const normalMatrix = new THREE.Matrix3();

/** A site's implant head and its outward axis (away from the bone), in world space. */
function siteWorld(implant: Implant, lift: number, head: THREE.Vector3, out: THREE.Vector3) {
  implant.jaw.updateMatrixWorld();
  head.copy(implant.rest).applyMatrix4(implant.jaw.matrixWorld);
  normalMatrix.getNormalMatrix(implant.jaw.matrixWorld);
  out.copy(implant.axis).applyMatrix3(normalMatrix).normalize();
  return head.addScaledVector(out, lift);
}

/** Stretches a unit cylinder between two points. */
function span3(mesh: THREE.Object3D, a: THREE.Vector3, b: THREE.Vector3) {
  v.dir.subVectors(b, a);
  const length = v.dir.length();
  mesh.position.addVectors(a, b).multiplyScalar(0.5);
  mesh.scale.set(1, Math.max(length, 0.001), 1);
  mesh.quaternion.setFromUnitVectors(yAxis, v.dir.normalize());
}

/**
 * Poses the model for story position p (0 to 1), in step with ROBOT_STEPS
 * in lib/clinic/robotRuntime.ts (the page highlights the same steps):
 *   0.00  scanned and planned: a scan line passes, the plan shows in gold
 *   0.20  the robot places all twelve implants, one after another
 *   0.58  a titanium frame seats on each arch
 *   0.76  the zirconia prostheses go on; the jaws close into a bite
 */
export function poseRobot(model: RobotModel, p: number) {
  // The jaws: wide open for the surgery, closing into a bite at the end.
  const close = span(p, 0.88, 0.99);
  model.upper.group.position.y = THREE.MathUtils.lerp(UPPER_OPEN, UPPER_CLOSED, close);

  // The gum turns see-through for the plan and the surgery.
  const clear = span(p, 0.04, 0.14) * (1 - span(p, 0.8, 0.92));
  model.gum.opacity = 1 - 0.6 * clear;
  model.gum.depthWrite = clear < 0.05;

  // The scan line passes over both jaws, left to right.
  const scanT = (p - 0.03) / 0.15;
  model.scan.visible = scanT > 0 && scanT < 1;
  model.scan.position.x = THREE.MathUtils.lerp(-3, 3, clamp01(scanT));
  model.scanMaterial.opacity = 0.35 * Math.sin(Math.PI * clamp01(scanT));

  // The plan shows behind the scan line.
  model.ghost.opacity = 0.42 * span(p, 0.08, 0.18);

  // The robot: twelve visits between 0.20 and 0.56, one implant each.
  const placing = clamp01((p - 0.2) / 0.36) * model.implants.length;
  const current = Math.min(model.implants.length - 1, Math.floor(placing));
  const local = placing - current;

  model.implants.forEach((implant, i) => {
    // Each implant goes in during the middle of its own visit.
    const t = i < current ? 1 : i > current ? 0 : span(local, 0.38, 0.8);
    const travel = (1 - t) * 1.2;
    implant.group.position.copy(implant.rest).addScaledVector(implant.axis, travel);
    implant.spin.rotation.y = -(travel / 0.08) * Math.PI * 2 * 0.12;
    implant.group.visible = t > 0.001;
    implant.ghost.visible = t < 0.999 && model.ghost.opacity > 0.002;
  });

  // Where the tool's tip is: hovering over the previous site, travelling
  // to this one, going in with the implant, and lifting off again.
  const now = model.implants[current];
  const before = model.implants[Math.max(0, current - 1)];
  siteWorld(now, HOVER, v.to, v.out);
  if (current === 0) {
    v.from.copy(PARK);
  } else {
    siteWorld(before, HOVER, v.from, v.dir);
  }
  const travelIn = span(local, 0, 0.32);
  const down = span(local, 0.32, 0.42) * (1 - span(local, 0.84, 0.96));
  // The implant's head as it goes in: the tool carries it down.
  const seat = span(local, 0.38, 0.8);
  v.tip.lerpVectors(v.from, v.to, travelIn);
  siteWorld(now, (1 - seat) * 1.2, v.head, v.out);
  v.tip.lerp(v.head, down);
  // Folding away to the park position once all twelve are in.
  const away = span(p, 0.56, 0.62);
  v.tip.lerp(PARK, away);

  // Tool along the implant axis; wrist at the far end of the tool.
  const tool = model.robot.tool;
  tool.position.copy(v.tip);
  tool.quaternion.setFromUnitVectors(yAxis, v.out);
  model.robot.bit.rotation.y = -down * seat * 120;
  v.wristAt.copy(v.tip).addScaledVector(v.out, TOOL_LENGTH);
  model.robot.wrist.position.copy(v.wristAt);

  // Two-link reach from the shoulder to the wrist; the elbow bends upward.
  v.mid.addVectors(ROBOT_BASE, v.wristAt).multiplyScalar(0.5);
  v.dir.subVectors(v.wristAt, ROBOT_BASE);
  const reach = Math.min(v.dir.length(), LINK_1 + LINK_2 - 0.01);
  const rise = Math.sqrt(Math.max(0, LINK_1 * LINK_1 - (reach / 2) * (reach / 2)));
  v.dir.normalize();
  v.perp.copy(yAxis).addScaledVector(v.dir, -yAxis.dot(v.dir));
  if (v.perp.lengthSq() < 1e-6) v.perp.set(1, 0, 0);
  v.perp.normalize();
  v.elbowAt.copy(v.mid).addScaledVector(v.perp, rise);
  model.robot.elbow.position.copy(v.elbowAt);
  span3(model.robot.link1, ROBOT_BASE, v.elbowAt);
  span3(model.robot.link2, v.elbowAt, v.wristAt);

  const robotShown = span(p, 0.15, 0.21) * (1 - span(p, 0.58, 0.64));
  model.robot.group.visible = robotShown > 0.002;
  for (const m of model.robot.materials) m.opacity = robotShown;

  // The titanium frames, from the biting side onto the implants.
  const frameIn = span(p, 0.6, 0.72);
  for (const jaw of [model.lower, model.upper]) {
    jaw.frame.position.y = (1 - frameIn) * 1.4;
    jaw.frame.visible = frameIn > 0.001;
  }
  model.frameMaterial.opacity = Math.min(1, frameIn * 1.6);

  // The zirconia prostheses over the frames.
  const seatOn = span(p, 0.76, 0.88);
  for (const jaw of [model.lower, model.upper]) {
    jaw.prosthesis.position.y = (1 - seatOn) * 1.6;
    jaw.prosthesis.visible = seatOn > 0.001;
  }
  for (const m of model.prosthesisMaterials) {
    m.opacity = Math.min(1, seatOn * 1.6);
    m.transparent = seatOn < 1;
  }
}
