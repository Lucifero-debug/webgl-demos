"use client";

import { ContactShadows, Environment, Lightformer, useTexture } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { PropertyConfig, TowerSpec } from "@/lib/property/types";
import { runtime } from "@/lib/showcase/runtime";
import { setAnchor } from "@/lib/stage/anchors";
import { applyLens } from "@/lib/stage/lens";
import { dwell } from "@/lib/stage/timing";

/*
  The 3D half of a property explainer: a tower built in code from the spec
  in the config, which comes apart into its bands as the page scrolls.

  One floor is one unit of height, so every distance here reads in floors.

  It is deliberately a model, not a photoreal render: pale plaster, tinted
  glass, a hazy city around it. The building does not exist yet, and a
  model says so honestly while still letting a buyer see what they are
  being sold.
*/

/** How far apart the bands drift when the building separates, in floors. */
const BAND_GAP = 1.7;
/** Turntable speed in the wide views, radians per second. */
const SPIN = 0.045;

/*
  Late afternoon rather than a studio: a graded sky, a low warm sun, and
  windows that have started to come on. A white model on a white ground is
  honest about an unbuilt building but it photographs as nothing, and a
  buyer is being sold a place to live, not a maquette.
*/
const SKY_HIGH = "#6E9FD4";
const SKY_LOW = "#F0DCC0";
const SUN = "#FFD9A0";

const SKY_VERT = /* glsl */ `
  varying vec3 vPos;
  void main() {
    vPos = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const SKY_FRAG = /* glsl */ `
  uniform vec3 uHigh;
  uniform vec3 uLow;
  varying vec3 vPos;
  void main() {
    // Graded from the horizon up, with the band near the horizon warmest.
    float h = clamp(normalize(vPos).y * 1.6 + 0.12, 0.0, 1.0);
    vec3 sky = mix(uLow, uHigh, pow(h, 0.65));
    gl_FragColor = vec4(sky, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

function Sky() {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uHigh: { value: new THREE.Color(SKY_HIGH) },
          uLow: { value: new THREE.Color(SKY_LOW) },
        },
        vertexShader: SKY_VERT,
        fragmentShader: SKY_FRAG,
        side: THREE.BackSide,
        depthWrite: false,
      }),
    [],
  );
  return (
    <mesh material={material} renderOrder={-1}>
      <sphereGeometry args={[320, 32, 16]} />
    </mesh>
  );
}

/* ------------------------------------------------------------------ */
/* The building                                                        */
/* ------------------------------------------------------------------ */

type Built = {
  /** One group per band, in config order, plus the roof as the last one. */
  groups: THREE.Group[];
  /** Each band's middle height, before it moves. */
  middles: number[];
  /** Glass panes by floor, so a floor can be opened up for the plan beat. */
  glass: (THREE.Mesh | null)[];
  /** Walls inside one floor, shown only during the plan beat. */
  interiors: THREE.Group;
  height: number;
  materials: THREE.Material[];
};

type Maps = {
  concrete?: THREE.Texture;
  concreteNormal?: THREE.Texture;
  grass?: THREE.Texture;
  grassNormal?: THREE.Texture;
};

function buildTower(spec: TowerSpec, planFloor: number, maps: Maps = {}): Built {
  const plaster = new THREE.MeshStandardMaterial({
    // Photographed concrete is warm; tint it back towards grey so the
    // building reads as concrete rather than cardboard.
    color: maps.concrete ? "#C4C9C6" : "#EFE9DF",
    map: maps.concrete ?? null,
    normalMap: maps.concreteNormal ?? null,
    roughness: 0.85,
  });
  const base = new THREE.MeshStandardMaterial({
    color: maps.concrete ? "#AEB4B2" : "#DCD3C4",
    map: maps.concrete ?? null,
    normalMap: maps.concreteNormal ?? null,
    roughness: 0.8,
  });
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: "#7FA8C4",
    roughness: 0.05,
    metalness: 0.2,
    transparent: true,
    opacity: 0.72,
    clearcoat: 1,
  });
  // Some homes have their lights on: the cheapest way to make a building
  // look lived in rather than rendered.
  const litMat = new THREE.MeshPhysicalMaterial({
    color: "#7FA8C4",
    roughness: 0.05,
    metalness: 0.2,
    transparent: true,
    opacity: 0.82,
    emissive: new THREE.Color("#FFC583"),
    emissiveIntensity: 0.55,
    clearcoat: 1,
  });
  const rail = new THREE.MeshPhysicalMaterial({
    color: "#BBD0DC",
    roughness: 0.1,
    transparent: true,
    opacity: 0.4,
  });
  const water = new THREE.MeshPhysicalMaterial({
    color: "#5AA3C0",
    roughness: 0.02,
    metalness: 0.1,
    transparent: true,
    opacity: 0.85,
    clearcoat: 1,
  });
  const green = new THREE.MeshStandardMaterial({ color: "#6E8C5A", roughness: 0.95 });
  const wall = new THREE.MeshStandardMaterial({ color: "#E6DFD4", roughness: 0.95 });

  const { width: w, depth: d, balconyDepth: bd } = spec;
  const groups: THREE.Group[] = [];
  const middles: number[] = [];
  const glass: (THREE.Mesh | null)[] = new Array(spec.floors).fill(null);

  const slabGeo = new THREE.BoxGeometry(w, 0.14, d);
  const glassGeo = new THREE.BoxGeometry(w * 0.94, 0.74, d * 0.94);
  const balconyGeo = new THREE.BoxGeometry(w * 0.46, 0.07, bd);
  const railGeo = new THREE.BoxGeometry(w * 0.46, 0.3, 0.04);
  const coreGeo = new THREE.BoxGeometry(w * 0.2, 1, d * 0.42);
  /*
    Mullions: the vertical fins that divide curtain walling, one every
    metre or so. Without them a floor is a single clean pane, which is the
    main reason a modelled building reads as a toy: there is nothing to
    give the eye its scale.
  */
  const mullionGeo = new THREE.BoxGeometry(0.035, 0.78, 0.035);
  const mullionSpacing = 0.34;

  for (const band of spec.bands) {
    const group = new THREE.Group();
    for (let i = band.from; i <= band.to; i++) {
      const podium = i < spec.podiumFloors;
      const y = i;

      if (podium) {
        // The podium oversails the tower on every side.
        const pw = w + spec.podiumSpread * 2;
        const pd = d + spec.podiumSpread * 2;
        const slab = new THREE.Mesh(new THREE.BoxGeometry(pw, 0.16, pd), base);
        slab.position.y = y + 0.08;
        const shopfront = new THREE.Mesh(
          new THREE.BoxGeometry(pw * 0.97, 0.76, pd * 0.97),
          glassMat,
        );
        shopfront.position.y = y + 0.54;
        group.add(slab, shopfront);
      } else {
        const slab = new THREE.Mesh(slabGeo, plaster);
        slab.position.y = y + 0.07;
        // Roughly a third of the homes are lit, scattered rather than
        // striped, so the elevation reads as occupied.
        const lit = (i * 7 + ((i * i) % 5)) % 3 === 0;
        const pane = new THREE.Mesh(glassGeo, lit ? litMat : glassMat);
        pane.position.y = y + 0.52;
        glass[i] = pane;
        const core = new THREE.Mesh(coreGeo, plaster);
        core.position.y = y + 0.5;
        group.add(slab, pane, core);

        // Fins down both long faces, and across the ends.
        for (const side of [1, -1]) {
          for (let x = -w / 2 + mullionSpacing; x < w / 2 - 0.01; x += mullionSpacing) {
            const fin = new THREE.Mesh(mullionGeo, plaster);
            fin.position.set(x, y + 0.52, (side * d * 0.94) / 2);
            group.add(fin);
          }
        }
        for (const side of [1, -1]) {
          for (let z = -d / 2 + mullionSpacing; z < d / 2 - 0.01; z += mullionSpacing) {
            const fin = new THREE.Mesh(mullionGeo, plaster);
            fin.position.set((side * w * 0.94) / 2, y + 0.52, z);
            group.add(fin);
          }
        }

        // Balconies on the long faces, alternating side to side so the
        // elevation has a rhythm rather than a flat grid.
        for (const side of [1, -1]) {
          const shift = ((i % 2 === 0 ? 1 : -1) * w) / 5;
          const floorPlate = new THREE.Mesh(balconyGeo, plaster);
          floorPlate.position.set(shift, y + 0.12, side * (d / 2 + bd / 2));
          const railing = new THREE.Mesh(railGeo, rail);
          railing.position.set(shift, y + 0.28, side * (d / 2 + bd));
          group.add(floorPlate, railing);
        }
      }
    }
    middles.push((band.from + band.to + 1) / 2);
    groups.push(group);
  }

  // The roof: its own group, so it lifts off with the rest.
  const roof = new THREE.Group();
  const top = spec.floors;
  const deck = new THREE.Mesh(new THREE.BoxGeometry(w, 0.16, d), base);
  deck.position.y = top + 0.08;
  const pool = new THREE.Mesh(new THREE.BoxGeometry(w * 0.42, 0.08, d * 0.34), water);
  pool.position.set(-w * 0.22, top + 0.19, 0);
  const lawn = new THREE.Mesh(new THREE.BoxGeometry(w * 0.2, 0.06, d * 0.4), green);
  lawn.position.set(w * 0.12, top + 0.18, -d * 0.2);
  const pavilion = new THREE.Mesh(new THREE.BoxGeometry(w * 0.28, 0.5, d * 0.45), plaster);
  pavilion.position.set(w * 0.28, top + 0.41, d * 0.12);
  const canopy = new THREE.Mesh(new THREE.BoxGeometry(w * 0.34, 0.06, d * 0.52), base);
  canopy.position.set(w * 0.28, top + 0.68, d * 0.12);
  roof.add(deck, pool, lawn, pavilion, canopy);
  for (const side of [1, -1]) {
    const parapet = new THREE.Mesh(new THREE.BoxGeometry(w, 0.3, 0.05), rail);
    parapet.position.set(0, top + 0.3, (side * d) / 2);
    roof.add(parapet);
  }
  middles.push(top + 0.4);
  groups.push(roof);

  /*
    The walls inside one floor, for the plan beat: a spine wall down the
    middle and the line between the two homes. Hidden until that beat, and
    only meaningful once that floor's glass is taken away.
  */
  const interiors = new THREE.Group();
  const spine = new THREE.Mesh(new THREE.BoxGeometry(w * 0.86, 0.6, 0.05), wall);
  spine.position.set(0, planFloor + 0.45, 0);
  const divider = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.6, d * 0.8), wall);
  divider.position.set(0, planFloor + 0.45, 0);
  interiors.add(spine, divider);
  interiors.visible = false;

  return {
    groups,
    middles,
    glass,
    interiors,
    height: top + 0.8,
    materials: [plaster, base, glassMat, litMat, rail, water, green, wall],
  };
}

/**
 * The landscaped plot: lawn, paving and trees around the podium. Trees are
 * a trunk and two blobs, which is enough at this distance and costs
 * nothing to download.
 */
function landscape(spec: TowerSpec, maps: Maps = {}) {
  const group = new THREE.Group();
  const lawn = new THREE.MeshStandardMaterial({
    // The texture is desaturated in the prepare script, so this tint is
    // what decides the colour of the grass.
    color: maps.grass ? "#7A9C56" : "#7FA069",
    map: maps.grass ?? null,
    normalMap: maps.grassNormal ?? null,
    roughness: 1,
  });
  const paving = new THREE.MeshStandardMaterial({ color: "#D8D2C6", roughness: 1 });
  const trunk = new THREE.MeshStandardMaterial({ color: "#7A6A55", roughness: 1 });
  const canopy = new THREE.MeshStandardMaterial({ color: "#5F8350", roughness: 1 });

  const plotW = spec.width + spec.podiumSpread * 2 + 9;
  const plotD = spec.depth + spec.podiumSpread * 2 + 9;
  const grass = new THREE.Mesh(new THREE.BoxGeometry(plotW, 0.06, plotD), lawn);
  grass.position.y = 0.03;
  const forecourt = new THREE.Mesh(
    new THREE.BoxGeometry(spec.width + spec.podiumSpread * 2 + 3, 0.08, 4),
    paving,
  );
  forecourt.position.set(0, 0.05, plotD / 2 - 2.4);
  group.add(grass, forecourt);

  const trunkGeo = new THREE.CylinderGeometry(0.06, 0.08, 0.9, 6);
  const canopyGeo = new THREE.SphereGeometry(0.55, 10, 8);
  let seed = 3;
  const rand = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
  for (let i = 0; i < 26; i++) {
    const edge = rand();
    const x = (rand() - 0.5) * plotW * 0.94;
    const z = (rand() - 0.5) * plotD * 0.94;
    // Keep them off the building footprint.
    if (Math.abs(x) < spec.width / 2 + spec.podiumSpread + 0.8 && Math.abs(z) < spec.depth / 2 + spec.podiumSpread + 0.8) continue;
    const h = 0.8 + edge * 0.7;
    const stem = new THREE.Mesh(trunkGeo, trunk);
    stem.position.set(x, h / 2, z);
    stem.scale.y = h;
    const top = new THREE.Mesh(canopyGeo, canopy);
    top.position.set(x, h + 0.3, z);
    top.scale.setScalar(0.8 + rand() * 0.5);
    group.add(stem, top);
  }
  return group;
}

/**
 * A ring of blocks around the site, so a balcony has something to look at.
 *
 * Kept low and pushed well back: at 18 floors this tower should stand
 * above its neighbours, and blocks placed close and tall crowd the plot, hide
 * the landscaping and turn the balcony view into a wall of boxes.
 */
function cityGeometry(count = 150) {
  const boxes: THREE.Matrix4[] = [];
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  const pos = new THREE.Vector3();
  let seed = 7;
  const rand = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
  for (let i = 0; i < count; i++) {
    const angle = rand() * Math.PI * 2;
    /*
      Two rings: low-rise close in, so the balcony looks out over roofs
      rather than an empty plain, and the rest spread out behind it.
    */
    const near = i % 3 === 0;
    const radius = near ? 17 + rand() * 16 : 34 + rand() * 90;
    const h = near ? 0.9 + rand() * 2.2 : 1.6 + rand() * rand() * 7;
    scale.set(3 + rand() * 6, h, 3 + rand() * 6);
    pos.set(Math.cos(angle) * radius, h / 2, Math.sin(angle) * radius);
    q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rand() * Math.PI);
    boxes.push(m.clone().compose(pos, q, scale));
  }
  return boxes;
}

/* ------------------------------------------------------------------ */
/* Camera                                                              */
/* ------------------------------------------------------------------ */

type Shot = {
  pos: THREE.Vector3;
  target: THREE.Vector3;
  fov: number;
  offset: THREE.Vector2;
  /** Wide views turn slowly; the close ones hold still. */
  orbit: boolean;
};

/** Distance needed to fit `height` floors on screen at this field of view. */
const fit = (height: number, fov: number) =>
  height / (2 * Math.tan(THREE.MathUtils.degToRad(fov) / 2));

function buildShots(config: PropertyConfig, aspect: number) {
  const portrait = aspect < 1;
  const back = portrait ? 1.45 : 1;
  const fov = 30;
  const spec = config.tower;
  const top = spec.floors + 0.8;

  const side = (align: "left" | "right") =>
    portrait
      ? new THREE.Vector2(0, 0.12)
      : new THREE.Vector2(align === "left" ? 0.2 : -0.2, 0);

  const orbit = (
    y: number,
    height: number,
    azimuth: number,
    elevation: number,
    align: "left" | "right",
    turning = false,
  ): Shot => {
    const az = THREE.MathUtils.degToRad(azimuth);
    const el = THREE.MathUtils.degToRad(elevation);
    const target = new THREE.Vector3(0, y, 0);
    const d = fit(height, fov) * back;
    return {
      pos: target
        .clone()
        .add(
          new THREE.Vector3(
            Math.cos(el) * Math.sin(az),
            Math.sin(el),
            Math.cos(el) * Math.cos(az),
          ).multiplyScalar(d),
        ),
      target,
      fov,
      offset: side(align),
      orbit: turning,
    };
  };

  const shots: Shot[] = [
    // The whole tower, turning slowly on its plot.
    orbit(top * 0.46, top * 1.3, 35, 12, "left", true),
    // Separated: the stack grows by a gap per band, and needs headroom
    // above and below or the ends drift out of frame.
    orbit(
      (top + spec.bands.length * BAND_GAP) * 0.5,
      (top + spec.bands.length * BAND_GAP) * 1.35,
      28,
      8,
      "right",
    ),
  ];
  const apart = [0, 1];

  for (const beat of config.beats) {
    if (beat.kind === "floor") {
      shots.push(orbit(beat.floor + 0.5, 4.2, 42, 12, beat.align));
      apart.push(0);
    } else if (beat.kind === "view") {
      /*
        Standing in the flat, looking out through the opening onto the
        balcony and over the city. The camera sits back inside the room
        rather than out in the air: the balcony floor and railing then
        cross the bottom of the frame, which is what makes it read as a
        view from somewhere rather than a drone hovering outside. That
        floor's glass is taken away for this beat (see Tower).
      */
      const y = beat.floor + 0.45;
      const z = spec.depth / 2 - 0.6;
      // Half a mullion across, so a fin does not sit down the middle of
      // the view.
      const x = spec.width / 5 + 0.17;
      shots.push({
        pos: new THREE.Vector3(x, y, z),
        target: new THREE.Vector3(x, y - 2.2, z + 26),
        fov: 55,
        offset: side(beat.align),
        orbit: false,
      });
      apart.push(0);
    } else {
      shots.push(orbit(spec.floors + 0.5, 5.5, 22, 34, beat.align));
      apart.push(0);
    }
  }

  // Cost, last: the whole building again, from the other side.
  shots.push(orbit(top * 0.46, top * 1.3, -30, 10, "right", true));
  apart.push(0);

  return { shots, apart };
}

/** Shared per frame: how far apart the bands are, written by the rig. */
type Motion = { apart: number; beat: number };

function CameraRig({
  shots,
  apart,
  motion,
}: {
  shots: Shot[];
  apart: number[];
  motion: Motion;
}) {
  const camera = useThree((state) => state.camera) as THREE.PerspectiveCamera;
  const look = useRef<THREE.Vector3 | null>(null);
  const lens = useRef({ fov: shots[0].fov, offset: shots[0].offset.clone() });
  const yaw = useRef(0);
  const w = useMemo(
    () => ({
      pos: new THREE.Vector3(),
      a: new THREE.Vector3(),
      b: new THREE.Vector3(),
      target: new THREE.Vector3(),
      offset: new THREE.Vector2(),
    }),
    [],
  );

  useFrame((state, delta) => {
    yaw.current += delta * SPIN;
    const span = shots.length - 1;
    const x = THREE.MathUtils.clamp(runtime.progress, 0, 1) * span;
    const i = Math.min(span - 1, Math.floor(x));
    const t = dwell(x - i);
    const a = shots[i];
    const b = shots[i + 1];
    motion.beat = x;

    // Wide views turn slowly, by spinning the camera about the tower.
    w.a.copy(a.pos);
    if (a.orbit) w.a.applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw.current);
    w.b.copy(b.pos);
    if (b.orbit) w.b.applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw.current);

    w.pos.lerpVectors(w.a, w.b, t);
    w.target.lerpVectors(a.target, b.target, t);
    w.offset.lerpVectors(a.offset, b.offset, t);
    const fovNow = THREE.MathUtils.lerp(a.fov, b.fov, t);
    const wantApart = THREE.MathUtils.lerp(apart[i], apart[i + 1], t);

    const k = 1 - Math.exp(-delta * 4);
    camera.position.lerp(w.pos, k);
    if (!look.current) look.current = w.target.clone();
    look.current.lerp(w.target, k);
    camera.lookAt(look.current);
    motion.apart += (wantApart - motion.apart) * k;

    lens.current.fov += (fovNow - lens.current.fov) * k;
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
/* Scene                                                               */
/* ------------------------------------------------------------------ */

function Tower({
  config,
  motion,
  maps = {},
}: {
  config: PropertyConfig;
  motion: Motion;
  maps?: Maps;
}) {
  const planBeatIndex = config.beats.findIndex((b) => b.kind === "floor");
  const planBeat = config.beats[planBeatIndex];
  const planFloor = planBeat && planBeat.kind === "floor" ? planBeat.floor : 6;
  const viewBeatIndex = config.beats.findIndex((b) => b.kind === "view");
  const viewBeat = config.beats[viewBeatIndex];
  const viewFloor = viewBeat && viewBeat.kind === "view" ? viewBeat.floor : -1;

  const built = useMemo(
    () => buildTower(config.tower, planFloor, maps),
    [config, planFloor, maps],
  );
  const plot = useMemo(() => landscape(config.tower, maps), [config, maps]);

  /*
    Everything in the building both casts and receives the sun. Without
    this the tower looks pasted onto the plot: no shadow across the grass,
    and no balcony shading the home below it.
  */
  useMemo(() => {
    for (const group of [...built.groups, plot]) {
      group.traverse((object) => {
        if ((object as THREE.Mesh).isMesh) {
          object.castShadow = true;
          object.receiveShadow = true;
        }
      });
    }
  }, [built, plot]);

  /* The city around the site: one instanced box, placed once. */
  const city = useMemo(() => {
    const boxes = cityGeometry();
    const mesh = new THREE.InstancedMesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshStandardMaterial({ color: "#DCD9D3", roughness: 0.95 }),
      boxes.length,
    );
    boxes.forEach((m, i) => mesh.setMatrixAt(i, m));
    mesh.instanceMatrix.needsUpdate = true;
    return mesh;
  }, []);

  useFrame(() => {
    // Separate the bands, and open up the floors being explained.
    built.groups.forEach((group, k) => {
      group.position.y = k * BAND_GAP * motion.apart;
    });
    const onPlan = planBeatIndex >= 0 && Math.abs(motion.beat - (2 + planBeatIndex)) < 0.45;
    built.interiors.visible = onPlan;
    const plan = built.glass[planFloor];
    if (plan) plan.visible = !onPlan;

    // The view beat stands inside the flat, so its glass comes away too;
    // looking through a tinted pane would colour the whole view.
    const onView = viewBeatIndex >= 0 && Math.abs(motion.beat - (2 + viewBeatIndex)) < 0.5;
    const pane = built.glass[viewFloor];
    if (pane) pane.visible = !onView;
  });

  return (
    <group>
      {built.groups.map((group, i) => (
        <primitive key={i} object={group} />
      ))}
      <primitive object={built.interiors} />

      {/* The plot, and the city beyond it. */}
      <primitive object={plot} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[400, 400]} />
        <meshStandardMaterial color="#A7AE95" roughness={1} />
      </mesh>
      <primitive object={city} />
    </group>
  );
}

/**
 * The same building, with photographed surfaces. Kept as its own component
 * because the textures load through a hook, and hooks cannot be called
 * only when a config happens to name some files.
 */
function TexturedTower({ config, motion }: { config: PropertyConfig; motion: Motion }) {
  const surfaces = config.surfaces!;
  const paths = useMemo(() => {
    const list: Record<string, string> = {};
    if (surfaces.concrete?.map) list.concrete = surfaces.concrete.map;
    if (surfaces.concrete?.normal) list.concreteNormal = surfaces.concrete.normal;
    if (surfaces.grass?.map) list.grass = surfaces.grass.map;
    if (surfaces.grass?.normal) list.grassNormal = surfaces.grass.normal;
    return list;
  }, [surfaces]);

  const loaded = useTexture(paths) as unknown as Maps;

  const maps = useMemo(() => {
    const tile = (texture: THREE.Texture | undefined, repeat: number, colour: boolean) => {
      if (!texture) return undefined;
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(repeat, repeat);
      texture.colorSpace = colour ? THREE.SRGBColorSpace : THREE.NoColorSpace;
      texture.needsUpdate = true;
      return texture;
    };
    const c = surfaces.concrete?.repeat ?? 2;
    const g = surfaces.grass?.repeat ?? 14;
    return {
      concrete: tile(loaded.concrete, c, true),
      concreteNormal: tile(loaded.concreteNormal, c, false),
      grass: tile(loaded.grass, g, true),
      grassNormal: tile(loaded.grassNormal, g, false),
    } satisfies Maps;
  }, [loaded, surfaces]);

  return <Tower config={config} motion={motion} maps={maps} />;
}
/**
 * Projects the points the page's HTML labels hang off: each band's side
 * while the building is separated, and the homes on the floor being
 * explained. Pushed sideways along the camera's own right, so they stay
 * clear of the building as it turns.
 */
function Anchors({ config, motion }: { config: PropertyConfig; motion: Motion }) {
  const spec = config.tower;
  const planBeat = config.beats.find((b) => b.kind === "floor");
  const w = useMemo(
    () => ({ right: new THREE.Vector3(), p: new THREE.Vector3(), ndc: new THREE.Vector3() }),
    [],
  );

  useFrame(({ camera, size }) => {
    camera.updateMatrixWorld();
    w.right.setFromMatrixColumn(camera.matrixWorld, 0).normalize();

    const put = (key: string, point: THREE.Vector3) => {
      w.ndc.copy(point).project(camera);
      setAnchor(
        key,
        (w.ndc.x * 0.5 + 0.5) * size.width,
        (-w.ndc.y * 0.5 + 0.5) * size.height,
        w.ndc.z < 1 && Math.abs(w.ndc.x) < 1.15 && Math.abs(w.ndc.y) < 1.15,
      );
    };

    spec.bands.forEach((band, k) => {
      const middle = (band.from + band.to + 1) / 2 + k * BAND_GAP * motion.apart;
      w.p.set(0, middle, 0).addScaledVector(w.right, -(spec.width / 2 + 0.6));
      put(`prop:band:${band.id}`, w.p);
    });

    if (planBeat && planBeat.kind === "floor") {
      planBeat.units.forEach((unit, k) => {
        const centre = (unit.span[0] + unit.span[1]) / 2 - 0.5;
        w.p
          .set(0, planBeat.floor + 0.55, 0)
          .addScaledVector(w.right, centre * spec.width * 0.9);
        put(`prop:unit:${k}`, w.p);
      });
    }
  });

  return null;
}

function aim(self: THREE.Object3D) {
  self.lookAt(0, 0, 0);
}

/**
 * Late-afternoon light, built in code: a warm low sun, cool sky fill from
 * above and warm bounce from the ground, plus soft panels for the glass to
 * reflect. Glass shows its surroundings, so the surroundings are the image.
 */
function Daylight() {
  return (
    <Environment resolution={256} background={false}>
      <color attach="background" args={["#8FAFCF"]} />
      {/* The sun's side: big, warm, low. */}
      <Lightformer form="rect" color={SUN} intensity={5} position={[-40, 22, 26]} scale={[26, 26, 1]} onUpdate={aim} />
      {/* Cool sky opposite, so the shaded faces are not dead. */}
      <Lightformer form="rect" color="#BBD6F2" intensity={1.8} position={[34, 26, -20]} scale={[20, 24, 1]} onUpdate={aim} />
      {/* Warm ground bounce. */}
      <Lightformer form="rect" color="#E8CFA6" intensity={1.1} position={[0, -16, 18]} scale={[40, 12, 1]} onUpdate={aim} />
    </Environment>
  );
}

export default function TowerScene({ config }: { config: PropertyConfig }) {
  const aspect = useThree((state) => state.size.width / state.size.height);
  const { shots, apart } = useMemo(() => buildShots(config, aspect), [config, aspect]);
  const motion = useMemo<Motion>(() => ({ apart: 0, beat: 0 }), []);
  const textured = Boolean(config.surfaces?.concrete || config.surfaces?.grass);

  return (
    <>
      <CameraRig shots={shots} apart={apart} motion={motion} />

      {/*
        A real sky when one is provided: the HDRI lights the scene and
        shows in the glass, which is what a coded gradient cannot do.
        Without it, the painted sky and panel lights below take over.
      */}
      {config.hdri ? (
        <Environment files={config.hdri} background backgroundBlurriness={0} environmentIntensity={1.1} />
      ) : (
        <>
          <Sky />
          <Daylight />
        </>
      )}

      {textured ? (
        <TexturedTower config={config} motion={motion} />
      ) : (
        <Tower config={config} motion={motion} />
      )}
      <Anchors config={config} motion={motion} />

      {/*
        The sun, casting for real. Barely tinted: the HDRI already carries
        the sky's colour, and a strongly amber light on top of it turned
        every concrete surface tan.
      */}
      <directionalLight
        position={[-28, 34, 18]}
        intensity={config.hdri ? 1.4 : 2.6}
        color={config.hdri ? "#FFF1DE" : SUN}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
        shadow-camera-near={1}
        shadow-camera-far={120}
        shadow-camera-left={-26}
        shadow-camera-right={26}
        shadow-camera-top={34}
        shadow-camera-bottom={-6}
      />
      {!config.hdri && <hemisphereLight args={["#AFCBEA", "#C8A87E", 0.7]} />}
      {/* Still worth having under the podium, where the sun cannot reach. */}
      <ContactShadows position={[0, 0.09, 0]} opacity={0.28} scale={30} blur={2.4} far={10} color="#4A4330" />
      {/* Haze the colour of distant sky, not of sand, and far enough out
          that only the city edge is touched by it. */}
      <fog attach="fog" args={["#C6D3DC", 90, 320]} />
    </>
  );
}
