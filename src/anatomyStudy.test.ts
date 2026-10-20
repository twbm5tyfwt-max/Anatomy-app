import { describe, it, expect } from "vitest";
import {
  landmarks,
  landmarksFor,
  spineModels,
  spineRegionNotes,
} from "./landmarkCatalog";
import { modelParts } from "./modelCatalog";
import { createQuestions, type QuizScope } from "./quiz";
const scope: QuizScope = {
  anatomy: true,
  system: "",
  region: "",
  tissue: "",
  structure: "",
  count: 1000,
  format: "mixed",
  difficulty: "Detailed",
  course: false,
  missedOnly: false,
};
describe("source-backed landmarks and visual learning", () => {
  it("uses actual source positions and valid target bones/cartilages for every displayed landmark", () => {
    expect(landmarks.length).toBeGreaterThan(90);
    for (const l of landmarks) {
      const m = modelParts.find((m) => m.id === l.modelId)!;
      expect(["bones","cartilage"]).toContain(m.layer);
      const whole = modelParts.filter(
        (p) => p.id === m.id || p.parentId === m.id,
      );
      const bounds = [0, 1].map((edge) =>
        [0, 1, 2].map((axis) =>
          edge
            ? Math.max(...whole.map((p) => p.bounds[1][axis]))
            : Math.min(...whole.map((p) => p.bounds[0][axis])),
        ),
      );
      expect(l.anchor.every(Number.isFinite)).toBe(true);
      for (let a = 0; a < 3; a++) {
        expect(l.anchor[a]).toBeGreaterThan(bounds[0][a] - 0.005);
        expect(l.anchor[a]).toBeLessThan(bounds[1][a] + 0.005);
      }
      expect(l.location.length).toBeGreaterThan(15);
      expect(l.function.length).toBeGreaterThan(15);
      expect(l.features.length).toBeGreaterThan(15);
    }
  });
  it("keeps the intervertebral foramen in articulated context instead of labeling a lone vertebral hole", () => {
    const l = landmarks.find((l) => l.name === "Intervertebral foramen")!;
    const context = l.contextIds.map(
      (id) => modelParts.find((m) => m.id === id)!,
    );
    expect(context.some((m) => m.sourceName === "Vertebra L2")).toBe(true);
    expect(context.some((m) => m.sourceName === "Vertebra L3")).toBe(true);
    expect(
      context.some((m) => m.sourceName === "Intervertebral disc L2-L3"),
    ).toBe(true);
    expect(l.contents).toContain("Spinal nerve");
  });
  it("distinguishes projections and the three relevant spinal openings", () => {
    const spinous = landmarks.find((l) => l.name === "Spinous process")!;
    expect(spinous.features).toContain("not an opening");
    expect(
      landmarks.find((l) => l.name === "Vertebral foramen")?.contents,
    ).toContain("Spinal cord");
    const transverse = landmarks.find((l) => l.name === "Transverse foramen")!;
    expect(transverse.contents).toContain("C6 to C1");
    expect(transverse.contents).toContain("C7");
    expect(spineRegionNotes.Cervical).toContain("C1 is a ring without a body");
    expect(spineRegionNotes.Cervical).toContain("C2 bears the dens");
    expect(spineModels).toHaveLength(26);
  });
  it("supports source-anchored limb-bone study beyond the spine", () => {
    for (const name of [
      "Right humerus",
      "Right femur",
      "Right scapula",
      "Right hip bone",
      "Right tibia",
    ]) {
      const m = modelParts.find((m) => m.name === name && !m.parentId)!;
      expect(landmarksFor(m.id).length).toBeGreaterThan(3);
    }
  });
  it("only generates visual landmark questions from reviewed source views and keeps candidate markers on the correct model", () => {
    const bank = createQuestions(scope);
    expect(bank.some((q) => q.anatomy?.targetLandmarkId)).toBe(true);
    expect(bank.some((q) => q.id.endsWith("-ligament"))).toBe(true);
    expect(bank.some((q) => q.id === "3d-biceps-insertion")).toBe(true);
    for (const q of bank.filter((q) => q.anatomy)) {
      const a = q.anatomy!;
      for (const id of a.ids)
        expect(modelParts.some((m) => m.id === id)).toBe(true);
      for (const id of a.landmarkIds || []) {
        const l = landmarks.find((l) => l.id === id)!;
        expect(a.ids).toContain(l.modelId);
        if (a.interaction === "identify") expect(l.quiz).toBe(true);
      }
    }
  });
  it("respects spine scope, image/marker formats, and source coverage limits", () => {
    const spine = createQuestions({ ...scope, anatomyTopic: "spine" });
    expect(spine.length).toBeGreaterThan(10);
    expect(spine.some((q) => q.id.endsWith("-ligament"))).toBe(false);
    const click = createQuestions({ ...scope, format: "click" });
    expect(click).toHaveLength(2);
    expect(
      click.every(
        (q) => q.anatomy?.interaction === "click" && q.options.length === 0,
      ),
    ).toBe(true);
    const image = createQuestions({ ...scope, format: "image" });
    expect(image.every((q) => q.format === "image" && !!q.anatomy)).toBe(true);
    expect(
      createQuestions({ ...scope, structure: "model:not-reviewed" }),
    ).toHaveLength(0);
  });
});
