import * as THREE from "three";
import { modelParts, type ModelPart } from "./modelCatalog";
const byId = new Map(modelParts.map((m) => [m.id, m]));
export function parentModel(m: ModelPart) {
  return m.parentId ? byId.get(m.parentId) || m : m;
}
export function muscleFamily(m: ModelPart) {
  return parentModel(m)
    .name.toLowerCase()
    .replace(/^.*?(?:head|part|belly) of /, "")
    .replace(/\b(right|left|muscle)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
export function muscleSide(m: ModelPart) {
  return (
    parentModel(m)
      .name.match(/\b(right|left)\b/i)?.[0]
      .toLowerCase() || ""
  );
}
export function displayGroupKey(m: ModelPart) {
  m = parentModel(m);
  return m.layer === "muscles" ? `${muscleSide(m)}:${muscleFamily(m)}` : m.id;
}
const groups = new Map<string, ModelPart[]>();
for (const m of modelParts) {
  if (m.layer === "attachment") continue;
  const k = displayGroupKey(m);
  groups.set(k, [...(groups.get(k) || []), m]);
}
export function displayGroup(m: ModelPart) {
  return groups.get(displayGroupKey(m)) || [m];
}
export function displayName(m: ModelPart) {
  const p = parentModel(m);
  if (p.layer !== "muscles") return p.name;
  const n = `${muscleSide(p)} ${muscleFamily(p)}`.trim();
  return n[0].toUpperCase() + n.slice(1);
}
export function componentName(m: ModelPart) {
  return (
    m.name.match(/^(.*?) of (?:right|left) /i)?.[1] ||
    m.name.replace(/^(Right|Left) /, "")
  );
}
export function isSurfaceMuscle(m: ModelPart) {
  return m.layer !== "muscles" || m.ancestry.includes("Superficial muscles");
}
export function muscleColor(m: ModelPart, base: string, distinct: boolean) {
  const c = new THREE.Color(base);
  if (m.layer === "tendons") return new THREE.Color("#dfd2b8");
  if (!distinct) return c;
  let hash = 0;
  for (const x of muscleFamily(m)) hash = (hash * 31 + x.charCodeAt(0)) >>> 0;
  const hsl = { h: 0, s: 0, l: 0 };
  c.getHSL(hsl);
  let d = ((hash % 5) - 2) * 0.025;
  if (/clavicular/i.test(m.name)) d += 0.035;
  if (/abdominal part/i.test(m.name)) d -= 0.035;
  return c.setHSL(
    hsl.h,
    Math.max(0.25, hsl.s),
    Math.max(0.12, Math.min(0.6, hsl.l + d)),
  );
}
