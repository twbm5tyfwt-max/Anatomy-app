import { build } from "vite";
import react from "@vitejs/plugin-react";
import { readFile, writeFile, readdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import JSZip from "jszip";

// Bundle a browser-openable copy without changing the normal application build.
const root = fileURLToPath(new URL("../", import.meta.url));
const output = await mkdtemp(join(tmpdir(), "forma-preview-"));
const plates = Object.fromEntries(
  await Promise.all(
    (await readdir(join(root, "public/anatomy")))
      .filter((name) => name.endsWith(".jpg"))
      .map(async (name) => [
        name,
        "data:image/jpeg;base64," +
          (await readFile(join(root, "public/anatomy", name))).toString(
            "base64",
          ),
      ]),
  ),
);

const hraModelData =
  "data:model/gltf-binary;base64," +
  (await readFile(join(root, "public/models/hra-female.glb"))).toString(
    "base64",
  );
const extrasData =
  "data:model/gltf-binary;base64," +
  (await readFile(join(root, "public/models/female-extras.glb"))).toString(
    "base64",
  );
const modelData =
  "data:model/gltf-binary;base64," +
  (await readFile(join(root, "public/models/anatomy.glb"))).toString("base64");
try {
  await build({
    root,
    configFile: false,
    base: "./",
    publicDir: false,
    plugins: [
      {
        name: "forma-embedded-anatomy",
        enforce: "pre",
        transform(source, id) {
          if (!id.includes("/src/")) return;
          if (id.endsWith("/assetPaths.ts")) {
            source = source
              .replaceAll("/models/anatomy.glb", modelData)
              .replaceAll("/models/hra-female.glb", hraModelData)
              .replaceAll("/models/female-extras.glb", extrasData);
            for (const [name, data] of Object.entries(plates))
              source = source.replaceAll("/anatomy/" + name, data);
          }
          return source;
        },
      },
      react(),
    ],
    build: {
      outDir: output,
      emptyOutDir: true,
      assetsInlineLimit: Infinity,
      cssCodeSplit: false,
      reportCompressedSize: false,
      chunkSizeWarningLimit: 20000,
      rollupOptions: { output: { inlineDynamicImports: true } },
    },
  });
  let html = await readFile(join(output, "index.html"), "utf8");
  const scripts = [
    ...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"[^>]*><\/script>/g),
  ];
  for (const match of scripts) {
    const code = await readFile(resolve(output, match[1]), "utf8");
    html = html.replace(
      match[0],
      () =>
        '<script type="module">' +
        code.replace(/<\/script/gi, "<\\/script") +
        "</script>",
    );
  }
  const styles = [
    ...html.matchAll(
      /<link\b[^>]*\brel="stylesheet"[^>]*\bhref="([^"]+)"[^>]*>/g,
    ),
  ];
  for (const match of styles) {
    const css = await readFile(resolve(output, match[1]), "utf8");
    html = html.replace(match[0], () => "<style>" + css + "</style>");
  }
  html = html.replace(/<link\b[^>]*rel="modulepreload"[^>]*>/g, "");
  const target = join(root, "forma-preview.html");
  await writeFile(target, html);
  console.log(
    "Created " +
      target +
      " (" +
      (Buffer.byteLength(html) / 1024 / 1024).toFixed(1) +
      " MB).",
  );
  const archive = new JSZip();
  archive.file("forma-preview.html", html);
  archive.file(
    "OPEN-ME.txt",
    "Extract this archive, then open forma-preview.html in your browser. No development server or Node installation is needed. The app includes its images, fonts, quiz engine, and document parsers. Study data stays in the browser. This is a combined anatomy and PT/AT educational study app with 3D/2D references, tissue study, custom collections, quizzes and games. It is not a personalized treatment service. Some advanced anatomy assets remain unavailable; see IMPLEMENTATION_CHECKLIST.md. 3D requires WebGL; if it is unavailable, choose the 2D reference tab. OpenStax educational assets and adapted content are CC BY-NC-SA 4.0; see the included credits and license.\n",
  );
  archive.file(
    "ASSET_CREDITS.md",
    await readFile(join(root, "ASSET_CREDITS.md")),
  );
  archive.file(
    "LICENSE-openstax.txt",
    await readFile(join(root, "public/anatomy/LICENSE-openstax.txt")),
  );
  archive.file(
    "LICENSE-bodyparts.txt",
    await readFile(join(root, "public/models/LICENSE-bodyparts.txt")),
  );
  archive.file(
    "LICENSE-z-anatomy.txt",
    await readFile(join(root, "public/models/LICENSE-z-anatomy.txt")),
  );
  for (const name of [
    "LICENSE-hra.txt",
    "LICENSE-uberon.txt",
    "LICENSE-wikipedia.txt",
    "LICENSE-cc-by-sa-4.txt",
    "LICENSE-ocr-data.txt",
  ])
    archive.file(name, await readFile(join(root, "public/models", name)));
  archive.file(
    "STUDY_DATA_COVERAGE.md",
    await readFile(join(root, "STUDY_DATA_COVERAGE.md")),
  );
  archive.file(
    "IMPLEMENTATION_CHECKLIST.md",
    await readFile(join(root, "IMPLEMENTATION_CHECKLIST.md")),
  );
  archive.file("README.md", await readFile(join(root, "delivery/README.md")));
  archive.file(
    "VALIDATION.md",
    await readFile(join(root, "delivery/VALIDATION.md")),
  );
  archive.file("LICENSES.md", await readFile(join(root, "LICENSES.md")));
  archive.file(
    "ASSET_MANIFEST.json",
    await readFile(join(root, "public/ASSET_MANIFEST.json")),
  );
  let notices = "";
  async function collectLicenses(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      if (entry.name === ".bin") continue;
      const path = join(directory, entry.name);
      if (entry.isDirectory() && entry.name !== "node_modules")
        await collectLicenses(path);
      else if (
        entry.isFile() &&
        /^(licen[cs]e|copying|ofl|notice)(\.(txt|md))?$/i.test(entry.name)
      ) {
        notices +=
          "\n\n=== " +
          path.slice(root.length) +
          " ===\n" +
          (await readFile(path, "utf8"));
      }
    }
  }
  await collectLicenses(join(root, "node_modules"));
  notices +=
    "\n\n=== English OCR data ===\n" +
    (await readFile(join(root, "public/models/LICENSE-ocr-data.txt"), "utf8"));
  archive.file("THIRD_PARTY_LICENSES.txt", notices);
  const zipped = await archive.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });
  await writeFile(join(root, "forma-preview.zip"), zipped);
  console.log(
    "Created forma-preview.zip (" +
      (zipped.length / 1024 / 1024).toFixed(1) +
      " MB).",
  );
} finally {
  await rm(output, { recursive: true, force: true });
}
