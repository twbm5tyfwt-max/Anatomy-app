import { describe, it, expect } from "vitest";
import { createQuestions, isCorrect, type Question } from "./quiz";
import { defaultScope } from "./Quizzes";
import { structures, systems, tissues } from "./content";
import { atlasAreas } from "./atlas";
const question = (answer: string, aliases: string[] = []): Question => ({
  id: "q",
  topic: "muscular",
  prompt: "Identify",
  answer,
  aliases,
  explanation: "",
  source: "",
  options: [],
  format: "typed",
});
describe("content and quiz integrity", () => {
  it("covers all systems with real study entries and the requested tissue classes", () => {
    expect(systems).toHaveLength(11);
    for (const system of systems) {
      expect(structures.some((s) => s.system === system.id)).toBe(true);
      expect(system.overview.length).toBeGreaterThan(50);
    }
    expect(tissues.filter((t) => t.class === "Epithelial")).toHaveLength(9);
    expect(tissues.filter((t) => t.class === "Connective")).toHaveLength(11);
    expect(new Set(structures.map((s) => s.id)).size).toBe(structures.length);
  });
  it("uses known structures for all atlas hotspots", () => {
    for (const layer of ["muscular", "skeletal"])
      for (const view of ["front", "back"])
        for (const area of atlasAreas(layer, view)) {
          expect(structures.find((s) => s.id === area.id)?.system).toBe(layer);
        }
  });
  it("restricts generation to system, region, and structure", () => {
    const qs = createQuestions({
      ...defaultScope,
      region: "Upper limbs",
      format: "choice",
      count: 100,
    });
    expect(qs.length).toBeGreaterThan(0);
    for (const q of qs) {
      const structure = structures.find((s) => q.id.startsWith(s.id + "-"));
      expect(structure?.system).toBe("muscular");
      expect(structure?.region).toBe("Upper limbs");
    }
    const one = createQuestions({
      ...defaultScope,
      structure: "deltoid",
      count: 100,
    });
    expect(one.length).toBeGreaterThan(0);
    expect(one.every((q) => q.id.startsWith("deltoid-"))).toBe(true);
  });
  it("limits tissue quizzes and produces one answer key per question", () => {
    const qs = createQuestions({
      ...defaultScope,
      system: "",
      tissue: "Epithelial",
      count: 1000,
    });
    expect(qs).toHaveLength(27);
    for (const q of qs) {
      expect(q.topic).toBe("Epithelial");
      expect(q.options.filter((x) => x === q.answer)).toHaveLength(1);
      expect(q.options.filter((x) => isCorrect(x, q))).toHaveLength(1);
      expect(q.source).toBeTruthy();
    }
  });
  it("only includes available supported visual hotspots in click quizzes", () => {
    const qs = createQuestions({
      ...defaultScope,
      format: "click",
      count: 100,
    });
    expect(qs.length).toBeGreaterThan(0);
    for (const q of qs) {
      expect(q.format).toBe("click");
      expect(
        atlasAreas("muscular", "front").some((a) => a.id === q.structureId),
      ).toBe(true);
    }
  });
  it("returns only previously missed keys when requested", () => {
    const qs = createQuestions(
      { ...defaultScope, format: "choice", missedOnly: true, count: 20 },
      [],
      ["pectoralis-major-function"],
    );
    expect(qs.map((q) => q.id)).toEqual(["pectoralis-major-function"]);
  });
  it("builds course questions only from reviewed source cards", () => {
    const qs = createQuestions(
      { ...defaultScope, course: true, format: "typed" },
      [
        {
          id: "1",
          file: "Lecture 3.pdf",
          page: 4,
          term: "Humerus",
          definition: "Long bone of the arm.",
        },
      ],
    );
    expect(qs).toHaveLength(1);
    expect(qs[0].answer).toBe("Humerus");
    expect(qs[0].source).toContain("page / slide 4");
    expect(qs[0].format).toBe("typed");
  });
  it("has one distinct correct option across the complete bank", () => {
    const qs = createQuestions({
      ...defaultScope,
      system: "",
      difficulty: "Detailed",
      count: 1000,
    });
    expect(qs.length).toBeGreaterThan(150);
    for (const q of qs) {
      expect(new Set(q.options).size).toBe(q.options.length);
      expect(q.options.filter((o) => isCorrect(o, q))).toHaveLength(1);
    }
  });
});
describe("combined scopes and unambiguous clues", () => {
  it("combines an upper-limb muscle scope with epithelial tissues only", () => {
    const qs = createQuestions({
      ...defaultScope,
      region: "Upper limbs",
      includeTissues: ["Epithelial"],
      count: 1000,
    });
    expect(qs.some((q) => q.topic === "Epithelial")).toBe(true);
    expect(qs.some((q) => q.topic === "muscular")).toBe(true);
    for (const q of qs) {
      if (q.topic !== "Epithelial") {
        expect(q.topic).toBe("muscular");
        expect(
          structures.find((s) => q.id.startsWith(s.id + "-"))?.region,
        ).toBe("Upper limbs");
      }
    }
  });
  it("adds distinguishing location clues to shared attachments and actions", () => {
    const qs = createQuestions({
      ...defaultScope,
      difficulty: "Detailed",
      count: 1000,
    });
    for (const id of [
      "soleus-insertion",
      "gastrocnemius-insertion",
      "rectus-femoris-insertion",
      "vastus-lateralis-insertion",
    ]) {
      const q = qs.find((q) => q.id === id)!;
      expect(q.prompt).toContain("Location:");
      expect(q.prompt).toContain(
        structures.find((s) => id.startsWith(s.id + "-"))!.location,
      );
    }
  });
  it("does not use nonspecific glial schematics for image identification", () => {
    expect(
      createQuestions({
        ...defaultScope,
        system: "",
        tissue: "glia",
        format: "image",
        count: 100,
      }),
    ).toHaveLength(0);
  });
  it("includes missed course cards in global mistake review", () => {
    const qs = createQuestions(
      { ...defaultScope, system: "", missedOnly: true },
      [
        {
          id: "card1",
          file: "Source.pdf",
          page: 2,
          term: "Humerus",
          definition: "Bone of the arm",
        },
      ],
      ["course-card1"],
    );
    expect(qs.map((q) => q.id)).toEqual(["course-card1"]);
  });
});
describe("typed grading", () => {
  it("accepts capitalization, recorded synonyms, and minor typos", () => {
    const q = question("Sternocleidomastoid", ["SCM"]);
    expect(isCorrect(" SCM ", q)).toBe(true);
    expect(isCorrect("sternocleidomastiod", q)).toBe(true);
    expect(isCorrect("STERNOCLEIDOMASTOID muscle", q)).toBe(true);
  });
  it("distinguishes related valid structures and meaningful qualifiers", () => {
    expect(isCorrect("Biceps brachii", question("Triceps brachii"))).toBe(
      false,
    );
    expect(isCorrect("Radius", question("Ulna"))).toBe(false);
    expect(
      isCorrect(
        "Simple columnar",
        question("Pseudostratified ciliated columnar"),
      ),
    ).toBe(false);
    expect(isCorrect("Pectoralis minor", question("Pectoralis major"))).toBe(
      false,
    );
    expect(isCorrect("", question("Deltoid"))).toBe(false);
  });
});
