import { readFile, writeFile } from "node:fs/promises";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
const anchors = JSON.parse(
  await readFile("src/generated/landmark-anchors.json", "utf8"),
);
const models = JSON.parse(
  await readFile("src/model-manifest.json", "utf8"),
).models;
const bytes = await readFile("public/models/anatomy.glb");
const { scene } = await new GLTFLoader()
  .setMeshoptDecoder(MeshoptDecoder)
  .parseAsync(
    bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.length),
    "",
  );
scene.updateMatrixWorld(true);
const wanted = new Set(anchors.map((a) => a.modelId));
const meshes = new Map();
scene.traverse((obj) => {
  if (!obj.isMesh) return;
  const meshId = obj.name.replace(/_\d+$/, "");
  const model = models.find((m) => m.id === meshId);
  const id = model?.parentId || meshId;
  if (!wanted.has(id)) return;
  const pos = obj.geometry.attributes.position,
    idx = obj.geometry.index;
  const vertices = [];
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i).applyMatrix4(obj.matrixWorld);
    vertices.push(v.clone());
  }
  meshes.set(id, [...(meshes.get(id) || []), { vertices, index: idx?.array }]);
});
const triangle = new THREE.Triangle(),
  closest = new THREE.Vector3();
const results = [];
for (const anchor of anchors) {
  let minimum = Infinity;
  const p = new THREE.Vector3(...anchor.anchor);
  for (const mesh of meshes.get(anchor.modelId) || []) {
    const count = mesh.index?.length || mesh.vertices.length;
    for (let i = 0; i < count; i += 3) {
      triangle.set(
        mesh.vertices[mesh.index ? mesh.index[i] : i],
        mesh.vertices[mesh.index ? mesh.index[i + 1] : i + 1],
        mesh.vertices[mesh.index ? mesh.index[i + 2] : i + 2],
      );
      triangle.closestPointToPoint(p, closest);
      minimum = Math.min(minimum, p.distanceToSquared(closest));
    }
  }
  const distance = Math.sqrt(minimum);
  const related = models.filter(
    (m) => m.id === anchor.modelId || m.parentId === anchor.modelId,
  );
  const bounds = [0, 1].map((edge) =>
    [0, 1, 2].map((axis) =>
      edge
        ? Math.max(...related.map((m) => m.bounds[1][axis]))
        : Math.min(...related.map((m) => m.bounds[0][axis])),
    ),
  );
  const withinBounds = anchor.anchor.every(
    (v, axis) => v >= bounds[0][axis] - 0.005 && v <= bounds[1][axis] + 0.005,
  );
  results.push({
    id: anchor.id,
    modelId: anchor.modelId,
    distance: Number.isFinite(distance) ? distance : null,
    valid: withinBounds,
    surfaceNear: distance <= 0.003,
  });
}
await writeFile(
  "src/generated/anchor-validation.json",
  JSON.stringify(
    {
      boundsToleranceMeters: 0.005,
      surfaceNearThresholdMeters: 0.003,
      method:
        "Original source endpoint and assigned source mesh retained. Exclude endpoints outside the complete source-object bounds plus 5 mm. Nearest triangle distance is recorded separately; openings can be marked in their lumen. This checks position, not the anatomical correctness of a label.",
      results,
    },
    null,
    2,
  ),
);
console.log(
  "Validated",
  results.filter((r) => r.valid).length,
  "/",
  results.length,
  "endpoints inside assigned source-object bounds; excluded",
  results
    .filter((r) => !r.valid)
    .map((r) => anchors.find((a) => a.id === r.id).name),
);
