/**
 * Turns Solar System Scope's 8K Earth textures into web-ready ones for the
 * travel demo.
 *
 *   node scripts/prepare-earth.mjs
 *
 * Reads the originals from assets-raw/earth/ (git-ignored, never deployed):
 *
 *   8k_earth_daymap.jpg  8k_earth_nightmap.jpg  8k_earth_clouds.jpg
 *   8k_earth_specular_map.tif  8k_earth_normal_map.tif
 *
 * and writes to public/textures/earth/:
 *
 *   day.webp          colour, 4096 x 2048, for phones
 *   day-8k.webp       colour, 8192 x 4096, for larger screens, where the
 *                     route close-ups would look blurry at 4K
 *   night.webp        city lights, 4096 x 2048
 *   spec-clouds.webp  data, not colour: red = ocean mask (where the sun
 *                     glints), green = cloud cover. Packing them saves a
 *                     whole download.
 *   relief.webp       terrain normal map, 4096 x 2048: mountains catch the
 *                     light
 *
 * Textures: Solar System Scope, CC BY 4.0 (solarsystemscope.com/textures).
 * The page must show that credit.
 */

import sharp from "sharp";
import { mkdir, stat } from "node:fs/promises";

const SRC = "assets-raw/earth";
const OUT = "public/textures/earth";
const W = 4096;
const H = 2048;

await mkdir(OUT, { recursive: true });

async function colour(file, out, width = W, height = H, quality = 82) {
  await sharp(`${SRC}/${file}`, { limitInputPixels: false })
    .resize(width, height)
    .webp({ quality })
    .toFile(`${OUT}/${out}`);
}

/** One 8-bit channel, exactly W x H bytes, whatever the source's format. */
async function channel(file) {
  const { data, info } = await sharp(`${SRC}/${file}`, { limitInputPixels: false })
    .resize(W, H)
    .greyscale()
    .extractChannel(0)
    .raw({ depth: "uchar" })
    .toBuffer({ resolveWithObject: true });

  if (data.length !== W * H || info.channels !== 1) {
    throw new Error(
      `${file}: expected ${W * H} bytes in one channel, got ${data.length} in ${info.channels}`,
    );
  }
  return data;
}

console.log("day map, 4K...");
await colour("8k_earth_daymap.jpg", "day.webp");

console.log("day map, 8K...");
await colour("8k_earth_daymap.jpg", "day-8k.webp", 8192, 4096, 80);

console.log("night map...");
await colour("8k_earth_nightmap.jpg", "night.webp");

console.log("ocean mask and clouds...");
const ocean = await channel("8k_earth_specular_map.tif");
const clouds = await channel("8k_earth_clouds.jpg");
const packed = Buffer.alloc(W * H * 3);
for (let i = 0; i < W * H; i++) {
  packed[i * 3] = ocean[i];
  packed[i * 3 + 1] = clouds[i];
}
await sharp(packed, { raw: { width: W, height: H, channels: 3 } })
  .webp({ quality: 85 })
  .toFile(`${OUT}/spec-clouds.webp`);

console.log("terrain relief...");
// Normal maps are data: keep them out of any colour conversion, and keep
// quality high, since compression artefacts show up as lumpy shading.
await sharp(`${SRC}/8k_earth_normal_map.tif`, { limitInputPixels: false })
  .resize(W, H)
  .removeAlpha()
  .toColourspace("srgb")
  .webp({ quality: 90 })
  .toFile(`${OUT}/relief.webp`);

for (const name of ["day.webp", "day-8k.webp", "night.webp", "spec-clouds.webp", "relief.webp"]) {
  const { size } = await stat(`${OUT}/${name}`);
  console.log(`  ${name}  ${(size / 1024 / 1024).toFixed(2)} MB`);
}
console.log("done");
