import {
  getRegion,
  modelParts,
  type ModelPart,
  type AnatomyLayer,
} from "./modelCatalog";
export const sourceParts = modelParts.filter((m) => m.layer !== "attachment");
export const viewNames = {
  front: "Anterior",
  back: "Posterior",
  left: "Left lateral",
  right: "Right lateral",
  superior: "Superior",
  inferior: "Inferior",
};
export const viewTips = {
  front: "Look at the front of the body",
  back: "Look at the back of the body",
  left: "Look from the subject’s anatomical left",
  right: "Look from the subject’s anatomical right",
  superior: "Look down from above",
  inferior: "Look up from below",
};
export const regionNames = [
  "Knee",
  "Skull",
  "Face & neck",
  "Neck muscles",
  "Shoulder",
  "Spine",
  "Pelvis",
  "Abdomen",
  "Heart",
  "Lungs",
  "Lymph nodes",
] as const;
export type AtlasRegion = (typeof regionNames)[number];
export function regionParts(region: string, layers?: string[]) {
  const found = sourceParts.filter((m) => {
    const n = m.name.toLowerCase(),
      a = m.ancestry.join(" ").toLowerCase(),
      right = /^Right |right |\.r$/i.test(m.name + " " + m.sourceName);
    switch (region) {
      case "Skull":
        return (
          m.layer === "bones" &&
          /cranium|skull|mandible|teeth|tooth/.test(a + " " + n) &&
          !/vertebr/.test(n)
        );
      case "Face & neck":
        return getRegion(m) === "Head & neck";
      case "Neck muscles":
        return (
          m.layer === "muscles" &&
          /neck|cervical|scalene|sternocleidomastoid|hyoid|splenius capitis/.test(
            a + " " + n,
          ) &&
          !/artery|nerv/.test(n)
        );
      case "Spine":
        return (
          m.system === "skeletal" &&
          /vertebr|atlas|axis|sacrum|coccyx|longitudinal ligament|ligamentum flavum/.test(
            n,
          )
        );
      case "Knee":
        return (
          right &&
          (/knee|patell|menisc|cruciate|tibial collateral|fibular collateral|quadriceps.*tendon/.test(
            a + " " + n,
          ) ||
            ["Right femur", "Right tibia", "Right fibula"].includes(m.name) ||
            (!!m.parentId && ["FMA24474", "FMA24477"].includes(m.parentId)))
        );
      case "Shoulder":
        return (
          right &&
          /shoulder|glenohumeral|acromio|coracoclavicular|humerus|scapula|clavicle|rotator cuff/.test(
            a + " " + n,
          )
        );
      case "Pelvis":
        return /hip bone|sacrum|coccyx|sacro.?iliac|hip joint/.test(
          a + " " + n,
        );
      case "Abdomen":
        return (
          /abdomin|linea alba|rectus sheath/.test(n) &&
          ["muscles", "tendons", "fascia", "ligaments"].includes(m.layer || "")
        );
      case "Heart":
        return m.ancestry.includes("Heart");
      case "Lungs":
        return m.system === "respiratory" && /lung|bronch|trachea/.test(n);
      case "Lymph nodes":
        return m.system === "lymphatic";
      default:
        return getRegion(m) === region;
    }
  });
  const ids = new Set(found.map((m) => m.id));
  return sourceParts.filter(
    (m) =>
      (ids.has(m.id) || (!!m.parentId && ids.has(m.parentId))) &&
      (region !== "Skull" || m.layer === "bones") &&
      (!layers?.length || layers.includes(m.layer || "")),
  );
}
export function associatedTissue(m: ModelPart): string {
  const n = m.name.toLowerCase();
  if (/menisc|labrum|intervertebral disc|pubic symphysis/.test(n))
    return "fibrocartilage";
  if (/epiglott/.test(n) && m.layer === "cartilage") return "elastic-cartilage";
  if (m.layer === "cartilage") return "hyaline";
  if (
    /valve|ligament|tendon|aponeuros|fascia|linea alba/.test(n) ||
    ["tendons", "ligaments", "fascia"].includes(m.layer || "")
  )
    return "dense-regular";
  if (m.layer === "bones") return "compact-bone";
  if (m.layer === "muscles") return "skeletal-muscle";
  if (m.system === "nervous") return "neurons";
  if (m.system === "cardiovascular" && /atrium|ventricle/.test(n))
    return "cardiac-muscle";
  if (m.system === "respiratory")
    return /lung/.test(n) ? "simple-squamous" : "pseudostratified";
  if (m.system === "lymphatic") return "reticular";
  return "areolar";
}
export function kneeOffsets(parts: ModelPart[]) {
  return Object.fromEntries(
    parts.map((m) => [
      m.id,
      /patell/i.test(m.name)
        ? [0, 0.015, 0.1]
        : /menisc/i.test(m.name)
          ? [0, 0.055, 0]
          : m.layer === "cartilage"
            ? [0, 0.03, 0]
            : /cruciate|collateral/i.test(m.name)
              ? [m.name.includes("medial") ? 0.06 : -0.06, 0.025, 0]
              : [0, 0, 0],
    ]),
  );
}
export function groupNodes(m: ModelPart) {
  return /nodes|tonsils/i.test(m.name)
    ? "Regional group (multiple nodes may share this source object)"
    : "Individual source structure";
}
export const layersAvailable: AnatomyLayer[] = [
  "bones",
  "cartilage",
  "muscles",
  "tendons",
  "ligaments",
  "fascia",
  "capsules",
  "bursae",
  "organs",
  "skin",
];
