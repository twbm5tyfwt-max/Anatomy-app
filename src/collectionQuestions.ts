import { modelParts, getModelStudy } from "./modelCatalog";
import type { Question, QuizScope } from "./quiz";
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
