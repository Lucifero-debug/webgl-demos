import * as THREE from "three";

/**
 * The Alder Flask, built in code: an insulated steel bottle.
 *
 * No GLB, no Draco, no licence. Four meshes and a canvas-drawn wordmark.
 *
 * Every silhouette is a lathe profile with rounded corners. Real objects
 * never have knife edges, and the thin line of light a rounded edge catches
 * is most of what makes a render read as a product instead of a primitive.
 *
 * Mesh names are the contract with PART_MAP in ./colorways:
 *   body  powder-coated steel; takes the colourway and its finish
 *   cap   plastic grip cap; takes the colourway's cap colour
 *   mark  printed wordmark; printed in the cap colour
 *   ring  bare polished steel at the neck; not in PART_MAP, never recoloured
 */

type Point = [radius: number, height: number];

const SEGMENTS = 128;
/** Finer around the cap so each grip ridge gets six vertices. */
const CAP_SEGMENTS = 360;

// Body. Origin at the foot; the caller lifts it onto the shadow plane.
const BODY_R = 0.156;
const FOOT_R = 0.03;
const SHOULDER_Y = 0.54;
const SHOULDER_H = 0.17;
const NECK_R = 0.098;
const NECK_TOP = 0.735;

// Polished steel ring between the shoulder and the cap.
const RING_R = 0.1015;
const RING_FROM = 0.716;
const RING_TO = 0.752;

// Cap.
const CAP_R = 0.108;
const CAP_BOTTOM = RING_TO;
const CAP_TOP = 0.9;
const CAP_EDGE_LOW = 0.004;
const CAP_EDGE_TOP = 0.026;
const GRIP_FROM = 0.764;
const GRIP_TO = 0.862;
const GRIP_RIDGES = 60;
const GRIP_DEPTH = 0.0028;

// Wordmark, printed on a band a hair outside the body.
const MARK_R = BODY_R + 0.0008;
const MARK_FROM = 0.25;
const MARK_TO = 0.33;

export const PRODUCT_HEIGHT = CAP_TOP;

/* ------------------------------------------------------------------ */
/* Profile helpers                                                     */
/* ------------------------------------------------------------------ */

function arc(
  cx: number,
  cy: number,
  r: number,
  from: number,
  to: number,
  steps: number,
): Point[] {
  const out: Point[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = from + ((to - from) * i) / steps;
    out.push([cx + r * Math.cos(t), cy + r * Math.sin(t)]);
  }
  return out;
}

function cubic(p0: Point, p1: Point, p2: Point, p3: Point, steps: number) {
  const out: Point[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const u = 1 - t;
    const a = u * u * u;
    const b = 3 * u * u * t;
    const c = 3 * u * t * t;
    const d = t * t * t;
    out.push([
      a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0],
      a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1],
    ]);
  }
  return out;
}

function line(from: Point, to: Point, steps: number) {
  const out: Point[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    out.push([
      from[0] + (to[0] - from[0]) * t,
      from[1] + (to[1] - from[1]) * t,
    ]);
  }
  return out;
}

/**
 * Joins runs of points into one lathe profile, dropping the duplicate where
 * one run ends and the next begins. A zero-length segment gives LatheGeometry
 * a zero normal, which renders as a black seam.
 */
function profile(...runs: Point[][]) {
  const points: THREE.Vector2[] = [];
  for (const run of runs) {
    for (const [r, y] of run) {
      const last = points[points.length - 1];
      if (last && Math.abs(last.x - r) < 1e-7 && Math.abs(last.y - y) < 1e-7) {
        continue;
      }
      points.push(new THREE.Vector2(r, y));
    }
  }
  return points;
}

/* ------------------------------------------------------------------ */
/* Silhouettes                                                         */
/* ------------------------------------------------------------------ */

function bodyProfile() {
  return profile(
    [[0, 0]],
    // Rounded foot.
    arc(BODY_R - FOOT_R, FOOT_R, FOOT_R, -Math.PI / 2, 0, 10),
    line([BODY_R, FOOT_R], [BODY_R, SHOULDER_Y], 4),
    // Domed shoulder: leaves the body vertically and arrives at the neck
    // vertically, so there is no pinch where it meets either.
    cubic(
      [BODY_R, SHOULDER_Y],
      [BODY_R, SHOULDER_Y + 0.75 * SHOULDER_H],
      [NECK_R, SHOULDER_Y + 0.7 * SHOULDER_H],
      [NECK_R, SHOULDER_Y + SHOULDER_H],
      28,
    ),
    // Hidden under the ring and cap.
    [
      [NECK_R, NECK_TOP],
      [0, NECK_TOP],
    ],
  );
}

function ringProfile() {
  const inner = NECK_R - 0.002;
  const edge = 0.003;
  return profile(
    [[inner, RING_FROM]],
    arc(RING_R - edge, RING_FROM + edge, edge, -Math.PI / 2, 0, 4),
    arc(RING_R - edge, RING_TO - edge, edge, 0, Math.PI / 2, 4),
    [[inner, RING_TO]],
  );
}

function capProfile() {
  return profile(
    [[NECK_R - 0.002, CAP_BOTTOM]],
    arc(
      CAP_R - CAP_EDGE_LOW,
      CAP_BOTTOM + CAP_EDGE_LOW,
      CAP_EDGE_LOW,
      -Math.PI / 2,
      0,
      5,
    ),
    // Densely sampled so the grip ridges have rows of vertices to push.
    line([CAP_R, CAP_BOTTOM + CAP_EDGE_LOW], [CAP_R, CAP_TOP - CAP_EDGE_TOP], 28),
    arc(
      CAP_R - CAP_EDGE_TOP,
      CAP_TOP - CAP_EDGE_TOP,
      CAP_EDGE_TOP,
      0,
      Math.PI / 2,
      14,
    ),
    [[0, CAP_TOP]],
  );
}

/* ------------------------------------------------------------------ */
/* Geometry detail                                                     */
/* ------------------------------------------------------------------ */

/**
 * LatheGeometry duplicates the first column of vertices as the last one to
 * close the seam. computeVertexNormals sees them as unrelated, so each side
 * gets a one-sided normal and a hairline shows. Average them back together.
 */
function stitchSeam(geometry: THREE.BufferGeometry, segments: number) {
  const normal = geometry.getAttribute("normal") as THREE.BufferAttribute;
  const rows = normal.count / (segments + 1);
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();

  for (let j = 0; j < rows; j++) {
    const first = j;
    const last = segments * rows + j;
    a.fromBufferAttribute(normal, first);
    b.fromBufferAttribute(normal, last);
    a.add(b).normalize();
    normal.setXYZ(first, a.x, a.y, a.z);
    normal.setXYZ(last, a.x, a.y, a.z);
  }

  normal.needsUpdate = true;
}

/** Vertical grip ridges, pushed into the cap's side and faded at each end. */
function addGrip(geometry: THREE.LatheGeometry) {
  const position = geometry.getAttribute("position") as THREE.BufferAttribute;
  const fade = 0.012;

  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const y = position.getY(i);
    const z = position.getZ(i);
    if (y <= GRIP_FROM || y >= GRIP_TO) continue;

    const r = Math.hypot(x, z);
    if (r < 1e-6) continue;

    const envelope = Math.min(1, (y - GRIP_FROM) / fade, (GRIP_TO - y) / fade);
    const groove = 0.5 - 0.5 * Math.cos(GRIP_RIDGES * Math.atan2(x, z));
    const k = (r - GRIP_DEPTH * groove * envelope) / r;
    position.setXYZ(i, x * k, y, z * k);
  }

  position.needsUpdate = true;
  geometry.computeVertexNormals();
  stitchSeam(geometry, CAP_SEGMENTS);
}

/* ------------------------------------------------------------------ */
/* Wordmark                                                            */
/* ------------------------------------------------------------------ */

/**
 * White text on transparent. The material's colour tints it, so the mark
 * prints in whatever colour the colourway gives the cap.
 *
 * Canvas is sized to the band's real proportions (circumference by height)
 * so the letters are not stretched when they wrap around the body.
 */
function wordmarkTexture() {
  const width = 2048;
  const height = Math.round(
    (width * (MARK_TO - MARK_FROM)) / (2 * Math.PI * MARK_R),
  );

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;

  const draw = () => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // next/font exposes its hashed family name through this CSS variable.
    const family = getComputedStyle(document.documentElement)
      .getPropertyValue("--font-archivo")
      .trim();

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `600 68px ${family || "Arial, sans-serif"}`;
    (ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing =
      "10px";
    ctx.fillText("Alder", width / 2, height / 2);
    texture.needsUpdate = true;
  };

  draw();
  // The canvas mounts after idle, so the font is almost always loaded by
  // now. If it is not, redraw once it is; the next rendered frame shows it.
  document.fonts?.ready.then(draw);

  return texture;
}

function markGeometry() {
  return new THREE.LatheGeometry(
    [
      new THREE.Vector2(MARK_R, MARK_FROM),
      new THREE.Vector2(MARK_R, MARK_TO),
    ],
    SEGMENTS,
    // Starting the sweep at pi puts the middle of the texture (u = 0.5) on
    // the side facing +Z, towards the camera, and keeps the seam at the back.
    Math.PI,
  );
}

/* ------------------------------------------------------------------ */
/* Assembly                                                            */
/* ------------------------------------------------------------------ */

function part(
  name: string,
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  castShadow = true,
) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  mesh.castShadow = castShadow;
  mesh.receiveShadow = true;
  return mesh;
}

export function buildProduct() {
  const group = new THREE.Group();
  group.name = "alder-flask";

  const body = part(
    "body",
    new THREE.LatheGeometry(bodyProfile(), SEGMENTS),
    new THREE.MeshPhysicalMaterial({
      color: "#cfd2d4",
      metalness: 0,
      roughness: 0.6,
      // Never exactly zero. Crossing zero makes three recompile the shader,
      // which is a visible hitch on the first switch to a gloss colourway.
      clearcoat: 0.02,
      clearcoatRoughness: 0.6,
    }),
  );

  const ring = part(
    "ring",
    new THREE.LatheGeometry(ringProfile(), SEGMENTS),
    new THREE.MeshPhysicalMaterial({
      color: "#d9dbdd",
      metalness: 1,
      roughness: 0.22,
    }),
  );

  const capGeometry = new THREE.LatheGeometry(capProfile(), CAP_SEGMENTS);
  addGrip(capGeometry);
  const cap = part(
    "cap",
    capGeometry,
    new THREE.MeshPhysicalMaterial({
      color: "#cfd2d4",
      metalness: 0,
      roughness: 0.55,
    }),
  );

  const mark = part(
    "mark",
    markGeometry(),
    new THREE.MeshPhysicalMaterial({
      color: "#ffffff",
      map: wordmarkTexture(),
      transparent: true,
      depthWrite: false,
      metalness: 0,
      roughness: 0.45,
      polygonOffset: true,
      polygonOffsetFactor: -2,
    }),
    false,
  );
  mark.renderOrder = 1;

  group.add(body, ring, cap, mark);
  return group;
}

/** Geometries, materials and the wordmark texture are ours to free. */
export function disposeProduct(group: THREE.Group) {
  group.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.geometry.dispose();
    const material = mesh.material as THREE.MeshPhysicalMaterial;
    material.map?.dispose();
    material.dispose();
  });
}
