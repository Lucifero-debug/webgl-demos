import * as THREE from "three";

/*
  The tooth parts, built in code at real clinical proportions, shared by
  the single-implant story (ImplantScene) and the full-arch scene
  (ArchScene). Plain functions returning geometry, called inside useMemo.

  Imports three, so only scene files may import this (see the Three.js
  boundary in PROJECT-CONTEXT.md).

  Units: 1 = 10 mm. The implant is 4.1 mm across and 10 mm long.
*/

/* Implant thread: 0.8 mm pitch, 0.4 mm deep. */
const PITCH = 0.08;
const DEPTH = 0.04;

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
export function gridGeometry(
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

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

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

/** rows x cols: 320 x 192 for a close-up; fewer for several at a distance. */
export function implantGeometry(rows = 320, cols = 192) {
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

export function abutmentGeometry() {
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
export function crownGeometry() {
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

