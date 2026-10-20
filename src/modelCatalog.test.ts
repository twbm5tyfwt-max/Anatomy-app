import { describe, it, expect } from "vitest";
import {
  getModelStudy,
  getRegion,
  modelParts,
  resolveStructure,
} from "./modelCatalog";
import { systems, regions } from "./content";
const find = (name: string) => modelParts.find((m) => m.name === name)!;
describe("3D model identities and anatomy notes", () => {
  it("keeps 924 unique named, source-traceable meshes with valid geometry bounds", () => {
    expect(modelParts).toHaveLength(924);
    expect(new Set(modelParts.map((m) => m.id)).size).toBe(924);
    for (const m of modelParts) {
      expect(m.sha1).toMatch(/^[a-f0-9]{40}$/);
      expect(systems.some((s) => s.id === m.system)).toBe(true);
      expect(regions).toContain(getRegion(m));
      expect(m.bounds.flat().every(Number.isFinite)).toBe(true);
      for (let a = 0; a < 3; a++)
        expect(m.bounds[1][a]).toBeGreaterThanOrEqual(m.bounds[0][a]);
      expect(m.triangles).toBeGreaterThan(0);
    }
  });
  it("preserves left/right coordinates and superior/inferior relationships", () => {
    expect(find("Left humerus").bounds[0][0]).toBeGreaterThan(0);
    expect(find("Right humerus").bounds[1][0]).toBeLessThan(0);
    expect(find("Right femur").bounds[1][1]).toBeLessThan(
      find("Right humerus").bounds[1][1],
    );
  });
  it("maps selected bones to correct functions and explicit landmark guides", () => {
    const s = getModelStudy(find("Right humerus"));
    expect(s.kind).toBe("Bone");
    expect(s.function).toContain("shoulder and elbow");
    expect(
      s.landmarkGuide.find((l) => l.name === "Olecranon fossa")?.view,
    ).toBe("back");
    expect(resolveStructure(s.id)?.name).toBe("Right humerus");
  });
  it("identifies a muscle component while crediting parent muscle study notes", () => {
    const m = modelParts.find((m) =>
      m.name
        .toLowerCase()
        .includes("clavicular part of right pectoralis major"),
    )!;
    const s = getModelStudy(m);
    expect(s.name).toBe(m.name);
    expect(s.family).toBe("Pectoralis major");
    expect(s.origin).toBeTruthy();
    expect(s.insertion).toBeTruthy();
    expect(s.detailLevel).toBe("detailed");
  });
  it("does not describe tendons or ligaments as contracting muscles", () => {
    const s = getModelStudy(find("Right calcaneal tendon"));
    expect(s.kind).toBe("Connective tissue");
    expect(s.function).toContain("Transmits force");
    const ligament = modelParts.find(
      (m) => m.name === "Right inguinal ligament",
    )!;
    expect(getModelStudy(ligament).kind).toBe("Connective tissue");
  });
  it("provides functional study notes for every muscle-related source mesh", () => {
    for (const m of modelParts.filter((m) => m.system === "muscular"))
      expect(getModelStudy(m).detailLevel).not.toBe("identification");
  });
  it("keeps incomplete study coverage explicit rather than inventing details", () => {
    const all = modelParts.map(getModelStudy);
    expect(all.some((s) => s.detailLevel === "identification")).toBe(true);
    expect(all.some((s) => s.detailLevel === "overview")).toBe(true);
    expect(all.some((s) => s.detailLevel === "detailed")).toBe(true);
    for (const s of all) expect(s.source).toBeTruthy();
    console.log(
      "3D note coverage:",
      Object.fromEntries(
        ["detailed", "overview", "identification"].map((level) => [
          level,
          all.filter((s) => s.detailLevel === level).length,
        ]),
      ),
    );
  });
});
