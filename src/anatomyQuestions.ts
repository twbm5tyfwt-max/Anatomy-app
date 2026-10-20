import { landmarks, spineCode, spineRegion } from "./landmarkCatalog";
import {
  getModelStudy,
  getRegion,
  modelParts,
  type ModelPart,
} from "./modelCatalog";
import type { Question, QuizScope } from "./quiz";
import type { CameraView } from "./AnatomyScene";
export type AnatomyQuestionView = {
  ids: string[];
  frameIds?: string[];
  modelId: string;
  view: CameraView;
  landmarkIds?: string[];
  targetLandmarkId?: string;
  highlightIds?: string[];
  overlayIds?: string[];
  interaction: "identify" | "click";
  opacity?: Record<string, number>;
};
const sourceId = (name: string) =>
  modelParts.find((m) => m.sourceName === name && !m.parentId)?.id;
const parts = (ids: string[]) => {
  const set = new Set(ids);
  return modelParts
    .filter((m) => set.has(m.id) || (!!m.parentId && set.has(m.parentId)))
    .map((m) => m.id);
};
export function anatomyQuestions(
  scope: QuizScope,
  options: (answer: string, all: string[]) => string[],
): Question[] {
  const out: Question[] = [];
  const selected = scope.structure.startsWith("model:")
    ? scope.structure.slice(6)
    : "";
  const eligible = landmarks.filter(
    (l) => l.quiz && (!selected || l.modelId === selected),
  );
  const names = [
    ...new Set(landmarks.filter((l) => l.quiz).map((l) => l.name)),
  ];
  for (const l of eligible) {
    const shared = {
      anatomySourceId: l.modelId,
      topic: "skeletal",
      answer: l.name,
      aliases:
        l.name === "Transverse foramen" ? ["Foramen transversarium"] : [],
      explanation: `${l.name}: ${l.location} ${l.function} ${l.features}${l.contents ? " Contents: " + l.contents : ""}`,
      source: l.source,
      options: options(l.name, names),
    };
    out.push({
      ...shared,
      id: `3d-${l.id}-identify`,
      prompt: "Identify the anatomical landmark marked by the colored dot.",
      format: "image",
      anatomy: {
        ids: parts(l.contextIds),
        modelId: l.modelId,
        view: l.view,
        landmarkIds: [l.id],
        targetLandmarkId: l.id,
        interaction: "identify",
      },
    });
    out.push({
      ...shared,
      id: `3d-${l.id}-concept`,
      prompt: `Which landmark fits this description? ${l.location} ${l.function}`,
      format: "choice",
    });
  }
  // These source-authored representative views are reviewed as a group. Generic
  // landmark coordinates are never transplanted onto a different vertebra.
  for (const sourceName of ["Vertebra C4", "Vertebra T8", "Vertebra L3"]) {
    const id = sourceId(sourceName);
    if (!id || (selected && selected !== id)) continue;
    const m = modelParts.find((m) => m.id === id)!;
    const answer = spineRegion(m.name);
    out.push({
      id: `3d-${id}-region`,
      topic: "skeletal",
      prompt: "Which spinal region does this isolated vertebra belong to?",
      answer,
      aliases: [],
      explanation: `${spineCode(m.name)} is a ${answer.toLowerCase()} vertebra. Identify the body, neural opening, and regional processes before choosing.`,
      source:
        "Z-Anatomy source geometry; OpenStax Anatomy and Physiology 2e, chapter 7.",
      options: options(answer, ["Cervical", "Thoracic", "Lumbar", "Sacral"]),
      format: "image",
      anatomy: {
        ids: parts([id]),
        modelId: id,
        view: "superior",
        interaction: "identify",
      },
    });
  }
  const c4 = sourceId("Vertebra C4"),
    l3 = sourceId("Vertebra L3");
  for (const [id, targetName, candidates] of [
    [
      c4,
      "Transverse foramen",
      [
        "Transverse foramen",
        "Uncinate process of vertebra",
        "Anterior tubercle of transverse process",
      ],
    ],
    [
      l3,
      "Vertebral foramen",
      ["Vertebral foramen", "Transverse process", "Superior articular facet of vertebra"],
    ],
  ] as const) {
    if (!id || (selected && selected !== id)) continue;
    const target = landmarks.find(
      (l) => l.modelId === id && l.name === targetName,
    );
    if (!target) continue;
    const candidateIds = landmarks
      .filter(
        (l) =>
          l.modelId === id &&
          (candidates as readonly string[]).includes(l.name),
      )
      .map((l) => l.id);
    out.push({
      id: `3d-${target.id}-click`,
      topic: "skeletal",
      prompt: `Select the ${targetName.toLowerCase()} using an unlabeled marker.`,
      answer: targetName,
      aliases: [],
      explanation: `${target.location} ${target.contents || target.function}`,
      source: target.source,
      options: [],
      format: "click",
      anatomy: {
        ids: parts([id]),
        modelId: id,
        view: "superior",
        landmarkIds: candidateIds,
        targetLandmarkId: target.id,
        interaction: "click",
      },
    });
  }
  for (const sourceName of [
    "Anterior cruciate ligament.r",
    "Posterior cruciate ligament.r",
  ]) {
    const id = sourceId(sourceName);
    if (!id || (selected && selected !== id)) continue;
    const answer = sourceName.startsWith("Anterior")
      ? "Anterior cruciate ligament"
      : "Posterior cruciate ligament";
    const bones = [sourceId("Femur.r"), sourceId("Tibia.r")].filter(
      (x): x is string => !!x,
    );
    out.push({
      id: `3d-${id}-ligament`,
      topic: "skeletal",
      prompt:
        "Identify the highlighted ligament in this right-knee X-ray view.",
      answer,
      aliases: [sourceName.startsWith("Anterior") ? "ACL" : "PCL"],
      explanation: sourceName.startsWith("Anterior")
        ? "The ACL runs from the anterior intercondylar tibia toward the medial surface of the lateral femoral condyle and restrains anterior tibial translation."
        : "The PCL runs from posterior intercondylar tibia toward the lateral surface of the medial femoral condyle and restrains posterior tibial translation.",
      source:
        "Geometry: Z-Anatomy. Study notes: OpenStax Anatomy and Physiology 2e, chapter 9, knee joint.",
      options: options(answer, [
        "Anterior cruciate ligament",
        "Posterior cruciate ligament",
        "Patellar ligament",
        "Fibular collateral ligament",
      ]),
      format: "image",
      anatomy: {
        ids: parts([...bones, id]),
        frameIds: [id],
        modelId: id,
        view: "front",
        highlightIds: [id],
        interaction: "identify",
        opacity: { bones: 0.2, cartilage: 0.2 },
      },
    });
  }
  const biceps =
    sourceId("Long head of biceps brachii muscle.r") ||
    modelParts.find(
      (m) => m.name === "Long head of right biceps brachii" && !m.parentId,
    )?.id;
  const insertion = modelParts.find(
    (m) =>
      m.layer === "attachment" &&
      m.attachmentKind === "insertion" &&
      /Biceps brachii muscle\.er$/.test(m.sourceName || ""),
  );
  const radius = sourceId("Radius.r");
  if (biceps && insertion && radius && (!selected || selected === biceps))
    out.push({
      id: "3d-biceps-insertion",
      topic: "muscular",
      prompt:
        "Which muscle inserts at the illustrated region on this right radius?",
      answer: "Biceps brachii",
      aliases: ["Biceps"],
      explanation:
        "The biceps brachii tendon inserts on the radial tuberosity. This colored source-authored attachment illustration is not a separately modeled tendon.",
      source:
        "Attachment patch and geometry: Z-Anatomy. Study notes: OpenStax Anatomy and Physiology 2e, chapter 11.",
      options: options("Biceps brachii", [
        "Biceps brachii",
        "Brachialis",
        "Triceps brachii",
        "Deltoid",
      ]),
      format: "image",
      anatomy: {
        ids: parts([radius, insertion.id]),
        frameIds: [radius],
        modelId: radius,
        view: "left",
        overlayIds: [insertion.id],
        interaction: "identify",
      },
    });
  if (selected) {
    const m = modelParts.find((m) => m.id === selected);
    if (m) {
      const s = getModelStudy(m);
      if (
        s.detailLevel === "detailed" &&
        s.family.toLowerCase() !== m.name.toLowerCase() &&
        !/surface of/i.test(m.name)
      )
        out.push({
          id: `3d-${selected}-review`,
          anatomySourceId: selected,
          topic: m.system,
          prompt: `Identify the parent study structure: ${s.function} ${s.location}`,
          answer: s.family,
          aliases: s.aliases,
          explanation: `${s.family}. ${s.actions || s.features}`,
          source: s.source,
          options: options(s.family, [
            s.family,
            ...modelParts
              .filter((x) => x.system === m.system && !x.parentId)
              .slice(0, 35)
              .map(getModelStudy)
              .map((x) => x.family),
          ]),
          format: "choice",
        });
    }
  }
  return out.filter((q) => {
    const id = q.anatomySourceId || q.anatomy?.modelId;
    const m = modelParts.find((m) => m.id === id);
    if (
      scope.anatomyTopic === "spine" &&
      (!m || !/vertebra|^Atlas$|^Axis$|^Sacrum$|^Coccyx$/.test(m.name))
    )
      return false;
    if (
      scope.system &&
      q.topic !== scope.system &&
      !scope.includeSystems?.includes(q.topic)
    )
      return false;
    if (scope.region && (!m || getRegion(m) !== scope.region)) return false;
    return true;
  });
}
export function anatomyQuestionModels() {
  const ids = new Set(landmarks.filter((l) => l.quiz).map((l) => l.modelId));
  for (const n of [
    "Vertebra C4",
    "Vertebra T8",
    "Vertebra L3",
    "Anterior cruciate ligament.r",
    "Posterior cruciate ligament.r",
  ]) {
    const id = sourceId(n);
    if (id) ids.add(id);
  }
  const b = modelParts.find(
    (m) => m.name === "Long head of right biceps brachii" && !m.parentId,
  );
  if (b) ids.add(b.id);
  return modelParts.filter((m) => ids.has(m.id));
}
