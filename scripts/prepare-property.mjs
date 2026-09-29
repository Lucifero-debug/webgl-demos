/**
 * Prepares the property demo's assets.
 *
 *   node scripts/prepare-property.mjs
 *
 * Site textures: assets-raw/site/*.jpg -> public/textures/site/*.webp
 *   Colour maps are compressed normally. Normal maps (any file ending
 *   -normal) are kept at high quality and never colour-managed: their
 *   pixels are directions, not colours, and compression artefacts show up
 *   as lumpy shading across a whole wall.
 *
 * Photos: assets-raw/photos/amara-*.jpg -> public/photos/amara-*.webp
 *   Larger than the travel demo's cards, because these are shown as a
 *   gallery rather than thumbnails.
 */

import sharp from "sharp";
import { mkdir, readdir, stat } from "node:fs/promises";
import { basename, extname } from "node:path";

const SITE_IN = "assets-raw/site";
const SITE_OUT = "public/textures/site";
const PHOTO_IN = "assets-raw/photos";
const PHOTO_OUT = "public/photos";

await mkdir(SITE_OUT, { recursive: true });
await mkdir(PHOTO_OUT, { recursive: true });

const report = async (path) => {
  const { size } = await stat(path);
  console.log(`  ${path}  ${(size / 1024).toFixed(0)} KB`);
};

const images = (files) =>
  files.filter((f) => [".jpg", ".jpeg", ".png", ".webp"].includes(extname(f).toLowerCase()));

/* Site textures: square, tiling, 1K is plenty at the distances used. */
let siteFiles = [];
try {
  siteFiles = images(await readdir(SITE_IN));
} catch {
  console.log(`No ${SITE_IN} folder, skipping textures.`);
}

for (const file of siteFiles) {
  const name = basename(file, extname(file));
  const isNormal = /normal/i.test(name);
  const isGround = /grass|lawn|ground/i.test(name);
  const isSurface = !isNormal;
  const out = `${SITE_OUT}/${name}.webp`;
  const image = sharp(`${SITE_IN}/${file}`).resize(1024, 1024, { fit: "cover" });
  /*
    Photographed surfaces carry their own colour: dry brown grass, warm
    brown concrete. Keep the grain, drop most of the colour, and let the
    material's tint decide the hue. One file can then be a summer lawn or
    parched ground, grey concrete or buff, without another download.
  */
  if (isGround) image.modulate({ saturation: 0.18, brightness: 1.18 });
  else if (isSurface) image.modulate({ saturation: 0.3, brightness: 1.1 });
  await image.webp(isNormal ? { quality: 95, effort: 6 } : { quality: 82 }).toFile(out);
  await report(out);
}

/* Gallery photos for the property demo. */
const photoFiles = images(await readdir(PHOTO_IN)).filter((f) => f.startsWith("amara-"));

if (photoFiles.length === 0) {
  console.log(`No amara-*.jpg in ${PHOTO_IN}, skipping photos.`);
}

for (const file of photoFiles) {
  const out = `${PHOTO_OUT}/${basename(file, extname(file))}.webp`;
  // 4:5, at twice the size it is displayed, for high-density screens.
  await sharp(`${PHOTO_IN}/${file}`)
    .rotate()
    .resize(900, 1125, { fit: "cover", position: sharp.strategy.attention })
    .webp({ quality: 80 })
    .toFile(out);
  await report(out);
}

console.log("done");
