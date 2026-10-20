import {anatomyImages} from "./assetPaths";
import microscopy from "./generated/histology.json";
import { describe, it, expect } from "vitest";
import { orderPicks } from "./interaction";
import { regionParts, associatedTissue } from "./atlasDomain";
import { modelParts } from "./modelCatalog";
import { matchNotes } from "./studyCollections";
import { createQuestions } from "./quiz";
import { defaultScope } from "./Quizzes";
import { gamePool } from "./StudyGames";
const find = (name: string) =>
  modelParts.find((m) => m.name === name && !m.parentId)!;
describe("consistent picking and study scope", () => {
  it("picks through near-transparent surfaces, deduplicates meshes, and excludes effectively hidden surfaces", () => {
    expect(
      orderPicks([
        { id: "skin", opacity: 0.2, distance: 1 },
        { id: "hidden", opacity: 0, distance: 0.5 },
        { id: "bone", opacity: 1, distance: 2 },
        { id: "bone", opacity: 1, distance: 2.01 },
      ]).map((x) => x.id),
    ).toEqual(["bone", "skin"]);
    expect(orderPicks([])).toEqual([]);
  });
  it("keeps bony skull separate from nasal cartilage and covers four abdominal muscle layers", () => {
    expect(regionParts("Skull").every((m) => m.layer === "bones")).toBe(true);
    for (const term of [
      "rectus abdominis",
      "external abdominal oblique",
      "internal abdominal oblique",
      "transversus abdominis",
    ])
      expect(regionParts("Abdomen").some((m) => m.name.includes(term))).toBe(
        true,
      );
  });
  it("includes both menisci and right joint structures without confusing them with articular cartilage", () => {
    const knee = regionParts("Knee");
    for (const n of [
      "Right medial meniscus",
      "Right lateral meniscus",
      "Right patella",
      "Right femur",
    ])
      expect(knee.some((m) => m.name === n)).toBe(true);
    expect(knee.some((m) => /^Left /.test(m.name))).toBe(false);
    expect(associatedTissue(find("Right medial meniscus"))).toBe(
      "fibrocartilage",
    );
    expect(associatedTissue(find("Nasal septal cartilage"))).toBe("hyaline");
  });
  it("returns reviewable side matches and never invents missing female or microscopic geometry", () => {
    const result = matchNotes([
      {
        file: "lab.txt",
        page: 3,
        kind: "note",
        text: "masseter, uterus, alveoli",
      },
    ]);
    const match = result.matches.find((x) => x.term === "masseter")!;
    expect(match.ids).toHaveLength(4);
    expect(match.exact).toBe(false);
    expect(result.unmatched).toHaveLength(1);
    expect(result.matches.some((x) => x.term === "uterus")).toBe(false);
  });
  it("restricts generated questions, options and games to confirmed structures", () => {
    const ids = [find("Right humerus").id, find("Right femur").id];
    const qs = createQuestions(
      {
        ...defaultScope,
        modelIds: ids,
        system: "",
        format: "mixed",
        count: 100,
      },
      [],
      [],
    );
    expect(qs.length).toBeGreaterThan(1);
    expect(qs.every((q) => ids.includes(q.anatomySourceId!))).toBe(true);
    const names = ids.map((id) => modelParts.find((m) => m.id === id)!.name);
    expect(qs.every((q) => q.options.every((o) => names.includes(o)))).toBe(
      true,
    );
    const collection = {
      id: "test",
      name: "Test",
      ids,
      references: [],
      created: "",
    };
    expect(
      gamePool("", "", collection)
        .map((m) => m.id)
        .sort(),
    ).toEqual([...ids].sort());
    expect(gamePool("Skull", "", collection)).toHaveLength(0);
  });
});

it('keeps a source caption and license record for every added microscopy image',()=>{
 const baseline=['1105_Anterior_and_Posterior_Views_of_Muscles.jpg','403_Epithelial_Tissue.jpg','701_Axial_Skeleton-01.jpg'];
 const records=new Set(microscopy.map(x=>x.file));
 for(const filename of Object.keys(anatomyImages).filter(n=>!baseline.includes(n))){expect(records.has(filename)).toBe(true);const source=microscopy.find(x=>x.file===filename)!;expect(source.caption.length).toBeGreaterThan(30);expect(source.license).toContain('CC BY-NC-SA');expect(source.sha256).toMatch(/^[a-f0-9]{64}$/);}
});
