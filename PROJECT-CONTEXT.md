# Project context

Everything an assistant (or a person) needs to work on this repo without
having seen it built. Read this first, then the file you intend to change.

**Last verified against the code: 16 October 2026** (HEAD `9584dcc`,
"Payroll MS"). Update this file in the same commit as any change to a
demo's structure, a client instruction, or a gotcha.

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
11. **Artwork saved on solid black is not "a logo with a black
    background".** Every pixel is already its own colour multiplied by
    how much of the glyph covers it, so the black *is* the alpha channel,
    not a background to key out. Take coverage from the brightest
    channel, then **un-premultiply** (`rgb / coverage`) or the edges come
    out muddy; a small floor (~0.07) clears the compression noise in the
    black. Doing that is what fixed the client logo, which had been
    hidden behind a black chip to stop its edges showing on the page's
    near-black ground -- which only made the box look deliberate. The
    same applies to any gold-on-black asset a client sends.

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

**15 Oct 2026:** at his request, the content of his clinic page
(`dentalimplantindia.co.in/dental-clinic/`) was brought onto this one:
both branches (Ashok Vihar, Moti Nagar) with maps, 24×7 hours, his current
number and WhatsApp (+91 92662 36271), 22+ years / 15,000+ implants /
1,00,000+ patients, a numbers band, services, technology, before-and-after
sliders, awards 2020–24, press, review ratings, "why us", and four YouTube
testimonials (load only when played). These are optional fields in
`lib/clinic/types.ts`, rendered by `ClinicDetails.tsx`, so `/clinic`
(Arden) is unchanged. His images are read from his own site (`SITE` in
`sachdeva.ts`); `node scripts/fetch-sachdeva.mjs` copies them into
`public/doctor/site/`, then point `SITE` at `/doctor/site`. Still needed
from him: degrees, implant system, and the real "completed" counts
(his site shows "0+").

**His images (15 Oct 2026):** he sent his logo and four pictures, now in
`public/doctor/`: `logo-dentistry.webp` (the header logo, superseded --
see **The logo** below; the original crop is `logo-full.webp`),
`why-top.webp` (his online presence infographic), `full-arch.webp`
(full-arch in 10 days poster), `composite.webp` (a teaching-video cover)
and `results.webp` (him beside a finished smile). They go in `features`
(picture-led sections, placed with `after`), except `results.webp`, which
sits beside the before-and-after heading. Brand is now "Dr. Rajat
Sachdeva's Dentistry", as on the logo. `full-arch.webp` is **no longer
shown** -- he asked for it off the page -- and the teleconsultation
poster took its place beside that copy; the file stays in `public/doctor/`
in case he wants it back.

**More 3D (15 Oct 2026):** a second WebGL scene, the full-arch story
(`ArchStory.tsx` page half, `ArchScene.tsx` scene, model in
`archModel.ts`): a sticky section several screens tall in which scrolling
builds a lower jaw, four implants (two tilted 30°, All-on-4), multi-unit
abutments and a fixed bridge, with four steps lighting up beside it.
Scroll goes through `lib/clinic/archRuntime.ts` (no three); the canvas
renders on demand and only while the section is on screen. The tooth
geometry builders moved from `ImplantScene.tsx` to `toothGeometry.ts` so
both scenes share them (`implantGeometry(rows, cols)` takes a detail
level). `archModel.ts` is plain three (no React), so it can be rendered
outside the app; its poster `public/posters/sachdeva-arch.webp` was
rendered that way, with a different environment light, so re-save it with
`?poster` for an exact match. Also: pictures, equipment cards, trophies
and the gallery photo tilt towards the mouse (`Tilt` in
`ClinicDetails.tsx`, CSS 3D only, mouse only, off with reduced motion).

**Prices (15 Oct 2026):** he told the user by phone to take his pricing
from `www.delhidental.com/charges` (another clinic's published list). The
pricing beat in the 3D story and the full `priceList` section (ten
foldable categories, `#prices`) carry every price on it, in rupees and
US dollars, including the ₹1,500 consultation (his own clinic page says
the consultation is free, so the page no longer says "free" anywhere;
confirm which with him). All-on-4 is the one addition, from his older
page. Get that instruction confirmed in writing before the page
goes live under his name.

**Getting in touch (15 Oct 2026):** he asked for "prominent
call-to-action buttons for WhatsApp Chat, Call for Consultation, and an
Enquiry Form", with the form going to WhatsApp rather than email,
"as people are generally more comfortable using WhatsApp for quick
communication". Built as:

- `lib/clinic/whatsapp.ts` -- `waLink`, `telLink`, `enquiryMessage`,
  `enquiryProblems`. Its header is blunt about the limit, and so is the
  form: **a page on Vercel cannot SEND a WhatsApp message.** That needs
  the WhatsApp Business API, a verified sender and approved templates.
  What it does instead is open WhatsApp with the message already written,
  for the patient to tap send. Better here, because the thread then opens
  from the patient's own number and the clinic can simply reply -- but if
  the patient closes WhatsApp without sending, nothing arrives and nobody
  knows. Revisit if he wants every enquiry logged.
- `ContactBar.tsx` -- a fixed bar: bottom of the screen on a phone,
  bottom-right pills on a desktop. Fixed rather than more buttons in the
  page because a patient convinced three minutes into the story is
  wherever the story put them, not beside a button.
- `EnquiryForm.tsx` -- the form itself, in **one** place, rendered both
  by the bar's dialog and by the `#enquiry` section in `ClinicDetails`.
  Two copies of a form drift, and then what reaches the clinic depends on
  which one the patient found. Square, hairline-bordered boxes matching
  the page; `marks.tsx` holds the two inline glyphs it shares with the bar.
- The `#enquiry` section: heading and his recognition poster on one side,
  the form on the other, the WhatsApp/Call buttons **under the form**.
  That last bit is load-bearing -- with the buttons, hours and website
  link stacked on the left as well, the poster had to shrink to about
  200px to keep the columns level, at which point its own type is
  unreadable.

**ASK HIM WHICH NUMBER.** His site lists 98188 94041, 88609 40947 and
92662 36271, and its own WhatsApp button goes to **98188 94041** -- not
the **92662 36271** that `ctaHref` here has always used. Everything on
this page is on 92662 36271 so nothing moved silently. A chat opened on
the wrong number is an enquiry nobody sees.

**The logo (15 Oct 2026):** his logo file is gold artwork on *solid*
black with no alpha, so on this page's near-black ground its edges drew a
visible rectangle; the header used to hide that behind a black chip,
which just made the box look deliberate. Keyed to transparency instead
(`logo-dentistry-cut.webp`) -- see gotcha 11. The lockup is 5.35:1 with
three lines of type, so on a phone it is dropped for the mark alone
(`logo-mark.webp`, a 256px square, via the new optional `logoMark`); at
`md` and up the full lockup returns at `h-14`/`lg:h-16`. The logo also
links to his site now, which is the one place on this page it was not
already linked (`BrandLink` in `Clinic.tsx` -- note it goes inert once
the story hands the screen over, or it would be an invisible but
clickable link in the tab order).

**Later pictures (15 Oct 2026):**

- `pointing-2.webp` -- the treatments photo. He sent a green-screen
  original; `scripts/` has no copy, the keying was done ad hoc with a
  RELATIVE greenness measure, `(g - max(r,b)) / g`, because the screen
  was lit brightly on one side and nearly black in a corner, so an
  absolute "how green is this" test keyed the lit area and left the dark
  corner opaque.
- `recognition.webp` -- his "Recognized among leading names" poster. New
  optional `recognition.poster { image, alt, caption }`. It lives under
  `recognition` because that is what it is about, but it is **drawn in
  the enquiry section**: among the award trophies it was the same claim
  told twice, and beside the form it answers "who am I writing to?" at
  the moment a patient decides whether to hand over their number. Note it
  names two outlets the `press` list does not (Delhi Times, Business
  World) and says "Forbes India" where the list says "Forbes".
- `teleconsultation.webp` -- his teleconsultation poster, now beside the
  full-arch copy. **The picture and the words are not about the same
  thing**: if that section is meant to become the teleconsultation one,
  its label, title and points need rewriting with it. CONFIRM its two
  fees: ₹1,500 matches the consultation fee the Visit section quotes, but
  **₹3,500 for the "comprehensive package" appears nowhere else.**

`features[].image` and `imageAlt` are **optional** as of this work: with
no image the section drops to a single column at a reading width rather
than leaving the text stretched beside an empty half.

- Every clinical claim and price in that file is marked `CONFIRM` and came
  from his website. **Nothing should go live in his name until he has
  approved it**: the prices change, and dental advertising rules in India
  are strict.
- The page is `noindex` because it carries his clinic's name and
  unconfirmed prices and must not compete with his real site in search.
- Buttons point at his WhatsApp number (+91 92662 36271, from his clinic page).

If this page ever moves to his own domain, remove the `robots` line in
`app/implants/page.tsx` and make sure the prices have been confirmed in
writing.

**Tried and reverted (15 Oct 2026) -- do not redo without asking.** After
the full-arch scene went in, a further pass put a 3D treatment on most of
the remaining sections (an ambient WebGL backdrop behind them, in
`Ambient.tsx` / `AmbientScene.tsx` / `ambientModel.ts`). The user asked for
it to be reverted, and the repo was put back to commit `3432720`; the
contact bar, enquiry form, logo and later pictures above were all built
after that. What this section describes is what is in the code now; the
ambient files were parked outside the repo and have since been deleted. If
more 3D is wanted again, start from the user's request, not from that
attempt.

---

## 9. What is unfinished

- `/property` has no poster (`public/posters/` has `alder-runner`,
  `meridian`, `arden`, `sachdeva` and `sachdeva-arch` only). Capture it with
  `?poster`. The existing `meridian`, `arden` and `sachdeva` posters predate
  later scene changes and should be re-saved before anyone judges the first
  paint; `sachdeva-arch` was rendered outside the app (see section 8).
- Mobile layouts have never been checked on a real device. Known risks: the
  property and clinic price beats may overflow a short screen, and the
  implant's dimension line is not hidden on portrait as the part labels are.
  On `/implants`, the header's logo swap below `md` (mark instead of the
  full lockup) is **reasoned, not seen** -- the Chrome extension's window
  resize does not change the viewport on this machine, so it was only
  verified at desktop width. Check it at 390px.
- `/implants`, waiting on Dr. Sachdeva: which WhatsApp number the buttons
  should use, the ₹3,500 teleconsultation package fee, whether the
  full-arch section should become a teleconsultation one now that its
  picture is his teleconsultation poster, and the Delhi Times / Business
  World / "Forbes India" wording in `press`.
- The enquiry form on `/implants` hands over to WhatsApp and cannot know
  whether the patient pressed send (see section 8); nothing records the
  attempt. A form that posts to a server would, if he ever wants that.
- `/property` is `ready: false` on the index page (`/shop`, `/travel` and
  `/clinic` are listed; `/implants` is deliberately not).
- The property demo has no normal maps (only colour); the roof pool and the
  neighbouring blocks are plain.
- Lighthouse was last run on `/shop` before the other demos existed.
