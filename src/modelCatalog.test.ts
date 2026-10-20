import { describe, it, expect } from "vitest";
import manifest from "./model-manifest.json";
import {
  getModelStudy,
  getRegion,
  modelParts,
  resolveStructure,
} from "./modelCatalog";
import { systems, regions } from "./content";
const find = (name: string) =>
  modelParts.find((m) => m.name === name && !m.parentId)!;
describe("source-registered Z-Anatomy catalog", () => {
  it("keeps the pinned atlas parts uniquely identified with valid metric bounds", () => {
    expect(manifest.revision).toBe("0189e82e4dc5c6a4ebc1d2558b78580665e9b0ef");
    expect(modelParts).toHaveLength(4291);
    expect(new Set(modelParts.map((m) => m.id)).size).toBe(4291);
    for (const m of modelParts) {
      expect(m.sha1).toBe("f43cabc6f366b2a6058dd2ed4a2b3c7b9b2492cb");
      expect(m.sourceName).toBeTruthy();
      expect(systems.some((s) => s.id === m.system)).toBe(true);
      expect(regions).toContain(getRegion(m));
      expect(m.bounds.flat().every(Number.isFinite)).toBe(true);
      expect(m.bounds.flat().every((v) => Math.abs(v) < 2)).toBe(true);
      expect(m.triangles).toBeGreaterThan(0);
      for (let a = 0; a < 3; a++)
        expect(m.bounds[1][a]).toBeGreaterThanOrEqual(m.bounds[0][a]);
    }
  });
  it("preserves anatomical laterality and axial relationships across systems", () => {
    expect(find("Left humerus").bounds[0][0]).toBeGreaterThan(0);
    expect(find("Right humerus").bounds[1][0]).toBeLessThan(0);
    expect(find("Right femur").bounds[1][1]).toBeLessThan(
      find("Right humerus").bounds[1][1],
    );
    expect(
      modelParts.filter(
        (m) => m.layer === "bones" && /vertebra|^Atlas$|^Axis$/.test(m.name),
      ),
    ).toHaveLength(24);
    expect(find("Coccyx").layer).toBe("bones");
  });
  it("distinguishes tissue surface regions, modeled connective structures, and attachment illustrations", () => {
    for (const m of modelParts.filter((m) => m.parentId)) {
      const p = modelParts.find((p) => p.id === m.parentId);
      expect(p).toBeTruthy();
      expect(m.sourceName).toBe(p?.sourceName);
      expect(m.surfaceRegion).toBe(true);
    }
    const patch = modelParts.find(
      (m) => m.sourceName === "Biceps brachii muscle.er",
    )!;
    expect(patch.layer).toBe("attachment");
    expect(patch.attachmentKind).toBe("insertion");
    expect(patch.attachmentFor).toBeTruthy();
    expect(getModelStudy(patch).function).toContain(
      "not a separately modeled tendon",
    );
    expect(getModelStudy(find("Right calcaneal tendon")).kind).toBe(
      "Connective tissue",
    );
    expect(
      getModelStudy(find("Right anterior cruciate ligament")).function,
    ).toContain("anterior translation");
  });
  it("does not classify synovial bursae or articular capsules as contracting muscle", () => {
    const b = modelParts.find((m) => m.layer === "bursae")!;
    expect(getModelStudy(b).kind).toBe("Synovial bursa");
    expect(getModelStudy(b).function).toContain("reduces friction");
    const c = modelParts.find((m) => m.layer === "capsules")!;
    expect(getModelStudy(c).kind).toBe("Articular capsule");
  });
  it("retains bone study notes and explicitly identifies coverage limits", () => {
    const s = getModelStudy(find("Right humerus"));
    expect(s.kind).toBe("Bone");
    expect(s.function).toContain("shoulder and elbow");
    expect(
      s.landmarkGuide.find((l) => l.name === "Olecranon fossa")?.view,
    ).toBe("back");
    const m = modelParts.find(
      (m) =>
        m.layer === "muscles" &&
        /clavicular.*right pectoralis major/i.test(m.name),
    )!;
    expect(getModelStudy(m).family).toBe("Pectoralis major");
    expect(getModelStudy(m).origin).toBeTruthy();
    const all = modelParts.map(getModelStudy);
    for (const level of ["detailed", "overview", "identification"])
      expect(all.some((s) => s.detailLevel === level)).toBe(true);
    for (const s of all) expect(s.source).toBeTruthy();
  });
  it("handles retired model bookmarks safely while retaining stable bone IDs", () => {
    expect(resolveStructure("model:FMA23130")?.name).toBe("Right humerus");
    expect(resolveStructure("model:removed-part")).toBeUndefined();
  });
});
