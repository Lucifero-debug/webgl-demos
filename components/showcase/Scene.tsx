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
import { applyLens, dwell } from "@/lib/stage/lens";
import { runtime } from "@/lib/showcase/runtime";
import type {
  Colorway,
  ShotPair,
  ShowcaseConfig,
  Surface,
  Vec3,
} from "@/lib/showcase/types";

/*
  The 3D half of a product showcase. Everything product-specific comes from
  the ShowcaseConfig; nothing in here should need editing per client.
*/

/** Where the shadow plane sits. The product's base rests just above it. */
const FOOT_Y = -0.28;
const TAU = Math.PI * 2;

/* Motion. Small numbers on purpose: alive, not busy. */
const HOVER = 0.035;
const BOB = 0.015;
const BOB_SPEED = 1.1;
const PARALLAX_TURN = 0.14;
const PARALLAX_TILT = 0.05;
const ENTER_DROP = 0.15;
const ENTER_TURN = -0.45;
const SPIN_DURATION = 0.95;

/* ------------------------------------------------------------------ */
/* Camera                                                              */
/* ------------------------------------------------------------------ */

type Resolved = {
  pos: THREE.Vector3;
  target: THREE.Vector3;
  fov: number;
  offset: THREE.Vector2;
};

const v3 = (a: Vec3) => new THREE.Vector3(a[0], a[1], a[2]);

/**
 * Picks the shot for this screen. Portrait screens use the portrait shot if
 * there is one; otherwise they stand further back from the landscape shot
 * and lift the product above the bottom-aligned text.
 */
function resolve(pair: ShotPair, aspect: number, hero: boolean): Resolved {
  const portrait = aspect < 1;
  const shot = portrait && pair.portrait ? pair.portrait : pair.landscape;
  const target = v3(shot.target);
  const pos = v3(shot.position);
  const offset = new THREE.Vector2(shot.offset?.[0] ?? 0, shot.offset?.[1] ?? 0);

  if (portrait && !pair.portrait) {
    const back = hero ? Math.min(2.2, 1.2 / aspect) : 1.5;
    pos.sub(target).multiplyScalar(back).add(target);
    offset.set(0, hero ? 0 : 0.2);
  }

  return { pos, target, fov: shot.fov, offset };
}


type Controls = {
  enabled: boolean;
  target: THREE.Vector3;
  update(): void;
} | null;

/**
 * Flies the camera through the shots as the page scrolls, then hands it to
 * OrbitControls at the bottom once it has settled on the final shot, so the
 * handover never jumps. Scrolling back up takes it back.
 *
 * With the shot helper active it does none of that: OrbitControls moves the
 * camera freely, and the helper's sliders set the lens.
 */
function CameraRig({ config }: { config: ShowcaseConfig }) {
  const camera = useThree((state) => state.camera) as THREE.PerspectiveCamera;
  const controls = useThree((state) => state.controls) as unknown as Controls;
  const aspect = useThree((state) => state.size.width / state.size.height);

  const shots = useMemo(() => {
    const hero = resolve(config.hero, aspect, true);
    return [
      hero,
      ...config.chapters.map((chapter) => resolve(chapter.shot, aspect, false)),
      resolve(config.hero, aspect, true),
    ];
  }, [config, aspect]);

  const look = useRef<THREE.Vector3 | null>(null);
  const lens = useRef({ fov: shots[0].fov, offset: shots[0].offset.clone() });
  const goal = useMemo(
    () => ({
      pos: new THREE.Vector3(),
      target: new THREE.Vector3(),
      offset: new THREE.Vector2(),
    }),
    [],
  );

  useFrame((state, delta) => {
    const { width, height } = state.size;
    const helper = runtime.helper;

    if (helper.active) {
      if (controls) {
        controls.enabled = true;
        if (helper.jump !== null) {
          const shot = helper.jump < 0 ? shots[0] : shots[helper.jump + 1];
          if (shot) {
            camera.position.copy(shot.pos);
            controls.target.copy(shot.target);
            helper.fov = shot.fov;
            helper.offset = [shot.offset.x, shot.offset.y];
            controls.update();
          }
          helper.jump = null;
        }
        helper.target = [controls.target.x, controls.target.y, controls.target.z];
      }
      helper.position = [camera.position.x, camera.position.y, camera.position.z];
      applyLens(camera, helper.fov, helper.offset[0], helper.offset[1], width, height);
      return;
    }

    if (!look.current) look.current = shots[0].target.clone();

    const last = shots[shots.length - 1];
    let orbiting = false;
    if (controls) {
      if (runtime.progress <= 0.985) {
        controls.enabled = false;
      } else if (
        !controls.enabled &&
        camera.position.distanceTo(last.pos) < 0.01 * last.pos.distanceTo(last.target) + 0.01
      ) {
        controls.target.copy(last.target);
        look.current.copy(last.target);
        controls.enabled = true;
      }
      orbiting = controls.enabled;
    }

    const span = shots.length - 1;
    const x = THREE.MathUtils.clamp(runtime.progress, 0, 1) * span;
    const i = Math.min(span - 1, Math.floor(x));
    const t = dwell(x - i);
    const a = shots[i];
    const b = shots[i + 1];

    goal.pos.lerpVectors(a.pos, b.pos, t);
    goal.target.lerpVectors(a.target, b.target, t);
    goal.offset.lerpVectors(a.offset, b.offset, t);
    const fov = a.fov + (b.fov - a.fov) * t;

    // Ease towards the goal every frame: smooth even if scrolling is not.
    const k = 1 - Math.exp(-delta * 5);
    lens.current.fov += (fov - lens.current.fov) * k;
    lens.current.offset.lerp(goal.offset, k);
    applyLens(
      camera,
      lens.current.fov,
      lens.current.offset.x,
      lens.current.offset.y,
      width,
      height,
    );

    if (orbiting) return;
    camera.position.lerp(goal.pos, k);
    look.current.lerp(goal.target, k);
    camera.lookAt(look.current);
  });

  return null;
}

/* ------------------------------------------------------------------ */
/* Materials                                                           */
/* ------------------------------------------------------------------ */

/** Each mesh's material as loaded, captured once. */
const originals = new WeakMap<THREE.Mesh, THREE.Material>();
/** Surface-corrected version of each source material, shared. */
const refined = new WeakMap<THREE.Material, THREE.Material>();
/** Per-mesh copies for tint and texture colourways, so parts stay independent. */
const owned = new WeakMap<THREE.Mesh, THREE.MeshStandardMaterial>();

/**
 * Trilinear filtering plus anisotropy. Model files often ask for cheaper
 * filtering, and three leaves anisotropy off, so textures smear wherever a
 * surface turns away from the camera.
 */
function sharpen(texture: THREE.Texture | null | undefined, anisotropy: number) {
  if (!texture || texture.userData.sharpened) return;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.anisotropy = anisotropy;
  texture.userData.sharpened = true;
  texture.needsUpdate = true;
}

/**
 * Applies the config's surface corrections to a material. Takes it after
 * assignFinalMaterial where that applies, which has already flipped the
 * normal map for glTF, so copying normalScale keeps the fix.
 */
function refine(source: THREE.Material, surface: Surface | undefined, anisotropy: number) {
  const cached = refined.get(source);
  if (cached) return cached;

  const base = source as THREE.MeshStandardMaterial;
  if (!base.isMeshStandardMaterial) {
    refined.set(source, source);
    return source;
  }

  for (const texture of [
    base.map,
    base.normalMap,
    base.roughnessMap,
    base.metalnessMap,
    base.aoMap,
    base.emissiveMap,
  ]) {
    sharpen(texture, anisotropy);
  }

  if (!surface) {
    refined.set(source, source);
    return source;
  }

  const params: THREE.MeshPhysicalMaterialParameters = {
    name: base.name,
    color: base.color.clone(),
    map: base.map,
    normalMap: base.normalMap,
    normalScale: base.normalScale.clone(),
    normalMapType: base.normalMapType,
    roughness: surface.roughness ?? base.roughness,
    roughnessMap: base.roughnessMap,
    // An explicit metalness replaces the file's metalness map outright.
    metalness: surface.metalness ?? base.metalness,
    metalnessMap: surface.metalness !== undefined ? null : base.metalnessMap,
    aoMap: base.aoMap,
    aoMapIntensity: base.aoMapIntensity,
    emissive: base.emissive.clone(),
    emissiveMap: base.emissiveMap,
    emissiveIntensity: base.emissiveIntensity,
    alphaMap: base.alphaMap,
    alphaTest: base.alphaTest,
    transparent: base.transparent,
    opacity: base.opacity,
    side: base.side,
  };

  if (surface.sheen) {
    params.sheen = surface.sheen;
    params.sheenRoughness = surface.sheenRoughness ?? 0.8;
    params.sheenColor = new THREE.Color(1, 1, 1);
    // Tinted by the surface's own colour, the way fibres catch light.
    params.sheenColorMap = base.map;
  }

  const material = new THREE.MeshPhysicalMaterial(params);
  refined.set(source, material);
  return material;
}

const textures = new Map<string, Promise<THREE.Texture>>();

/** Colourway textures, loaded once and set up for glTF's UV convention. */
function loadTexture(url: string, anisotropy: number) {
  let pending = textures.get(url);
  if (!pending) {
    pending = new THREE.TextureLoader().loadAsync(url).then((texture) => {
      texture.flipY = false;
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.anisotropy = anisotropy;
      return texture;
    });
    textures.set(url, pending);
  }
  return pending;
}

/* ------------------------------------------------------------------ */
/* The product                                                         */
/* ------------------------------------------------------------------ */

type VariantParser = {
  getDependency(type: "material", index: number): Promise<THREE.Material>;
  getDependencies(type: "material"): Promise<THREE.Material[]>;
  assignFinalMaterial(mesh: THREE.Mesh): void;
};

type MeshVariants = { mappings: { material: number; variants: number[] }[] };
type FileVariants = { variants: { name: string }[] };

function Product({
  config,
  colorway,
}: {
  config: ShowcaseConfig;
  colorway: Colorway;
}) {
  const { model, colorways } = config;
  const gltf = useGLTF(model.url, "/draco/");
  const parser = gltf.parser as unknown as VariantParser;
  const gl = useThree((state) => state.gl);
  const anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy());

  /** Outer: levitation, cursor tilt and entrance. */
  const motion = useRef<THREE.Group>(null);
  /** Inner: the colourway spin, about the product's own vertical axis. */
  const spin = useRef<THREE.Group>(null);

  const meshes = useMemo(() => {
    const list: { mesh: THREE.Mesh; names: string[] }[] = [];
    gltf.scene.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh) return;
      const material = (
        Array.isArray(mesh.material) ? mesh.material[0] : mesh.material
      ) as THREE.Material;
      if (!originals.has(mesh)) originals.set(mesh, material);
      const original = originals.get(mesh)!;
      list.push({ mesh, names: [original.name, mesh.name].filter(Boolean) });
    });
    return list;
  }, [gltf]);

  const variantNames = useMemo(() => {
    const ext = gltf.userData?.gltfExtensions?.KHR_materials_variants as
      | FileVariants
      | undefined;
    return (ext?.variants ?? []).map((v) => v.name.toLowerCase());
  }, [gltf]);

  /*
    One-off setup: shadows, every colourway's materials and textures loaded
    up front so the mid-spin swap is instant, and the model's part names
    published for the shot helper (and logged) for writing colourways.
  */
  useEffect(() => {
    for (const { mesh } of meshes) {
      mesh.castShadow = true;
      mesh.receiveShadow = true;
    }
    if (variantNames.length) parser.getDependencies("material");
    for (const way of colorways) {
      if (way.apply.method !== "textures") continue;
      for (const url of Object.values(way.apply.parts)) loadTexture(url, anisotropy);
    }

    const names = new Set<string>();
    for (const { names: own } of meshes) own.forEach((name) => names.add(name));
    runtime.helper.parts = [...names];
    if (process.env.NODE_ENV !== "production") {
      console.info("[showcase] model parts:", runtime.helper.parts);
    }
  }, [meshes, parser, variantNames, colorways, anisotropy]);

  /**
   * The colourway on the model right now. It lags the prop by half a spin,
   * so the new colourway goes on while the product turns fastest and the
   * switch itself is never seen.
   */
  const [shown, setShown] = useState(colorway.id);
  const previous = useRef(colorway.id);

  /* Spin on colourway change. */
  useEffect(() => {
    // Compared by value, so StrictMode's double mount never spins on load.
    if (previous.current === colorway.id) return;
    previous.current = colorway.id;

    const group = spin.current;
    if (!group) {
      setShown(colorway.id);
      return;
    }

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
          setShown(colorway.id);
        }
      },
      onComplete: () => {
        group.rotation.y = 0;
      },
    });

    return () => {
      tween.kill();
    };
  }, [colorway.id]);

  /* Put the shown colourway on the model. */
  useEffect(() => {
    const way = colorways.find((c) => c.id === shown) ?? colorways[0];
    const how = way.apply;
    const surface = model.surface;
    let cancelled = false;

    (async () => {
      for (const { mesh, names } of meshes) {
        const original = originals.get(mesh)!;

        if (how.method === "variant") {
          let source = original;
          const def = mesh.userData?.gltfExtensions?.KHR_materials_variants as
            | MeshVariants
            | undefined;
          const index = variantNames.indexOf(how.variant.toLowerCase());
          const mapping = def?.mappings.find((m) => m.variants.includes(index));
          if (mapping) {
            const material = await parser.getDependency("material", mapping.material);
            if (cancelled) return;
            mesh.material = material;
            parser.assignFinalMaterial(mesh);
            source = mesh.material as THREE.Material;
          } else if (index === -1 && process.env.NODE_ENV !== "production") {
            console.warn(`[showcase] no variant "${how.variant}". Found:`, variantNames);
          }
          mesh.material = refine(source, surface, anisotropy);
          continue;
        }

        const base = refine(original, surface, anisotropy) as THREE.MeshStandardMaterial;
        let mine = owned.get(mesh);
        if (!mine) {
          mine = base.clone();
          owned.set(mesh, mine);
        }
        const part = names.find((name) => name in how.parts);

        if (how.method === "tint") {
          mine.color.set(part ? how.parts[part] : base.color);
        } else {
          const map = part ? await loadTexture(how.parts[part], anisotropy) : base.map;
          if (cancelled) return;
          mine.map = map;
          mine.needsUpdate = true;
        }
        mesh.material = mine;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [shown, colorways, meshes, model.surface, parser, variantNames, anisotropy]);

  /* Entrance: runs once, as the poster fades out. */
  const entrance = useRef({ p: 0 });
  useEffect(() => {
    const tween = gsap.to(entrance.current, { p: 1, duration: 1.6, ease: "power3.out" });
    return () => {
      tween.kill();
    };
  }, []);

  /** Hero camera distance, so motion calms down in close-ups. */
  const heroDistance = useMemo(
    () => v3(config.hero.landscape.position).distanceTo(v3(config.hero.landscape.target)),
    [config],
  );

  const tilt = useRef({ x: 0, y: 0 });
  useFrame((state, delta) => {
    const group = motion.current;
    if (!group) return;

    // A bob that reads as gentle from across the room looks like wobble in
    // a macro shot, so everything scales down as the camera closes in.
    const calm = THREE.MathUtils.clamp(
      state.camera.position.length() / heroDistance,
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
    Resize scales the model so its longest side is 1 and the placement group
    scales that to model.length; Center with `top` sits its base on y = 0.
    Together they make the file's own units and origin irrelevant.
  */
  return (
    <group ref={motion}>
      <group position={[0, FOOT_Y, 0]} rotation={[0, model.rotation, 0]} scale={model.length}>
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
 * A product-photography rig built in code, in place of an HDRI: tall
 * softboxes for long, clean highlights, and a low bounce card to lift the
 * underside. Downloads nothing.
 */
function Studio() {
  return (
    <Environment resolution={256} background={false}>
      <Lightformer form="rect" intensity={3} position={[-2.2, 1, 2.4]} scale={[1.2, 4, 1]} onUpdate={aim} />
      <Lightformer form="rect" intensity={2.5} position={[2.6, 0.8, -1]} scale={[0.5, 4, 1]} onUpdate={aim} />
      <Lightformer form="rect" intensity={1.5} position={[0, 3.2, 0.4]} scale={[3, 2, 1]} onUpdate={aim} />
      <Lightformer form="rect" intensity={0.4} position={[1.8, 0, 3.5]} scale={[4, 3, 1]} onUpdate={aim} />
      <Lightformer form="rect" intensity={1.2} position={[0, -1.4, 2.6]} scale={[5, 1.5, 1]} onUpdate={aim} />
    </Environment>
  );
}

export default function Scene({
  config,
  colorway,
  helper,
}: {
  config: ShowcaseConfig;
  colorway: Colorway;
  helper: boolean;
}) {
  const gl = useThree((state) => state.gl);

  /** The hero's height angle: the finale's turntable is locked to it. */
  const heroPolar = useMemo(() => {
    const shot = config.hero.landscape;
    const d = v3(shot.position).sub(v3(shot.target));
    return Math.acos(d.y / d.length());
  }, [config]);

  /*
    OrbitControls claims every touch on the canvas, which would stop a phone
    scrolling the page. pan-y hands vertical swipes back to the browser, so
    swiping up and down scrolls and swiping sideways turns the product.
  */
  useEffect(() => {
    gl.domElement.style.touchAction = helper ? "none" : "pan-y";
  }, [gl, helper]);

  return (
    <>
      <CameraRig config={config} />

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

      <Product config={config} colorway={colorway} />
      <Studio />

      <ContactShadows position={[0, FOOT_Y - 0.001, 0]} opacity={0.55} scale={3.5} blur={2.4} far={1} />

      {/*
        In the story: a turntable in the finale only (CameraRig switches it
        on), height locked to the hero's, no wheel zoom because the wheel
        scrolls the page. In the shot helper: free orbit, pan and zoom.
      */}
      <OrbitControls
        makeDefault
        enablePan={helper}
        enableZoom={helper}
        enableDamping
        dampingFactor={0.08}
        minPolarAngle={helper ? 0 : heroPolar}
        maxPolarAngle={helper ? Math.PI : heroPolar}
      />
    </>
  );
}
