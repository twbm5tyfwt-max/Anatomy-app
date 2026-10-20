import { describe, expect, it } from "vitest";
import { collectionQuestions } from "./collectionQuestions";
import { landmarks } from "./landmarkCatalog";
import { landmarkCounts } from "./LandmarkGame";
import { modelParts } from "./modelCatalog";
import { tissuePalette, tissueColor } from "./tissueColors";
import type { QuizScope } from "./quiz";

const id = (name: string) => modelParts.find((m) => m.name === name && !m.parentId)!.id;
const scope = (ids: string[]) =>
  ({ modelIds: ids, format: "mixed", count: 100 }) as unknown as QuizScope;

describe("tissue palette", () => {
  it("gives every structural layer its own colour", () => {
    const layers = ["bones", "muscles", "tendons", "ligaments", "cartilage"];
    const colours = layers.map(tissueColor);
    expect(new Set(colours).size).toBe(layers.length);
    for (const l of layers) expect(tissuePalette[l].label).toBeTruthy();
  });
});

describe("landmark game data", () => {
  it("counts only validated, mapped landmarks and they point at real bones", () => {
    const counts = landmarkCounts();
    expect(counts.get(id("Mandible"))).toBeGreaterThanOrEqual(10);
    expect(counts.get(id("Right humerus"))).toBeGreaterThanOrEqual(20);
    for (const l of landmarks) {
      expect(modelParts.some((m) => m.id === l.modelId)).toBe(true);
      expect(l.anchor).toHaveLength(3);
    }
  });
  it("has enough different landmarks on one bone for multiple choice", () => {
    const names = new Set(
      landmarks.filter((l) => l.modelId === id("Right tibia")).map((l) => l.name),
    );
    expect(names.size).toBeGreaterThanOrEqual(4);
  });
});

describe("point-to-part picture questions", () => {
  const ids = ["Right femur", "Right tibia", "Right fibula", "Right patella"].map(id);
  const names = ids.map((i) => modelParts.find((m) => m.id === i)!.name);
  const qs = collectionQuestions(scope(ids)).filter((q) => q.id.endsWith("-point"));
  it("creates one per confirmed structure with the target highlighted", () => {
    expect(qs).toHaveLength(4);
    for (const q of qs) {
      expect(q.anatomy!.highlightIds).toContain(q.anatomySourceId);
      expect(q.anatomy!.ids).toContain(q.anatomySourceId);
      expect(q.format).toBe("image");
    }
  });
  it("only offers confirmed structure names as options", () => {
    for (const q of qs) {
      expect(q.options).toContain(q.answer);
      expect(q.options.every((o) => names.includes(o))).toBe(true);
    }
  });
  it("is skipped when there are too few confirmed structures to choose between", () => {
    const two = collectionQuestions(scope(ids.slice(0, 2))).filter((q) => q.id.endsWith("-point"));
    expect(two).toHaveLength(0);
  });
});
