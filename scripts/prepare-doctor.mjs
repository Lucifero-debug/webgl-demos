/**
 * Prepares the clinic's own photographs and logo.
 *
 *   node scripts/prepare-doctor.mjs
 *
 * Put the files Dr. Sachdeva sent into assets-raw/doctor/ with these
 * names, then run this:
 *
 *   logo.png       the gold tooth logo on black
 *   portrait.png   arms folded, loupes round the neck
 *   implant.png    holding the implant towards the camera
 *   pointing.png   pointing to one side
 *   welcome.png    both hands open towards the camera
 *   seated.png     arms folded, seated
 *   loupes.png     close-up, mask and loupes on
 *
 * Outputs WebP into public/doctor/. Transparency is preserved: these are
 * cut-outs meant to sit on the page's own background, and flattening them
 * onto white is what makes a cut-out look pasted on.
 */

import sharp from "sharp";
import { mkdir, readdir, stat } from "node:fs/promises";
import { basename, extname } from "node:path";

const SRC = "assets-raw/doctor";
const OUT = "public/doctor";

await mkdir(OUT, { recursive: true });

let files = [];
try {
  files = (await readdir(SRC)).filter((f) =>
    [".png", ".jpg", ".jpeg", ".webp"].includes(extname(f).toLowerCase()),
  );
} catch {
  console.log(`No ${SRC} folder. Create it and add the photographs.`);
  process.exit(0);
}

for (const file of files) {
  const name = basename(file, extname(file));
  const out = `${OUT}/${name}.webp`;
  const isLogo = name === "logo";

  await sharp(`${SRC}/${file}`)
    .rotate()
    // Logos stay small and crisp; photographs are shown at most half a
    // screen wide, so 1200px covers a high-density display.
    .resize({ width: isLogo ? 600 : 1200, withoutEnlargement: true })
    .webp({ quality: isLogo ? 92 : 82, alphaQuality: 100 })
    .toFile(out);

  const { size } = await stat(out);
  console.log(`  ${out}  ${Math.round(size / 1024)} KB`);
}

console.log("done");
