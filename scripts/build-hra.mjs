import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { meshopt, prune } from "@gltf-transform/functions";
import { MeshoptEncoder, MeshoptDecoder } from "meshoptimizer";

// Original HuBMAP v1.5 release; no borrowed male geometry or inferred anatomy.
const revision = "b036a91aaf7234f462b1249d4a5f4fb0e982f412";
const file = process.argv[2] || "/tmp/forma-hra-female-v1.5/3d-vh-f-united.glb";
await Promise.all([MeshoptEncoder.ready, MeshoptDecoder.ready]);
const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({
    "meshopt.encoder": MeshoptEncoder,
    "meshopt.decoder": MeshoptDecoder,
  });
const original = await readFile(file);
const doc = await io.readBinary(original);
const parts = [];
function clean(s) {
  return s
    .replace(/^(VH_F_|Allen_|Yao_)/, "")
    .replace(/_L$/, " left")
    .replace(/_R$/, " right")
    .replace(/_/g, " ")
    .replace(/jejenum/g, "jejunum")
    .replace(/epiglotic/g, "epiglottic")
    .replace(/eigth/g, "eighth")
    .replace(/^./, (c) => c.toUpperCase());
}
function walk(node, parents = []) {
  const sourceName = node.getName(),
    ancestry = [...parents, sourceName];
  const mesh = node.getMesh();
  if (mesh) {
    const id =
      "HRA" +
      createHash("sha1").update(ancestry.join("/")).digest("hex").slice(0, 12);
    const matrix = node.getWorldMatrix();
    const bounds = [
      [Infinity, Infinity, Infinity],
      [-Infinity, -Infinity, -Infinity],
    ];
    let triangles = 0;
    for (const primitive of mesh.listPrimitives()) {
      const pos = primitive.getAttribute("POSITION");
      triangles += (primitive.getIndices()?.getCount() || pos.getCount()) / 3;
      const point = [];
      for (let i = 0; i < pos.getCount(); i++) {
        pos.getElement(i, point);
        for (let a = 0; a < 3; a++) {
          const value =
            matrix[a] * point[0] +
            matrix[a + 4] * point[1] +
            matrix[a + 8] * point[2] +
            matrix[a + 12];
          bounds[0][a] = Math.min(bounds[0][a], value);
          bounds[1][a] = Math.max(bounds[1][a], value);
        }
      }
      // Source skin is translucent blue. Use the app's illustrative tissue colors.
      primitive
        .getMaterial()
        ?.setAlphaMode("OPAQUE")
        .setBaseColorFactor([0.7, 0.5, 0.4, 1])
        .setMetallicFactor(0)
        .setRoughnessFactor(0.75);
    }
    const group = ancestry.find((s) => /_system$/.test(s)) || "";
    const system = group
      .replace(/^VH_F_/, "")
      .replace(/_system$/, "")
      .replace("circulatory", "cardiovascular");
    const pregnancy = ancestry.some((s) => /placenta|umbilical/.test(s));
    const layer = /VH_F_skin$/.test(sourceName)
      ? "skin"
      : /ligament/.test(sourceName)
        ? "ligaments"
        : /tendon/.test(sourceName)
          ? "tendons"
          : /cartilage|menisc/.test(sourceName)
            ? "cartilage"
            : system === "skeletal" && !/fat|membrane|capsule/.test(sourceName)
              ? "bones"
              : system === "muscular"
                ? "muscles"
                : "organs";
    parts.push({
      id,
      name: clean(sourceName),
      sourceName,
      ancestry: ancestry.map(clean),
      system,
      layer,
      pregnancy,
      bounds,
      triangles,
      sha1: "",
      source: "Human Reference Atlas / HuBMAP",
    });
    node.setName(id);
    mesh.setName(id);
  }
  for (const child of node.listChildren()) walk(child, ancestry);
}
for (const scene of doc.getRoot().listScenes())
  for (const node of scene.listChildren()) walk(node);
await doc.transform(
  prune(),
  meshopt({ encoder: MeshoptEncoder, level: "high" }),
);
const binary = await io.writeBinary(doc);
const sha256 = createHash("sha256").update(binary).digest("hex");
await writeFile("public/models/hra-female.glb", binary);
await writeFile(
  "src/generated/hra-manifest.json",
  JSON.stringify(
    {
      revision,
      version: "1.5",
      source: "https://github.com/hubmapconsortium/ccf-releases",
      license: "CC BY 4.0",
      originalSha256: createHash("sha256").update(original).digest("hex"),
      sha256,
      models: parts,
    },
    null,
    2,
  ),
);
console.log(
  "HRA:",
  parts.length,
  "parts;",
  parts.reduce((n, p) => n + p.triangles, 0),
  "triangles;",
  binary.length,
  "bytes;",
  sha256,
);
