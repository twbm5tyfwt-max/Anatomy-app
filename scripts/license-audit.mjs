// Lists bundled assets whose license restricts commercial use, so a paid release can plan replacements.
// This is an inventory of what the repository itself documents, not legal advice.
import { readFileSync, readdirSync, existsSync } from "node:fs";
const manifest = JSON.parse(readFileSync("public/ASSET_MANIFEST.json", "utf8"));
const blockers = [];
const openstax = readdirSync("public/anatomy").filter((f) => /\.(jpe?g|png|svg|webp)$/i.test(f));
blockers.push({
  asset: `OpenStax Anatomy & Physiology 2e figures (${openstax.length} files in public/anatomy)`,
  license: "CC BY-NC-SA 4.0",
  why: "NonCommercial: cannot be sold or bundled in a paid app.",
  action: "Replace with original diagrams or CC0/CC BY/public-domain microscopy and plates.",
});
const zNote = readFileSync("public/models/LICENSE-z-anatomy.txt", "utf8");
for (const [name, lic] of [
  ["Anatomy of the Inner Ear (Univ. of Dundee)", "CC BY-NC-SA 4.0"],
  ["Kidney (Lissie Cowley)", "CC BY-NC 4.0"],
])
  if (zNote.includes(name.split(" (")[0]))
    blockers.push({
      asset: `${name}: inside public/models/anatomy.glb`,
      license: lic,
      why: "NonCommercial content inside the main atlas bundle.",
      action: "Remove those meshes from the model build or obtain permission.",
    });
const conditional = [
  ["Z-Anatomy / BodyParts3D geometry", "CC BY-SA 4.0 / 2.1 JP", "Commercial use allowed with attribution, but ShareAlike applies to adaptations of the model files. Have a lawyer confirm how this interacts with your app license."],
  ["Wikipedia-derived readings", "CC BY-SA 3.0/4.0", "Commercial use allowed with attribution and ShareAlike."],
  ["Human Reference Atlas (female organs), Uberon", "CC BY 4.0 / 3.0", "Commercial use allowed with attribution."],
  ["Tesseract.js OCR + English data", "Apache-2.0", "Commercial use allowed; keep notices."],
  ["PT/AT text (src/ptContent.ts)", "Original to this project", "Links to AAOS/NHS pages only; no copied text. Needs review by a licensed clinician before commercial release."],
];
console.log("== Blocks commercial use ==");
for (const b of blockers) console.log(`- ${b.asset}\n    ${b.license}. ${b.why}\n    Fix: ${b.action}`);
console.log("\n== Allowed with conditions ==");
for (const [a, l, n] of conditional) console.log(`- ${a} (${l}): ${n}`);
console.log(`\nManifest distribution statement: ${manifest.distribution}`);
process.exitCode = blockers.length ? 1 : 0;
