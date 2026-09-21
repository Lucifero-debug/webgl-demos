"use client";

import {
  Center,
  ContactShadows,
  Environment,
  Lightformer,
  OrbitControls,
  Resize,
  useGLTF,
} from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import gsap from "gsap";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { Colorway } from "@/lib/colorways";
import { scroll } from "@/lib/scroll";

/**
 * Shopify's Materials Variants Shoe, CC BY 4.0. The page carries the credit
 * line the licence requires; do not remove it.
 */
const MODEL = "/models/shoe.glb";

useGLTF.preload(MODEL, "/draco/");

/** Where the shadow plane sits. */
const FOOT_Y = -0.28;
/** Longest side of the shoe, in scene units, whatever size the file uses. */
const LENGTH = 1.35;
/**
 * In the file the toe points along +X. Rotating by pi turns the toe to the
 * left; the extra 0.55 rad brings it round towards the viewer for a
 * three-quarter view, the usual sneaker product shot.
 */
const HERO_ANGLE = Math.PI + 0.55;
/**
 * Camera distance on a landscape screen. Far back with a long lens (see
 * HERO_POSITION), the way product photographers shoot.
 */
const BASE_DISTANCE = 3.24;

const TAU = Math.PI * 2;

/* Motion. */
/** Resting height above the shadow plane: the shoe levitates. */
const HOVER = 0.035;
/** Bob either side of HOVER, and its speed. */
const BOB = 0.015;
const BOB_SPEED = 1.1;
/** How far the shoe turns and tilts towards the cursor, in radians. */
const PARALLAX_TURN = 0.14;
const PARALLAX_TILT = 0.05;
/** Entrance: drifts down from this height and turns in from this angle. */
const ENTER_DROP = 0.15;
const ENTER_TURN = -0.45;
/** Colourway change: one full turn, material swapped at the halfway point. */
const SPIN_DURATION = 0.95;

/* ------------------------------------------------------------------ */
/* Scroll story: camera shots                                          */
/* ------------------------------------------------------------------ */

const UP = new THREE.Vector3(0, 1, 0);
/** World directions once the shoe is turned to HERO_ANGLE. */
const TOE = new THREE.Vector3(Math.cos(HERO_ANGLE), 0, -Math.sin(HERO_ANGLE));
const HEEL = TOE.clone().negate();
/** The side of the shoe that faces the camera in the hero view. */
const FACING = new THREE.Vector3(-Math.sin(HERO_ANGLE), 0, -Math.cos(HERO_ANGLE));

/**
 * Stood back with a long lens (24 degree fov) rather than close with a wide
 * one: identical framing, flatter perspective. Close and wide distorts the
 * shoe the way a phone held near it does; far and long reads as a product
 * photograph.
 */
const HERO_POSITION = new THREE.Vector3(0, 0.675, 3.17);
/** The hero's height angle. The finale's turntable is locked to it. */
const HERO_POLAR = Math.acos(HERO_POSITION.y / HERO_POSITION.length());

type Shot = { pos: THREE.Vector3; look: THREE.Vector3; fov: number };

/** Sum of direction * amount pairs: a point or direction in shoe terms. */
function along(...parts: [THREE.Vector3, number][]) {
  const out = new THREE.Vector3();
  for (const [direction, amount] of parts) out.addScaledVector(direction, amount);
  return out;
}

/**
 * A close-up of `detail`, seen from `from` at `distance`.
 *
 * On landscape screens the aim shifts so the detail sits off centre, leaving
 * the other half of the screen for the chapter's text: `side` > 0 puts it
 * right of centre, < 0 left, and `lift` > 0 raises it, < 0 lowers it (both
 * as fractions of the frame). On portrait screens the text sits at the
 * bottom instead, so only `portraitLift` applies, keeping the detail above
 * the text.
 */
type CloseUp = {
  detail: THREE.Vector3;
  from: THREE.Vector3;
  distance: number;
  side: number;
  lift: number;
  portraitLift: number;
  fov: number;
};

function closeUp(shot: CloseUp, aspect: number, scale: number): Shot {
  const d = shot.from.clone().normalize();
  const distance = shot.distance * scale;
  const pos = shot.detail.clone().addScaledVector(d, distance);
  const look = shot.detail.clone();
  const height = 2 * distance * Math.tan(THREE.MathUtils.degToRad(shot.fov / 2));

  if (aspect >= 1) {
    const right = new THREE.Vector3().crossVectors(d.clone().negate(), UP).normalize();
    look.addScaledVector(right, -shot.side * height * aspect);
    look.addScaledVector(UP, -shot.lift * height);
  } else {
    look.addScaledVector(UP, -shot.portraitLift * height);
  }

  return { pos, look, fov: shot.fov };
}

/**
 * The three detail shots.
 *
 * Framed by simulating the camera against the model file and checking each
 * view against where the chapter text and header sit on screen, on a
 * desktop viewport and a phone. Each keeps the detail clear of the text,
 * lets the product bleed off the far edge the way a macro shot does, and
 * stays below the header. A long lens (20 degrees) compresses them the way
 * a product photographer shoots details.
 */
const DETAILS: CloseUp[] = [
  // The upper: knit, laces and eyelets, from the front and above.
  {
    detail: along([TOE, 0.22], [FACING, 0.12], [UP, 0.02]),
    from: along([FACING, 0.8], [TOE, 0.35], [UP, 0.34]),
    distance: 2.25,
    side: 0.16,
    lift: -0.13,
    portraitLift: 0.2,
    fov: 20,
  },
  // The midsole: a floor-level profile with the foam sole leading.
  {
    detail: along([FACING, 0.2], [UP, -0.19]),
    from: along([FACING, 1], [HEEL, 0.25], [UP, 0.08]),
    distance: 2.5,
    side: -0.18,
    lift: -0.24,
    portraitLift: 0,
    fov: 20,
  },
  // The heel: round the back, the pull tab and padded collar.
  {
    detail: along([HEEL, 0.55], [FACING, 0.05], [UP, 0.12]),
    from: along([HEEL, 0.8], [FACING, 0.55], [UP, 0.3]),
    distance: 2.45,
    side: 0.16,
    lift: 0,
    portraitLift: 0.2,
    fov: 20,
  },
];

/** One shot per page section, in order: hero, three details, finale. */
function buildShots(aspect: number, fit: number): Shot[] {
  const hero: Shot = {
    pos: HERO_POSITION.clone().multiplyScalar(fit),
    look: new THREE.Vector3(),
    fov: 24,
  };
  // Narrow screens stand further back so the detail still fits the width.
  const near = Math.min(fit, 1.5);

  return [
    hero,
    ...DETAILS.map((shot) => closeUp(shot, aspect, near)),
    // Finale: back out to the hero, where the configurator takes over.
    { pos: hero.pos.clone(), look: hero.look.clone(), fov: hero.fov },
  ];
}

/**
 * Holds still near each shot and moves between them: the camera rests on a
 * detail while its text is read, then glides on. Smoothstep, so it eases
 * out of one shot and into the next rather than jerking.
 */
function dwell(t: number) {
  const x = THREE.MathUtils.clamp((t - 0.15) / 0.7, 0, 1);
  return x * x * (3 - 2 * x);
}

type Controls = { enabled: boolean } | null;

/**
 * Flies the camera through the shots as the page scrolls. At the bottom of
 * the page it hands the camera to OrbitControls, once the camera has settled
 * on the final shot so the handover never jumps. Scrolling back up takes it
 * back, easing from wherever the visitor left it.
 */
function ScrollRig({ aspect, fit }: { aspect: number; fit: number }) {
  const camera = useThree((state) => state.camera) as THREE.PerspectiveCamera;
  const controls = useThree((state) => state.controls) as unknown as Controls;
  const shots = useMemo(() => buildShots(aspect, fit), [aspect, fit]);

  const look = useRef(new THREE.Vector3());
  const goalPos = useMemo(() => new THREE.Vector3(), []);
  const goalLook = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, delta) => {
    const last = shots[shots.length - 1];
    const atEnd = scroll.progress > 0.985;

    if (controls) {
      if (!atEnd) {
        controls.enabled = false;
      } else if (!controls.enabled && camera.position.distanceTo(last.pos) < 0.03) {
        look.current.copy(last.look);
        controls.enabled = true;
      }
      if (controls.enabled) return;
    }

    const span = shots.length - 1;
    const x = THREE.MathUtils.clamp(scroll.progress, 0, 1) * span;
    const i = Math.min(span - 1, Math.floor(x));
    const t = dwell(x - i);
    const a = shots[i];
    const b = shots[i + 1];

    goalPos.lerpVectors(a.pos, b.pos, t);
    goalLook.lerpVectors(a.look, b.look, t);
    const fov = a.fov + (b.fov - a.fov) * t;

    // Ease towards the goal every frame: smooth even if scrolling is not.
    const k = 1 - Math.exp(-delta * 5);
    camera.position.lerp(goalPos, k);
    look.current.lerp(goalLook, k);
    camera.lookAt(look.current);
    camera.fov += (fov - camera.fov) * k;
    camera.updateProjectionMatrix();
  });

  return null;
}

/* ------------------------------------------------------------------ */
/* The shoe                                                            */
/* ------------------------------------------------------------------ */

type VariantParser = {
  getDependency(type: "material", index: number): Promise<THREE.Material>;
  getDependencies(type: "material"): Promise<THREE.Material[]>;
  assignFinalMaterial(mesh: THREE.Mesh): void;
};

type MeshVariants = {
  mappings: { material: number; variants: number[] }[];
};

type FileVariants = { variants: { name: string }[] };

/** The material each mesh loaded with, restored for any unmapped variant. */
const defaults = new WeakMap<THREE.Mesh, THREE.Material | THREE.Material[]>();

/* ------------------------------------------------------------------ */
/* Fabric: correcting the model's materials                            */
/* ------------------------------------------------------------------ */

/** One fabric material per source material, shared across swaps. */
const fabrics = new WeakMap<THREE.Material, THREE.MeshPhysicalMaterial>();

/**
 * Trilinear filtering plus anisotropy. The file asks for LINEAR_MIPMAP_
 * NEAREST, which bands visibly, and three leaves anisotropy off, so the
 * knit smears wherever the surface turns away from the camera.
 */
function sharpen(texture: THREE.Texture | null, anisotropy: number) {
  if (!texture || texture.userData.sharpened) return;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.anisotropy = anisotropy;
  texture.userData.sharpened = true;
  texture.needsUpdate = true;
}

/**
 * Rebuilds a variant's material as fabric.
 *
 * The file marks the coloured knit upper as about 60% metal (measured: 97%
 * of the upper's texels sit above 0.4, mean 0.59). Metal takes its colour
 * from reflections, so the knit rendered like painted rubber. Metalness is
 * forced to zero here, which is what cloth actually is.
 *
 * Sheen is added: the soft glow woven fabric shows at grazing angles, and
 * the strongest single cue that says "cloth". Its tint comes from the
 * colourway's own texture, so each colourway's sheen matches its fibres.
 *
 * Takes the material after assignFinalMaterial, which has already flipped
 * the normal map's green channel for glTF; copying normalScale keeps that.
 */
function fabric(source: THREE.Material, anisotropy: number) {
  const cached = fabrics.get(source);
  if (cached) return cached;

  const base = source as THREE.MeshStandardMaterial;
  for (const texture of [base.map, base.normalMap, base.roughnessMap, base.aoMap]) {
    sharpen(texture, anisotropy);
  }

  const material = new THREE.MeshPhysicalMaterial({
    name: base.name,
    map: base.map,
    normalMap: base.normalMap,
    normalScale: base.normalScale.clone(),
    roughnessMap: base.roughnessMap,
    roughness: base.roughness,
    aoMap: base.aoMap,
    aoMapIntensity: base.aoMapIntensity,
    metalness: 0,
    sheen: 0.6,
    sheenRoughness: 0.8,
    sheenColor: new THREE.Color(1, 1, 1),
    sheenColorMap: base.map,
  });

  fabrics.set(source, material);
  return material;
}

function Shoe({ variant }: { variant: string }) {
  const gltf = useGLTF(MODEL, "/draco/");
  const parser = gltf.parser as unknown as VariantParser;
  const gl = useThree((state) => state.gl);
  const anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy());

  /** Outer: levitation, cursor tilt and entrance, in world units. */
  const motion = useRef<THREE.Group>(null);
  /** Inner: the colourway spin, about the shoe's own vertical axis. */
  const spin = useRef<THREE.Group>(null);

  /**
   * The variant whose materials are on the model right now. It lags the
   * `variant` prop by half a spin: the new material goes on while the shoe
   * is turning fastest, so the switch itself is never seen.
   */
  const [shown, setShown] = useState(variant);
  const previous = useRef(variant);

  const variantNames = useMemo(() => {
    const ext = gltf.userData?.gltfExtensions?.KHR_materials_variants as
      | FileVariants
      | undefined;
    return (ext?.variants ?? []).map((v) => v.name.toLowerCase());
  }, [gltf]);

  useEffect(() => {
    gltf.scene.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
    });
    // Every variant loaded up front, so the mid-spin swap is instant.
    parser.getDependencies("material");
  }, [gltf, parser]);

  /* Spin on colourway change. */
  useEffect(() => {
    // Compared by value, so StrictMode's double mount never spins on load.
    if (previous.current === variant) return;
    previous.current = variant;

    const group = spin.current;
    if (!group) {
      setShown(variant);
      return;
    }

    // Finish on the next whole turn. If a spin was interrupted by another
    // click, this carries on from wherever it got to.
    const from = group.rotation.y;
    const to = (Math.floor(from / TAU) + 1) * TAU;
    const progress = { p: 0 };
    let swapped = false;

    const tween = gsap.to(progress, {
      p: 1,
      duration: SPIN_DURATION,
      ease: "power3.inOut",
      onUpdate: () => {
        group.rotation.y = from + (to - from) * progress.p;
        if (!swapped && progress.p >= 0.5) {
          swapped = true;
          setShown(variant);
        }
      },
      onComplete: () => {
        // A whole number of turns: resetting to zero changes nothing visible.
        group.rotation.y = 0;
      },
    });

    return () => {
      tween.kill();
    };
  }, [variant]);

  /* Put the shown variant's materials on the model. */
  useEffect(() => {
    const index = variantNames.indexOf(shown.toLowerCase());
    if (index === -1 && process.env.NODE_ENV !== "production") {
      console.warn(
        `[configurator] no variant "${shown}" in the model. Found:`,
        variantNames,
      );
    }

    let cancelled = false;

    gltf.scene.traverse((child) => {
      const mesh = child as THREE.Mesh;
      const def = mesh.userData?.gltfExtensions?.KHR_materials_variants as
        | MeshVariants
        | undefined;
      if (!mesh.isMesh || !def) return;

      if (!defaults.has(mesh)) defaults.set(mesh, mesh.material);
      const mapping = def.mappings.find((m) => m.variants.includes(index));

      (async () => {
        const material = mapping
          ? await parser.getDependency("material", mapping.material)
          : defaults.get(mesh)!;
        if (cancelled) return;
        mesh.material = material;
        if (mapping) parser.assignFinalMaterial(mesh);
        mesh.material = fabric(mesh.material as THREE.Material, anisotropy);
      })();
    });

    return () => {
      cancelled = true;
    };
  }, [gltf, parser, shown, variantNames, anisotropy]);

  /* Entrance: runs once, as the poster fades out. */
  const entrance = useRef({ p: 0 });
  useEffect(() => {
    const tween = gsap.to(entrance.current, {
      p: 1,
      duration: 1.6,
      ease: "power3.out",
    });
    return () => {
      tween.kill();
    };
  }, []);

  /* Levitation, cursor tilt and entrance, every frame. */
  const tilt = useRef({ x: 0, y: 0 });
  useFrame((state, delta) => {
    const group = motion.current;
    if (!group) return;

    // Calmer when the camera is close: a bob that reads as gentle from
    // across the room looks like wobble in a macro shot.
    const calm = THREE.MathUtils.clamp(
      state.camera.position.length() / BASE_DISTANCE,
      0.3,
      1,
    );

    const enter = 1 - entrance.current.p;
    const bob = Math.sin(state.clock.elapsedTime * BOB_SPEED) * BOB * calm;

    const k = 1 - Math.exp(-delta * 4);
    tilt.current.y += (state.pointer.x * PARALLAX_TURN * calm - tilt.current.y) * k;
    tilt.current.x += (-state.pointer.y * PARALLAX_TILT * calm - tilt.current.x) * k;

    group.position.y = HOVER + bob + enter * ENTER_DROP;
    group.rotation.y = tilt.current.y + enter * ENTER_TURN;
    group.rotation.x = tilt.current.x;
  });

  /*
    Resize scales the model so its longest side is 1; the placement group
    scales that to LENGTH. Center with `top` sits the sole on y = 0, which the
    placement group moves down to FOOT_Y. Together they make the file's own
    units and origin irrelevant.
  */
  return (
    <group ref={motion}>
      <group position={[0, FOOT_Y, 0]} rotation={[0, HERO_ANGLE, 0]} scale={LENGTH}>
        <group ref={spin}>
          <Center top>
            <Resize>
              <primitive object={gltf.scene} />
            </Resize>
          </Center>
        </group>
      </group>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Lighting and scene                                                  */
/* ------------------------------------------------------------------ */

function aim(self: THREE.Object3D) {
  self.lookAt(0, 0, 0);
}

/**
 * A product-photography rig built in code, in place of an HDRI. Tall
 * softboxes give long, clean highlights, and it downloads nothing.
 */
function Studio() {
  return (
    <Environment resolution={256} background={false}>
      <Lightformer
        form="rect"
        intensity={3}
        position={[-2.2, 1, 2.4]}
        scale={[1.2, 4, 1]}
        onUpdate={aim}
      />
      <Lightformer
        form="rect"
        intensity={2.5}
        position={[2.6, 0.8, -1]}
        scale={[0.5, 4, 1]}
        onUpdate={aim}
      />
      <Lightformer
        form="rect"
        intensity={1.5}
        position={[0, 3.2, 0.4]}
        scale={[3, 2, 1]}
        onUpdate={aim}
      />
      <Lightformer
        form="rect"
        intensity={0.4}
        position={[1.8, 0, 3.5]}
        scale={[4, 3, 1]}
        onUpdate={aim}
      />
      {/*
        Bounce card: a low, wide reflector in front of the shoe, the way a
        photographer lays a white card on the floor. It lifts the sides of
        the white sole, which face away from every other light and would
        otherwise read as grey.
      */}
      <Lightformer
        form="rect"
        intensity={1.2}
        position={[0, -1.4, 2.6]}
        scale={[5, 1.5, 1]}
        onUpdate={aim}
      />
    </Environment>
  );
}

export default function Configurator({ colorway }: { colorway: Colorway }) {
  const gl = useThree((state) => state.gl);
  const aspect = useThree((state) => state.size.width / state.size.height);
  // Narrow screens see less width, and a shoe is wide: back the camera off.
  const fit = aspect >= 1.2 ? 1 : Math.min(2.2, 1.2 / aspect);

  /*
    OrbitControls claims every touch on the canvas, which would stop a phone
    scrolling the page. pan-y hands vertical swipes back to the browser, so
    swiping up and down scrolls and swiping sideways turns the shoe. Runs
    after OrbitControls has attached, because child effects run first.
  */
  useEffect(() => {
    gl.domElement.style.touchAction = "pan-y";
  }, [gl]);

  return (
    <>
      <ScrollRig aspect={aspect} fit={fit} />

      <directionalLight
        position={[-2, 3, 2.5]}
        intensity={0.6}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0002}
        shadow-normalBias={0.012}
        shadow-camera-left={-0.9}
        shadow-camera-right={0.9}
        shadow-camera-top={0.9}
        shadow-camera-bottom={-0.9}
        shadow-camera-near={0.5}
        shadow-camera-far={8}
      />

      <Shoe variant={colorway.variant} />
      <Studio />

      {/*
        Re-rendered every frame, since the shoe moves. Contact shadows fade
        with distance, so the shadow softens as the shoe bobs up and firms as
        it comes down, which is what sells the levitation.
      */}
      <ContactShadows
        position={[0, FOOT_Y - 0.001, 0]}
        opacity={0.55}
        scale={3.5}
        blur={2.4}
        far={1}
      />

      {/*
        Only active in the finale; ScrollRig switches it on and off. A
        turntable: the height angle is locked to the hero's, and there is no
        wheel zoom because the wheel scrolls the page.
      */}
      <OrbitControls
        makeDefault
        enablePan={false}
        enableZoom={false}
        enableDamping
        dampingFactor={0.08}
        minPolarAngle={HERO_POLAR}
        maxPolarAngle={HERO_POLAR}
      />
    </>
  );
}
