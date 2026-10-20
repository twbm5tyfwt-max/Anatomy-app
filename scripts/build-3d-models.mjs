import { readFile, writeFile } from "node:fs/promises";
import { Document, NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { meshopt, prune } from "@gltf-transform/functions";
import {
  MeshoptEncoder,
  MeshoptDecoder,
  MeshoptSimplifier,
} from "meshoptimizer";
import { STLLoader } from "three/addons/loaders/STLLoader.js";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
const source = JSON.parse(
  await readFile("scripts/bodyparts-source.json", "utf8"),
);
await Promise.all([
  MeshoptEncoder.ready,
  MeshoptDecoder.ready,
  MeshoptSimplifier.ready,
]);
const doc = new Document();
const buffer = doc.createBuffer();
const scene = doc.createScene("BodyParts3D");
const palette = {
  skeletal: [0.91, 0.83, 0.68, 1],
  muscular: [0.72, 0.23, 0.24, 1],
  nervous: [0.91, 0.67, 0.26, 1],
  cardiovascular: [0.68, 0.15, 0.21, 1],
  digestive: [0.64, 0.4, 0.29, 1],
  respiratory: [0.75, 0.48, 0.57, 1],
  urinary: [0.61, 0.28, 0.26, 1],
  endocrine: [0.58, 0.35, 0.66, 1],
  lymphatic: [0.34, 0.63, 0.38, 1],
  reproductive: [0.69, 0.41, 0.51, 1],
  integumentary: [0.76, 0.61, 0.49, 1],
};
const materials = Object.fromEntries(
  Object.entries(palette).map(([s, color]) => [
    s,
    doc
      .createMaterial(s)
      .setBaseColorFactor(color)
      .setMetallicFactor(0)
      .setRoughnessFactor(0.57)
      .setDoubleSided(true),
  ]),
);
const loader = new STLLoader();
const manifest = [];
let total = 0;
for (let i = 0; i < source.models.length; i++) {
  const m = source.models[i];
  const raw = await readFile("/tmp/forma-stl/" + m.id + ".stl");
  let g = loader.parse(
    raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength),
  );
  g.deleteAttribute("normal");
  g = mergeVertices(g, 0.0001);
  let positions = g.getAttribute("position").array;
  const old = positions;
  positions = new Float32Array(old.length);
  for (let n = 0; n < old.length; n += 3) {
    positions[n] = old[n] / 1000;
    positions[n + 1] = old[n + 2] / 1000;
    positions[n + 2] = -old[n + 1] / 1000;
  }
  g.getAttribute("position").array = positions;
  g.computeBoundingBox();
  const box = g.boundingBox;
  let indices = new Uint32Array(g.index.array);
  const largeBone =
    m.system === "skeletal" &&
    /humerus|femur|scapula|clavicle|radius|ulna|tibia|temporal bone|frontal bone|mandible/.test(
      m.name.toLowerCase(),
    );
  const cap =
    m.id === "FMA7163"
      ? 18000
      : m.system === "nervous" && indices.length > 150000
        ? 10000
        : largeBone
          ? 9500
          : m.system === "muscular"
            ? 2500
            : 4000;
  if (indices.length > cap * 3) {
    [indices] = MeshoptSimplifier.simplify(
      indices,
      positions,
      3,
      cap * 3,
      largeBone ? 0.0015 : 0.004,
      ["LockBorder"],
    );
  }
  // Compact vertices after simplification, preserving the original anatomical coordinates.
  const remap = new Map();
  const compact = [];
  const finalIndices = [];
  for (const idx of indices) {
    let mapped = remap.get(idx);
    if (mapped === undefined) {
      mapped = remap.size;
      remap.set(idx, mapped);
      compact.push(
        positions[idx * 3],
        positions[idx * 3 + 1],
        positions[idx * 3 + 2],
      );
    }
    finalIndices.push(mapped);
  }
  const p = new Float32Array(compact);
  const norm = new Float32Array(p.length);
  for (let n = 0; n < finalIndices.length; n += 3) {
    const a = finalIndices[n] * 3,
      b = finalIndices[n + 1] * 3,
      c = finalIndices[n + 2] * 3;
    const ux = p[b] - p[a],
      uy = p[b + 1] - p[a + 1],
      uz = p[b + 2] - p[a + 2],
      vx = p[c] - p[a],
      vy = p[c + 1] - p[a + 1],
      vz = p[c + 2] - p[a + 2];
    const x = uy * vz - uz * vy,
      y = uz * vx - ux * vz,
      z = ux * vy - uy * vx;
    for (const v of [a, b, c]) {
      norm[v] += x;
      norm[v + 1] += y;
      norm[v + 2] += z;
    }
  }
  for (let n = 0; n < norm.length; n += 3) {
    const len = Math.hypot(norm[n], norm[n + 1], norm[n + 2]) || 1;
    norm[n] /= len;
    norm[n + 1] /= len;
    norm[n + 2] /= len;
  }
  const indexArray =
    p.length / 3 < 65536
      ? new Uint16Array(finalIndices)
      : new Uint32Array(finalIndices);
  const mesh = doc
    .createMesh(m.id)
    .addPrimitive(
      doc
        .createPrimitive()
        .setAttribute(
          "POSITION",
          doc.createAccessor().setType("VEC3").setArray(p).setBuffer(buffer),
        )
        .setAttribute(
          "NORMAL",
          doc.createAccessor().setType("VEC3").setArray(norm).setBuffer(buffer),
        )
        .setIndices(
          doc
            .createAccessor()
            .setType("SCALAR")
            .setArray(indexArray)
            .setBuffer(buffer),
        )
        .setMaterial(materials[m.system]),
    );
  scene.addChild(
    doc
      .createNode(m.id)
      .setMesh(mesh)
      .setExtras({ id: m.id, system: m.system, name: m.name }),
  );
  manifest.push({
    ...m,
    bounds: [box.min.toArray(), box.max.toArray()],
    triangles: finalIndices.length / 3,
  });
  total += finalIndices.length / 3;
  g.dispose();
  if ((i + 1) % 100 === 0)
    console.log(
      "Converted",
      i + 1,
      "/",
      source.models.length,
      "meshes;",
      total.toLocaleString(),
      "triangles",
    );
}
await doc.transform(
  prune(),
  meshopt({ encoder: MeshoptEncoder, level: "high" }),
);
const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({
    "meshopt.encoder": MeshoptEncoder,
    "meshopt.decoder": MeshoptDecoder,
  });
const binary = await io.writeBinary(doc);
await writeFile("public/models/bodyparts.glb", binary);
await writeFile(
  "src/model-manifest.json",
  JSON.stringify({ revision: source.revision, models: manifest }, null, 2),
);
console.log(
  "Saved",
  manifest.length,
  "models;",
  total,
  "triangles;",
  Math.round((binary.length / 1024 / 1024) * 10) / 10,
  "MB",
);
