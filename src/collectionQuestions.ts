import { modelParts, getModelStudy } from "./modelCatalog";
import type { Question, QuizScope } from "./quiz";
import type { AnatomyQuestionView } from "./anatomyQuestions";

export const centerOf = (m: { bounds: number[][] }) =>
  [0, 1, 2].map((i) => (m.bounds[0][i] + m.bounds[1][i]) / 2);

/** Keep the picture readable: bones are shown among bones, muscles among muscles and bone. */
const contextLayers = (layer?: string) =>
  layer === "muscles" || layer === "tendons"
    ? ["muscles", "bones"]
    : layer === "ligaments"
      ? ["ligaments", "bones"]
      : ["bones", "cartilage"];

const diag = (m: { bounds: number[][] }) =>
  Math.hypot(...[0, 1, 2].map((i) => m.bounds[1][i] - m.bounds[0][i]));

/** Frame the target tightly, adding only neighbours of a similar size so small parts aren't lost. */
export function frameIdsFor(
  target: (typeof modelParts)[number],
  context: (typeof modelParts)[number][],
) {
  return [
    target.id,
    ...context.filter((x) => diag(x) <= diag(target) * 3).slice(0, 3).map((x) => x.id),
  ];
}

/** Neighbouring structures that give a highlighted part its surroundings. */
export function surroundings(target: (typeof modelParts)[number], wanted: number) {
    const left = /left/i.test(target.name);
  const right = /right/i.test(target.name);
  return modelParts
    .filter(
      (x) =>
        !x.parentId &&
        x.id !== target.id &&
        contextLayers(target.layer).includes(x.layer || "") &&
        // keep the picture on the target's side of the body
        (!(left || right) || !(left ? /right/i : /left/i).test(x.name)),
    )
    // gap between bounding boxes: adjacent bones win over tiny bones near the shaft's centre
    .map((x) => ({
      x,
      d:
        Math.hypot(
          ...[0, 1, 2].map((i) =>
            Math.max(
              0,
              x.bounds[0][i] - target.bounds[1][i],
              target.bounds[0][i] - x.bounds[1][i],
            ),
          ),
        ) -
        // larger neighbours read better as context
        Math.min(0.02, Math.hypot(...[0, 1, 2].map((i) => x.bounds[1][i] - x.bounds[0][i])) * 0.05),
    }))
    .sort((a, b) => a.d - b.d)
    .slice(0, wanted)
    .map((r) => r.x);
}
export function collectionQuestions(scope: QuizScope): Question[] {
  const ids = new Set(scope.modelIds || []);
  const parts = modelParts.filter(
    (m) => ids.has(m.id) && !m.parentId && m.layer !== "attachment",
  );
  const names = parts.map((m) => m.name);
  const out: Question[] = [];
  for (const m of parts) {
    const study = getModelStudy(m);
    const child = modelParts
      .filter((x) => x.parentId === m.id)
      .map((x) => x.id);
    const answers = [
      m.name,
      ...names.filter((n) => n !== m.name).slice(0, 3),
    ].sort();
    out.push({
      id: `collection-${m.id}-name`,
      topic: m.system,
      prompt: "Name this isolated source structure.",
      answer: m.name,
      aliases: [],
      explanation: `${m.name}. ${study.function}`,
      source: study.source,
      format: parts.length > 1 ? "image" : "typed",
      options: answers,
      anatomySourceId: m.id,
      anatomy: {
        ids: [m.id, ...child],
        modelId: m.id,
        view: "front",
        interaction: "identify",
      },
    });
    // Point-to-part: the structure is coloured among its neighbours; choose its name.
    const context = surroundings(m, 7);
    // Answer options come only from the confirmed collection; neighbours are picture context.
    const distractors = names.filter((n) => n !== m.name);
    if (distractors.length >= 2) {
      const all = [m, ...context];
      const ids = [
        ...all.map((x) => x.id),
        ...all.flatMap((x) => modelParts.filter((c) => c.parentId === x.id).map((c) => c.id)),
      ];
      const avgZ = context.length
        ? context.reduce((t, x) => t + centerOf(x)[2], 0) / context.length
        : 0;
      out.push({
        id: `collection-${m.id}-point`,
        topic: m.system,
        prompt: "Which structure is highlighted in colour?",
        answer: m.name,
        aliases: [],
        explanation: `${m.name}. ${study.function}`,
        source: study.source,
        format: "image",
        options: [m.name, ...distractors.slice(0, 3)].sort(),
        anatomySourceId: m.id,
        anatomy: {
          ids,
          frameIds: frameIdsFor(m, context),
          modelId: m.id,
          view: centerOf(m)[2] >= avgZ ? "front" : "back",
          highlightIds: [m.id, ...child],
          interaction: "identify",
        },
      });
    }
    if (
      study.detailLevel !== "identification" &&
      !parts.some(
        (other) =>
          other.id !== m.id && getModelStudy(other).function === study.function,
      )
    )
      out.push({
        id: `collection-${m.id}-function`,
        topic: m.system,
        prompt: `Which confirmed structure has this role? ${study.function}`,
        answer: m.name,
        aliases: [],
        explanation: `${m.name}: ${study.function} Parent notes may apply to both sides or several components.`,
        source: study.source,
        format: "typed",
        options: [],
        anatomySourceId: m.id,
      });
  }
  return out
    .filter(
      (q) =>
        scope.format === "mixed" ||
        scope.format === q.format ||
        (scope.format === "choice" && q.format === "image"),
    )
    .map((q) => (scope.format === "choice" ? { ...q, format: "choice" } : q));
}

/** A picture of one structure coloured among its neighbours (used by questions, flashcards and worksheets). */
export function pointerView(m: (typeof modelParts)[number]): AnatomyQuestionView {
  const context = surroundings(m, 7);
  const all = [m, ...context];
  const child = modelParts.filter((x) => x.parentId === m.id).map((x) => x.id);
  const ids = [
    ...all.map((x) => x.id),
    ...all.flatMap((x) => modelParts.filter((c) => c.parentId === x.id).map((c) => c.id)),
  ];
  const avgZ = context.length
    ? context.reduce((t, x) => t + centerOf(x)[2], 0) / context.length
    : 0;
  return {
    ids,
    frameIds: frameIdsFor(m, context),
    modelId: m.id,
    view: centerOf(m)[2] >= avgZ ? "front" : "back",
    highlightIds: [m.id, ...child],
    interaction: "identify",
  };
}
