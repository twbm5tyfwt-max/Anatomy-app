// Builds the female-specific layer for the full-body model.
// The HRA female reference and the Z-Anatomy atlas share one coordinate frame (centres of the
// 53 organs both contain agree to within about 5 cm after a single translation), so HRA's
// reproductive anatomy can be placed in the atlas body. Nothing is stretched or invented:
// geometry is HRA's, shifted by the median offset of the shared organs.
import { readFile, writeFile } from "node:fs/promises";
import { Document, NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { meshopt } from "@gltf-transform/functions";
import { MeshoptEncoder, MeshoptDecoder } from "meshoptimizer";

const root = new URL("../", import.meta.url).pathname;
const z = JSON.parse(await readFile(root + "src/model-manifest.json", "utf8")).models;
const hra = JSON.parse(await readFile(root + "src/generated/hra-manifest.json", "utf8")).models;

const C = (b) => [0, 1, 2].map((i) => (b[0][i] + b[1][i]) / 2);
const zByName = new Map(z.filter((m) => !m.parentId && m.layer !== "attachment").map((m) => [m.name.toLowerCase(), m]));
const med = (a) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];
const diffs = hra
  .filter((m) => !m.pregnancy && zByName.has(m.name.toLowerCase()))
  .map((m) => C(zByName.get(m.name.toLowerCase()).bounds).map((v, i) => v - C(m.bounds)[i]));
const offset = [0, 1, 2].map((i) => +med(diffs.map((d) => d[i])).toFixed(4));
console.log("shared organs:", diffs.length, "offset:", offset);

const femaleOnly = hra.filter(
  (m) => !m.pregnancy && m.system === "reproductive" && !zByName.has(m.name.toLowerCase()),
);
const wanted = new Map(femaleOnly.map((m) => [m.id, m]));
console.log("female-specific parts:", wanted.size);

await Promise.all([MeshoptEncoder.ready, MeshoptDecoder.ready]);
const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ "meshopt.encoder": MeshoptEncoder, "meshopt.decoder": MeshoptDecoder });
const src = await io.readBinary(await readFile(root + "public/models/hra-female.glb"));
const out = new Document();
const buffer = out.createBuffer();
const scene = out.createScene("female-extras");
const found = new Set();
function walk(node, parentName = "") {
  const own = node.getName().replace(/_\d+$/, "");
  const id = wanted.has(own) ? own : parentName.replace(/_\d+$/, "");
  const mesh = node.getMesh();
  if (mesh && wanted.has(id) && !found.has(id)) {
    found.add(id);
    const m = node.getWorldMatrix();
    const dst = out.createMesh(id);
    for (const prim of mesh.listPrimitives()) {
      const pos = prim.getAttribute("POSITION");
      const arr = new Float32Array(pos.getCount() * 3);
      const p = [];
      for (let i = 0; i < pos.getCount(); i++) {
        pos.getElement(i, p);
        for (let a = 0; a < 3; a++)
          arr[i * 3 + a] = m[a] * p[0] + m[a + 4] * p[1] + m[a + 8] * p[2] + m[a + 12] + offset[a];
      }
      const np = out.createPrimitive().setAttribute("POSITION", out.createAccessor().setType("VEC3").setArray(arr).setBuffer(buffer));
      const nor = prim.getAttribute("NORMAL");
      if (nor) np.setAttribute("NORMAL", out.createAccessor().setType("VEC3").setArray(Float32Array.from(nor.getArray())).setBuffer(buffer));
      const idx = prim.getIndices();
      if (idx) np.setIndices(out.createAccessor().setType("SCALAR").setArray(Uint32Array.from(idx.getArray())).setBuffer(buffer));
      const mat = prim.getMaterial();
      np.setMaterial(
        out.createMaterial(id).setBaseColorFactor(mat?.getBaseColorFactor() || [0.8, 0.5, 0.5, 1]).setMetallicFactor(0).setRoughnessFactor(0.7).setDoubleSided(true),
      );
      dst.addPrimitive(np);
    }
    scene.addChild(out.createNode(id).setMesh(dst));
  }
  node.listChildren().forEach((c) => walk(c, node.getName()));
}
src.getRoot().listScenes().forEach((s) => s.listChildren().forEach((c) => walk(c)));
console.log("copied:", found.size, "missing:", [...wanted.keys()].filter((i) => !found.has(i)).length);
await out.transform(meshopt({ encoder: MeshoptEncoder, level: "high" }));
await writeFile(root + "public/models/female-extras.glb", await io.writeBinary(out));

// Male-only parts of the atlas (and their sub-parts) are left out of the female model.
const maleTop = z.filter((m) => !m.parentId && m.system === "reproductive").map((m) => m.id);
const maleOnly = z.filter((m) => maleTop.includes(m.id) || maleTop.includes(m.parentId)).map((m) => m.id);
const models = [...found].map((id) => {
  const m = wanted.get(id);
  return {
    ...m,
    layer: m.layer === "skin" ? "organs" : m.layer,
    region: "Pelvis",
    bounds: m.bounds.map((b) => b.map((v, i) => +(v + offset[i]).toFixed(5))),
    source: "HRA",
  };
});
await writeFile(root + "src/generated/female-extras.json", JSON.stringify({ offset, maleOnly, models }, null, 1));
console.log("male-only removed:", maleOnly.length, "extras written:", models.length);
