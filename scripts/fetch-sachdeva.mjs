/*
  Copies Dr. Sachdeva's images (before-and-after cases, trophies,
  equipment, clinic photos) from his website into public/doctor/site/, so
  the /implants page stops loading them from his domain.

    node scripts/fetch-sachdeva.mjs

  Reads the list from lib/clinic/sachdeva.ts (every img("...") call), so
  it never drifts from what the page uses. Afterwards, in that file, set
    const SITE = "/doctor/site";
  and check the page: a missing file shows as an empty box, not an error.
*/
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

const BASE = "https://dentalimplantindia.co.in/dental-clinic/Images";
const OUT = "public/doctor/site";

const source = await readFile("lib/clinic/sachdeva.ts", "utf8");
const paths = [...new Set([...source.matchAll(/img\("([^"]+)"\)/g)].map((m) => m[1]))];

let ok = 0;
for (const path of paths) {
  const url = `${BASE}/${path.split("/").map(encodeURIComponent).join("/")}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const file = join(OUT, ...path.split("/"));
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, Buffer.from(await res.arrayBuffer()));
    ok++;
    console.log(`  ✓ ${path}`);
  } catch (error) {
    console.warn(`  ✗ ${path}: ${error.message}`);
  }
}
console.log(`\n${ok} of ${paths.length} images saved to ${OUT}/`);
if (ok === paths.length) console.log('Now set SITE = "/doctor/site" in lib/clinic/sachdeva.ts.');
