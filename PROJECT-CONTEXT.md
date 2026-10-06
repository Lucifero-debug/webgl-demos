# Project context

Everything an assistant (or a person) needs to work on this repo without
having seen it built. Read this first, then the file you intend to change.

---

## 1. What this is

A portfolio of interactive 3D web demos, built to sell a service:
scroll-driven 3D websites for businesses. Four demos, each a fictional
brand, plus one real client page.

| Route | Demo | What it shows |
|---|---|---|
| `/` | Index | Lists the demos that are marked ready |
| `/shop` | Alder Runner | A shoe product page: scroll story, then a colourway picker and drag-to-rotate |
| `/travel` | Meridian | A photoreal globe: flies to three destinations, draws routes, explorable finale |
| `/clinic` | Arden Dental | A dental implant that separates into its parts as you scroll |
| `/property` | Amara Rise | An 18-storey tower that comes apart, plus a full property website below it |
| `/implants` | Dr. Sachdeva's | A real clinic's page, built from the Arden template. `noindex`. Not public work. |

Live at `https://webgl-demos-eight.vercel.app` (Vercel, deploys on push to
`main`).

### The point of the demos

Each one answers "what can 3D do that a photograph cannot" for a different
industry: change colour and spin (retail), travel across a map (tourism),
come apart to explain (medical), be looked at before it is built
(property). That framing matters when writing copy for them.

---

## 2. Stack

- **Next.js 15**, App Router, TypeScript strict
- **React 19.2** (pinned with `~`: React Three Fiber v9 is sensitive to React minor versions)
- **three 0.186**, **@react-three/fiber 9**, **@react-three/drei 10**
- **Tailwind CSS v4** (no `tailwind.config.js`; configuration lives in `app/globals.css`)
- **gsap** (colourway spin only), **lenis** (smooth scrolling)
- **sharp**, used by the asset scripts, run with `node`, not bundled

Commands:

```bash
npm run dev          # development
npx tsc --noEmit     # type check: run this before every commit
npm run build        # production build
npm start            # serve the production build locally
```

---

## 3. How a demo is put together

Every demo is the same three pieces. Copy this shape when adding one.

1. **A settings file** (`lib/<demo>/<brand>.ts`) holding all the content:
   copy, prices, coordinates, camera framing hints. Typed by
   `lib/<demo>/types.ts`. **No content is hard-coded in components.** A new
   client is a new settings file, not a new component.
2. **A page component** (`components/<demo>/<Name>.tsx`): the HTML half.
   Fixed text panels, labels, buttons. Must not import `three`.
3. **A scene component** (`components/<demo>/<Name>Scene.tsx`): the 3D half.
   Imported lazily, so Three.js never blocks the first paint.

The route (`app/<demo>/page.tsx`) loads the font, sets metadata, and renders
the page component with its settings.

### The Three.js boundary (important)

`components/CanvasStage.tsx` shows a poster image immediately and lazily
loads `components/StageCanvas.tsx`, which is the only file that creates the
`<Canvas>`. **Never import `three`, `@react-three/fiber` or `drei` into a
page component**: it pulls about a megabyte into the first download and
undoes the code splitting. Type-only imports are fine (they disappear at
compile time).

### Scroll stories

- `lib/stage/useScrollStory.ts` runs Lenis, writes scroll progress to
  `runtime.progress` (a plain mutable object, not React state, because the
  scene reads it 60 times a second), and returns `{ section, settled, atEnd }`.
- Pass `scoped = true` when the page has ordinary sections below the story
  (as `/property` does), so the story is measured against its own height.
- `lib/stage/timing.ts` has `dwell()`: the camera rests on each shot for the
  middle 70% of a section and travels during the rest. Scenes apply it to
  the fraction between two shots.
- Text panels are **fixed, not scrolled**: one panel per beat, swapped when
  the camera settles. Scrolling text drifts into the header and looks
  amateur. The rise-in animation comes from the `data-reveal` /
  `data-shown` CSS in `app/globals.css`.

### HTML pinned to 3D points

For labels that must follow something in the scene: the scene projects
points to screen coordinates every frame into `lib/stage/anchors.ts`, and
the page moves its elements with `usePinned()` from `lib/stage/pinned.ts`.
Used for the globe's photos and day labels, the implant's part labels and
dimension line, and the tower's band labels.

### Camera framing

`lib/stage/lens.ts`:

- `applyLens()` applies a **view offset**, which shifts the subject sideways
  without turning the camera. That is how the object sits opposite the text
  on landscape screens and above it on portrait ones.
- `effectiveFov()` widens the field of view on narrow screens, so framing
  holds from an ultrawide monitor to a phone. `REF_ASPECT` is 2.07.

### Recording mode

`lib/stage/director.ts`: open any demo with `?record` and press Space, and
the page performs a choreographed take (gliding between beats, pausing to
read, performing its own interactions) with the cursor and scrollbar
hidden. Used to record demo videos without jerky manual scrolling.

### Other URL flags

- `?poster` — a Save poster button appears; it captures the current frame as
  a WebP for `public/posters/`. **Every page needs one**, or visitors see a
  blank screen while the 3D loads.
- `?shots` — on `/shop` only: orbit freely and copy camera shot values to
  the clipboard, for framing new products.

---

## 4. Adding a new demo page

1. `lib/<demo>/types.ts` — the shape of the settings.
2. `lib/<demo>/<brand>.ts` — the content.
3. `components/<demo>/<Name>Scene.tsx` — the 3D. Build shots from the
   settings; read `runtime.progress`; apply `dwell()`; call `applyLens()`.
4. `components/<demo>/<Name>.tsx` — the page. `useScrollStory`, fixed
   panels, `lazy()` the scene, wrap in `CanvasStage`.
5. `app/<demo>/page.tsx` — font via `next/font`, metadata, render.
6. Add an entry to the array in `app/page.tsx` (`ready: false` until the
   poster exists and it has been checked on a phone).
7. Capture a poster with `?poster`.

---

## 5. Conventions

- **Comments explain why, not what.** Several comments in this repo record a
  bug that cost hours; keep them.
- **British spelling** in copy and comments ("colour", "recognise").
- Tailwind only; arbitrary values are fine (`text-[15px]`,
  `bg-[color:var(--ink)]`). Colour tokens are CSS variables set in a
  `theme` object at the top of each page component.
- **`landscape:` and `portrait:` variants, not `md:`**, for anything about
  the object-versus-text layout. Orientation is what matters here, not width.
- Fonts are loaded **per route** with `next/font`, exposed as `--font-serif`,
  so each demo downloads only its own.
- Scene files keep their geometry builders as plain functions returning
  `THREE.BufferGeometry` or groups, called inside `useMemo`.
- Fictional brands everywhere except `/implants`. Say so in the page's own
  small print; it protects against a buyer assuming they are client work.

---

## 6. Hard-won gotchas

Each of these cost real time. Do not undo them.

1. **`touch-action` on the canvas.** R3F sets `touch-action: none` on the
   canvas element, which stops a phone scrolling the page at all. Fixed in
   `StageCanvas.tsx` by setting `pan-y` on the canvas in `onCreated`
   (setting it via the `style` prop does **not** work: R3F sets it on the
   element itself). Vertical scroll works, horizontal drag still reaches
   the scene.
2. **Additive blending makes pixels opaque.** On a transparent canvas,
   three's `AdditiveBlending` also adds to alpha, so a glow blots out the
   page behind it (it looked like a dark ring around the globe). Use the
   custom blending in `GlobeScene.tsx` (`ADD_LIGHT`): colour added, alpha
   untouched.
3. **Materials need a lit environment.** Metal shows only reflections and
   white ceramic needs light from all around. A studio of black softboxes
   made titanium look like black steel and a zirconia crown look like
   putty. See the light-grey surround in `ImplantScene.tsx`.
4. **Photographed textures carry their own colour.** Poly Haven's grass is
   dry brown and its concrete is warm. `scripts/prepare-property.mjs`
   desaturates them so the material's tint decides the hue.
5. **A missing texture takes down the whole scene**, not just the detail:
   `useTexture` throws, the error boundary catches it, and the visitor sees
   only the poster. Never name a file in a settings object before it exists.
6. **React runs effects twice in development**, and can re-run them on a
   change. Guard work by comparing against what is actually applied (see the
   colourway spin in `showcase/Scene.tsx`), not against the last value asked
   for.
7. **A poster that 404s shows its alt text** over the scene. `CanvasStage`
   hides a broken poster both on error and after mount, because an image
   that fails before hydration never fires `onError`.
8. **Chrome freezes background tabs**: zero animation frames. Anything
   driven by `requestAnimationFrame` (the scroll story, gsap, the 3D) stops.
   When testing through automation, make sure the tab is actually visible,
   or you will diagnose bugs that do not exist.
9. **Texture resolution caps how far the camera can go.** An 8K Earth map is
   about 5 km per pixel; closer than roughly a 2,500 km view and it turns to
   mush. The travel demo's itinerary stops are placed at least ~170 km apart
   for the same reason.
10. **8K textures cost about 180 MB of GPU memory.** Phones get the 4K
    version (see the `highRes` check in `GlobeScene.tsx`).

---

## 7. Assets and licences

Everything here is cleared for commercial use. Keep the credits visible
where the licence requires it.

| Asset | Source | Licence | Credit required |
|---|---|---|---|
| `public/models/shoe.glb` | Shopify, Khronos glTF sample assets | CC BY 4.0 | Yes, shown in `/shop` header |
| `public/textures/earth/*` | Solar System Scope | CC BY 4.0 | Yes, shown in `/travel` header |
| `public/hdri/sky.hdr`, `public/textures/site/*` | Poly Haven | CC0 | No |
| `public/photos/*` | Unsplash | Unsplash licence | No |

Raw downloads live in `assets-raw/` (git-ignored). The scripts convert them:

```bash
node scripts/prepare-earth.mjs      # Earth maps -> 4K and 8K WebP, packed channels
node scripts/prepare-photos.mjs     # travel photos -> 3:4 WebP
node scripts/prepare-property.mjs   # site textures and property photos
```

`scripts/prepare-earth.mjs` packs the ocean mask and cloud cover into one
texture's red and green channels, which saves a whole download.

---

## 8. The client page (`/implants`)

Built for Dr. Rajat Sachdeva's implant clinic, Ashok Vihar
(`dentalimplantindia.co.in`). Settings in `lib/clinic/sachdeva.ts`.

- Every clinical claim and price in that file is marked `CONFIRM` and came
  from his website. **Nothing should go live in his name until he has
  approved it**: the prices change, and dental advertising rules in India
  are strict.
- The page is `noindex` because it carries his clinic's name and
  unconfirmed prices and must not compete with his real site in search.
- Buttons point at his WhatsApp number.

If this page ever moves to his own domain, remove the `robots` line in
`app/implants/page.tsx` and make sure the prices have been confirmed in
writing.

---

## 9. What is unfinished

- Posters missing for `/travel`, `/clinic`, `/implants`, `/property`.
  Capture with `?poster`.
- Mobile layouts have never been checked on a real device. Known risks: the
  property and clinic price beats may overflow a short screen, and the
  implant's dimension line is not hidden on portrait as the part labels are.
- `/clinic` and `/property` are `ready: false` on the index page.
- The property demo has no normal maps (only colour); the roof pool and the
  neighbouring blocks are plain.
- Lighthouse was last run on `/shop` before the other demos existed.
