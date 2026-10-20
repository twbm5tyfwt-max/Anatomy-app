import { readAtlasState } from "./workspaceStorage";
import validation from "./generated/anchor-validation.json";
import { describe, it, expect, vi } from "vitest";
import { modelParts, getModelStudy } from "./modelCatalog";
import { boneNoteFor } from "./boneNotes";
import { hraParts, hraRegionParts } from "./hraCatalog";
import { organParts, organRegion } from "./HraExplorer";
import { readingFor } from "./AnatomyReading";
import { landmarks } from "./landmarkCatalog";
import { associatedTissue, regionParts } from "./atlasDomain";
import { referencePlates } from "./PlateExplorer";
import { anatomyImages } from "./assetPaths";
const find = (name: string) =>
  modelParts.find((m) => m.name === name && !m.parentId)!;
describe("source expansion and requested anatomy coverage", () => {
  it("separates cartilage from valve, dural, eyelid and gelatinous disc structures", () => {
    for (const name of [
      "Left coronary leaflet",
      "Falx cerebri",
      "Right superior tarsus",
      "Nucleus pulposus L3-L4",
    ])
      expect(find(name).layer).toBe("organs");
    expect(getModelStudy(find("Left coronary leaflet")).function).toContain(
      "semilunar",
    );
    expect(getModelStudy(find("Right superior tarsus")).kind).toBe(
      "Eyelid tarsal plate",
    );
    expect(
      associatedTissue(find("Right articular disc of sternoclavicular joint")),
    ).toBe("fibrocartilage");
    expect(associatedTissue(find("Interpubic disc"))).toBe("fibrocartilage");
    const tooth = modelParts.find(
      (m) => m.layer === "bones" && /molar tooth/i.test(m.name),
    )!;
    expect(getModelStudy(tooth).kind).toBe("Tooth");
    expect(associatedTissue(tooth)).toBe("dental");
    expect(associatedTissue(find("Right corniculate cartilage"))).toBe(
      "elastic-cartilage",
    );
    expect(
      associatedTissue(
        hraParts.find((m) => m.name === "Epiglottic cartilage")!,
      ),
    ).toBe("elastic-cartilage");
  });
  it("preserves a saved selected structure after its source tissue classification is corrected", () => {
    const selected = find("Nucleus pulposus L3-L4").id;
    const old = {
      selected,
      hidden: [],
      isolated: [selected],
      layers: { cartilage: 1, organs: 0, bones: 1 },
      visible: ["skeletal"],
      camera: { position: [1, 2, 3], target: [0, 0, 0], view: "front" },
    };
    vi.stubGlobal("localStorage", { getItem: () => JSON.stringify(old) });
    try {
      const restored = readAtlasState("main")!;
      expect(restored.layers.organs).toBe(1);
      expect(restored.selected).toBe(selected);
      expect(restored.isolated).toEqual([selected]);
      expect(restored.camera).toEqual(old.camera);
    } finally {
      vi.unstubAllGlobals();
    }
  });
  it("gives every source-classified bone a text landmark, articulation and representative attachment guide", () => {
    const bones = modelParts.filter((m) => m.layer === "bones");
    expect(bones).toHaveLength(246);
    const missing = bones
      .filter((m) => !boneNoteFor(m.name))
      .map((m) => m.name);
    expect(missing).toEqual([]);
    for (const bone of bones) {
      const s = getModelStudy(bone);
      expect(s.landmarks?.length, bone.name).toBeGreaterThan(15);
      expect(s.articulations?.length).toBeGreaterThan(15);
      expect(s.attachments?.length, bone.name).toBeGreaterThan(15);
    }
    expect(getModelStudy(find("Right talus")).attachments).toContain(
      "No skeletal-muscle tendon attaches",
    );
  });
  it("links previously sparse muscle/vessel entries to correctly attributed archived anatomy", () => {
    for (const name of [
      "Right tibialis anterior",
      "Right piriformis",
      "Right soleus",
      "Right anterior tibial artery",
    ]) {
      const reading = readingFor(find(name).id)!;
      expect(reading.url).toMatch(/^https:\/\/en.wikipedia.org\/wiki\//);
      expect(reading.sections.length).toBeGreaterThan(1);
      expect(
        reading.sections.some((s) =>
          /Clinical|Other animals|Variation/i.test(s.heading),
        ),
      ).toBe(false);
    }
    // validated source points plus their mirrored left-side twins
    const source = landmarks.filter((l) => !l.id.endsWith("-L"));
    expect(source).toHaveLength(validation.results.filter((r) => r.valid).length);
    expect(landmarks.length).toBeGreaterThan(source.length);
    expect(landmarks.length).toBeGreaterThan(300);
    expect(landmarks.filter((l) => l.quiz).length).toBeLessThan(900);
  });
  it("includes modeled quadriceps tendon regions in the knee exploration scope", () => {
    const tendons = regionParts("Knee").filter((m) => m.layer === "tendons");
    expect(tendons).toHaveLength(4);
    expect(tendons.every((m) => /right/i.test(m.name))).toBe(true);
    expect(tendons.some((m) => /rectus femoris/.test(m.name))).toBe(true);
  });
  it("retains separate source HRA heart components for real component dissection", () => {
    const heart = organParts("Heart");
    for (const name of [
      "Interventricular septum",
      "Left cardiac atrium",
      "Right cardiac atrium",
      "Left ventricle",
      "Right ventricle",
      "Aortic valve",
      "Pulmonary valve",
      "Mitral valve",
      "Tricuspid valve",
    ])
      expect(heart.some((m) => m.name === name)).toBe(true);
    expect(hraParts.length).toBe(888);
    expect(hraParts.every((m) => m.bounds.flat().every(Number.isFinite))).toBe(
      true,
    );
  });
  it("preserves left/right lung lobes and bronchi without inventing alveolar meshes", () => {
    const lungs = hraRegionParts("Lungs");
    for (const ancestor of [
      "L lung upper lobe",
      "L lung lower lobe",
      "R lung upper lobe",
      "R lung middle lobe",
      "R lung lower lobe",
    ])
      expect(lungs.some((m) => m.ancestry.includes(ancestor))).toBe(true);
    expect(lungs.some((m) => m.name === "Left main bronchus")).toBe(true);
    expect(lungs.some((m) => /alveol/i.test(m.name))).toBe(false);
  });
  it("keeps cartilage teaching classifications distinct and supplies source sections for organ gaps", () => {
    expect(associatedTissue(find("Right medial meniscus"))).toBe(
      "fibrocartilage",
    );
    const epiglottis = modelParts.find(
      (m) => m.layer === "cartilage" && /epiglott/i.test(m.name),
    )!;
    expect(associatedTissue(epiglottis)).toBe("elastic-cartilage");
    expect(referencePlates).toHaveLength(18);
    for (const p of referencePlates) expect(anatomyImages[p.file]).toBeTruthy();
    expect(organRegion(find("Stomach"))).toBe("Stomach");
  });
});
