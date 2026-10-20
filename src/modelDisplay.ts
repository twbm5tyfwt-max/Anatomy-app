import * as THREE from "three";
import { getModelStudy, modelParts, type ModelPart } from "./modelCatalog";

// An introductory surface view, not a claim that every included structure is
// wholly superficial. Deep layers remain available in All layers and search.
const surfaceFamilies = new Set([
  "pectoralis major",
  "deltoid",
  "trapezius",
  "latissimus dorsi",
  "rectus abdominis",
  "external oblique",
  "serratus anterior",
  "sternocleidomastoid",
  "platysma",
  "biceps brachii",
  "triceps brachii",
  "brachialis",
  "brachioradialis",
  "anconeus",
  "pronator teres",
  "flexor carpi radialis",
  "flexor carpi ulnaris",
  "palmaris longus",
  "flexor digitorum superficialis",
  "extensor carpi radialis longus",
  "extensor carpi radialis brevis",
  "extensor carpi ulnaris",
  "extensor digitorum",
  "extensor digiti minimi",
  "abductor pollicis longus",
  "extensor pollicis brevis",
  "extensor pollicis longus",
  "extensor indicis",
  "gluteus maximus",
  "gluteus medius",
  "tensor fasciae latae",
  "sartorius",
  "rectus femoris",
  "vastus lateralis",
  "vastus medialis",
  "gracilis",
  "adductor longus",
  "adductor magnus",
  "biceps femoris",
  "semitendinosus",
  "semimembranosus",
  "tibialis anterior",
  "extensor digitorum longus",
  "extensor hallucis longus",
  "fibularis longus",
  "fibularis brevis",
  "fibularis tertius",
  "gastrocnemius",
  "soleus",
  "infraspinatus",
  "teres major",
  "teres minor",
  "abductor hallucis",
  "flexor digitorum brevis",
  "extensor digitorum brevis",
  "extensor hallucis brevis",
  "abductor pollicis brevis",
  "flexor pollicis brevis",
  "abductor digiti minimi of hand",
  "flexor digiti minimi brevis of hand",
  "abductor digiti minimi of foot",
  "calcaneal tendon",
  "iliotibial tract",
  "linea alba",
]);
export function muscleFamily(m: ModelPart) {
  return m.name
    .toLowerCase()
    .replace(/^.*?(?:head|part|belly) of /, "")
    .replace(/\b(right|left)\b/g, "")
    .replace(/\bmuscle\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
export function isSurfaceMuscle(m: ModelPart) {
  return m.system !== "muscular" || surfaceFamilies.has(muscleFamily(m));
}
export function muscleSide(m: ModelPart) {
  return m.name.match(/\b(right|left)\b/i)?.[0].toLowerCase() || "";
}
export function displayGroupKey(m: ModelPart) {
  return m.system === "muscular" ? `${muscleSide(m)}:${muscleFamily(m)}` : m.id;
}
const groups = new Map<string, ModelPart[]>();
for (const m of modelParts) {
  const key = displayGroupKey(m);
  groups.set(key, [...(groups.get(key) || []), m]);
}
export function displayGroup(m: ModelPart) {
  return groups.get(displayGroupKey(m))!;
}
export function displayName(m: ModelPart) {
  if (m.system !== "muscular") return m.name;
  const name = `${muscleSide(m)} ${muscleFamily(m)}`.trim();
  return name[0].toUpperCase() + name.slice(1);
}
export function componentName(m: ModelPart) {
  const name = m.name.match(/^(.*?) of (?:right|left) /i)?.[1];
  return name || m.name.replace(/^(Right|Left) /, "");
}
export function muscleColor(m: ModelPart, base: string, distinct: boolean) {
  const c = new THREE.Color(base);
  if (getModelStudy(m).kind === "Connective tissue")
    return new THREE.Color("#d7c7aa");
  if (!distinct) return c;
  const family = muscleFamily(m);
  let hash = 0;
  for (const char of family) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  const hsl = { h: 0, s: 0, l: 0 };
  c.getHSL(hsl);
  const variants = [
    [-0.025, 0.13],
    [0.045, -0.025],
    [-0.055, -0.1],
    [0.085, 0.065],
    [0, -0.04],
    [-0.08, 0.08],
  ];
  let [h, l] = variants[hash % variants.length];
  // Preserve the source's three pectoralis regions and make their borders legible.
  if (family === "pectoralis major") {
    [h, l] = /clavicular/i.test(m.name)
      ? [0.065, 0.16]
      : /sternocostal/i.test(m.name)
        ? [0.005, -0.005]
        : [-0.055, -0.13];
  } else if (displayGroup(m).length > 1) {
    const i = displayGroup(m).findIndex((part) => part.id === m.id);
    l += [0.045, -0.035, 0.0][i % 3];
  }
  return c.setHSL(
    (hsl.h + h + 1) % 1,
    Math.min(0.7, Math.max(0.28, hsl.s)),
    Math.min(0.75, Math.max(0.24, hsl.l + l)),
  );
}
