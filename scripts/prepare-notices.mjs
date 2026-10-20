import {
  readFile,
  writeFile,
  readdir,
  mkdir,
  copyFile,
} from "node:fs/promises";
import { join } from "node:path";
let notices =
  "Third-party software and font licenses. These do not replace the separate anatomy/media licenses.\n";
async function collect(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name === ".bin") continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory() && entry.name !== "node_modules")
      await collect(path);
    else if (
      entry.isFile() &&
      /^(licen[cs]e|copying|ofl|notice)(\.(txt|md))?$/i.test(entry.name)
    )
      notices += "\n\n=== " + path + " ===\n" + (await readFile(path, "utf8"));
  }
}
await collect("node_modules");
notices +=
  "\n\n=== English OCR data ===\n" +
  (await readFile("public/models/LICENSE-ocr-data.txt", "utf8"));
await mkdir("public/legal", { recursive: true });
await writeFile("public/legal/THIRD_PARTY_LICENSES.txt", notices);
for (const file of [
  "LICENSES.md",
  "ASSET_CREDITS.md",
  "IMPLEMENTATION_CHECKLIST.md",
  "STUDY_DATA_COVERAGE.md",
])
  await copyFile(file, join("public/legal", file));
console.log(
  "Prepared website/app attribution and license notices in public/legal.",
);
