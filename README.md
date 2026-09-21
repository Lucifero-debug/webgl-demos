# webgl-demos

3D product showcases in Next.js and React Three Fiber: a scroll story
that flies the camera to a product's details, ending on a colourway
picker. One reusable template; each product is a settings file plus a
model file.

    /        index of finished demos
    /shop    Alder Runner, the demo product

## Run it

    npm install
    npm run dev

Two development-only tools, switched on with the URL:

    /shop?shots    shot helper: frame camera shots by eye
    /shop?poster   poster button: save the opening frame as the poster

## How it is put together

    lib/showcase/types.ts          the settings format, documented field by field
    lib/showcase/alder-runner.ts   the demo product's settings
    lib/showcase/runtime.ts        shared state between page and scene
    components/showcase/Scene.tsx      the 3D scene: model, camera, lighting
    components/showcase/Showcase.tsx   the page: story, text, colourway picker
    components/showcase/ShotHelper.tsx the shot helper panel
    components/CanvasStage.tsx     poster-first canvas, shared by everything
    app/shop/page.tsx              three lines: settings in, page out

Nothing outside `lib/showcase/<product>.ts` and `app/<route>/page.tsx`
should need editing per client.

---

## Adding a client product

### 1. Get a model

In order of preference:

- **The client has one.** Ask first. GLB or glTF is ideal; FBX, OBJ and
  USDZ convert in Blender. CAD files (STEP) are accurate but have no
  colours or textures, so materials need setting up.
- **Generate it from photos** with Meshy, Tripo or Rodin. Use several
  angles on a plain background, not one photo. Use a paid plan: free-tier
  output is CC BY and needs a public credit. Expect to fix garbled logos
  and text, and shadows baked into the textures. Best for simple shapes:
  bottles, cosmetics, cans, speakers, boxes.
- **Hire a 3D modeller** for branded products where accuracy matters, and
  price it into the quote.

### 2. Check and compress it

Open it at https://gltf-viewer.donmccurdy.com and look at orientation,
scale and materials. Files lie: the demo shoe's fabric was marked as
metal. Parts that change colour need their own materials.

Then compress, aiming for 2 to 4 MB:

    npx @gltf-transform/cli webp raw.glb public/models/<product>.glb

If the textures are 4K, add a resize step first:

    npx @gltf-transform/cli resize raw.glb resized.glb --width 2048 --height 2048

Check the texture detail close up afterwards. If it has gone soft, keep
the larger size; the model loads after the poster, so a few extra MB
barely touch the speed score.

### 3. Create the settings file

Copy `lib/showcase/alder-runner.ts` to `lib/showcase/<product>.ts` and
change the obvious parts: brand, product text, credit (delete it if the
client owns the model), poster path, model URL.

Then add the route. Create `app/<route>/page.tsx`:

    import Showcase from "@/components/showcase/Showcase";
    import { myProduct } from "@/lib/showcase/my-product";

    export default function Page() {
      return <Showcase config={myProduct} />;
    }

Open `/<route>?shots` and use the "Model part names" list in the helper
for the next steps.

### 4. Orientation and surface

`model.rotation` turns the product about its vertical axis, in radians,
until the hero view faces the way you want. Try `0`, `Math.PI / 2`,
`Math.PI` and `-Math.PI / 2`, then fine-tune in steps of 0.1 to 0.3.

`model.length` sets the product's size. 1.35 suits most products with the
default hero shot.

`model.surface` corrects materials. Leave it out unless the product looks
wrong. Metal-looking fabric: `{ metalness: 0 }`. Cloth: add
`sheen: 0.6, sheenRoughness: 0.8`.

### 5. Colourways

Each colourway picks one method:

- `{ method: "variant", variant: "name" }` if the file has colourways
  built in (glTF material variants). Rare.
- `{ method: "tint", parts: { "PartName": "#1E4D7A" } }` to recolour
  named parts. Best on parts with no colour texture, or a greyscale one.
- `{ method: "textures", parts: { "PartName": "/textures/red.webp" } }`
  to swap a part's colour texture, one image per colourway.

Part names come from the helper's list. Swatch colours: sample them from
the real product or its textures, not by eye. Each colourway's `mood`
sets the page background and text; pick backdrops for contrast against
the product, not to match it.

### 6. Frame the shots

In `/<route>?shots`:

1. Click **Hero** and adjust the opening view. Copy, paste over
   `hero.landscape`.
2. For each chapter, click its button, then orbit, pan and zoom to the
   detail. Use **Shift sideways** to move it clear of the dashed text box
   on its side. Copy, paste over that chapter's `landscape` shot.
3. Switch the browser to a phone (F12, device toolbar), repeat, and paste
   over each `portrait` shot. Keep the product above the bottom text box.

Chapter count is flexible: add or remove entries in `chapters`.

### 7. Finish

1. `/<route>?poster`: reload, wait two seconds, click **Save poster**,
   move the file to `public/posters/`.
2. `npm run build && npm start`, then Lighthouse (mobile) in an incognito
   window.
3. Scroll the whole story on a laptop, a wide screen and a phone.

---

## Traps

**Material cloning.** Colourway methods clone materials per mesh so parts
stay independent. Don't share material instances between parts by hand.

**Tint multiplies.** A tint multiplies the part's colour texture. On a
strongly coloured texture it muddies rather than recolours; use the
texture method instead.

**glTF textures are not flipped.** Textures for the texture method are
loaded with `flipY = false`, glTF's convention. Export them from the same
UV layout as the model's own textures.

**Credits.** CC BY models need the credit line on the page and in any
video or image you publish. The `credit` field handles the page.
