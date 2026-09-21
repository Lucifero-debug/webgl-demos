/**
 * Prepares destination photos for the travel demo.
 *
 *   node scripts/prepare-photos.mjs
 *
 * Reads every image in assets-raw/photos/ (git-ignored, never deployed) and
 * writes a 3:4 portrait crop of each to public/photos/<same name>.webp.
 * The crop uses sharp's attention strategy, which keeps the most detailed,
 * colourful part of the frame rather than just the centre.
 *
 * Name the files to match the config: kyoto-1.jpg, kyoto-2.jpg, ...
 * santorini-1.jpg ... patagonia-3.jpg.
 */

import sharp from "sharp";
import { mkdir, readdir, stat } from "node:fs/promises";
import { extname, basename } from "node:path";

const SRC = "assets-raw/photos";
const OUT = "public/photos";

await mkdir(OUT, { recursive: true });

const files = (await readdir(SRC)).filter((f) =>
  [".jpg", ".jpeg", ".png", ".webp"].includes(extname(f).toLowerCase()),
);

if (files.length === 0) {
  console.log(`No images in ${SRC}. Add kyoto-1.jpg and so on, then run again.`);
  process.exit(0);
}

for (const file of files) {
  const out = `${OUT}/${basename(file, extname(file))}.webp`;
  // 2x the displayed size, so photos stay sharp on high-density screens.
  await sharp(`${SRC}/${file}`)
    .rotate()
    .resize(360, 480, { fit: "cover", position: sharp.strategy.attention })
    .webp({ quality: 80 })
    .toFile(out);
  const { size } = await stat(out);
  console.log(`  ${out}  ${Math.round(size / 1024)} KB`);
}
console.log("done");
