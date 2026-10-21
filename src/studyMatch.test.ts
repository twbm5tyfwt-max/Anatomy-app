import { describe, expect, it } from "vitest";
import { matchNotes, type Reference } from "./studyCollections";
import { modelParts } from "./modelCatalog";
import { ptRegions, ptSources, healingStages } from "./ptContent";
import { resolveStructure } from "./PTAnatomy";
import { groupOf, structureGroups } from "./GameSetup";

const ref = (text: string, kind: Reference["kind"] = "note"): Reference => ({
  file: "notes",
  page: 1,
  text,
  kind,
  extraction: kind === "image" ? "Local OCR" : undefined,
});
const names = (ids: string[]) =>
  ids.map((id) => modelParts.find((m) => m.id === id)!.name);

describe("study note matching", () => {
  it("expands knee shorthand but never pre-confirms it as exact", () => {
    const { matches } = matchNotes([ref("ACL, MCL and quads")]);
    const acl = matches.find((m) => m.term === "acl")!;
    expect(acl.exact).toBe(false);
    expect(names(acl.ids).sort()).toEqual([
      "Left anterior cruciate ligament",
      "Right anterior cruciate ligament",
    ]);
    const quads = matches.find((m) => m.term === "quads")!;
    expect(names(quads.ids).every((n) => /rectus femoris|vastus/i.test(n))).toBe(
      true,
    );
  });
  it("keeps bursae and vessels out of hamstring shorthand", () => {
    const row = matchNotes([ref("hamstrings")]).matches.find(
      (m) => m.term === "hamstrings",
    )!;
    expect(names(row.ids).some((n) => /bursa/i.test(n))).toBe(false);
  });
  it("flags OCR misspellings as fuzzy and only for OCR text", () => {
    const ocr = matchNotes([ref("sternocleidomastoid stemocleidomastoid", "image")]);
    expect(ocr.matches.some((m) => !m.fuzzy && m.term === "sternocleidomastoid")).toBe(true);
    const typo = matchNotes([ref("stemocleidomastoid", "image")]).matches.find(
      (m) => m.fuzzy,
    );
    expect(typo?.term).toBe("sternocleidomastoid");
    expect(
      matchNotes([ref("stemocleidomastoid", "note")]).matches.some((m) => m.fuzzy),
    ).toBe(false);
  });
  it("reports unrelated text as unmatched instead of inventing anatomy", () => {
    const r = matchNotes([ref("Lunch menu: pasta and salad")]);
    expect(r.matches).toEqual([]);
    expect(r.unmatched.length).toBe(1);
  });
});

describe("PT/AT content", () => {
  it("cites only declared sources and gives every exercise the required fields", () => {
    const ids = new Set(ptSources.map((s) => s.id));
    for (const r of ptRegions) {
      expect(r.exercises.length).toBeGreaterThanOrEqual(4);
      expect(r.injuries.length).toBeGreaterThanOrEqual(2);
      for (const e of r.exercises) {
        for (const k of ["purpose", "regression", "progression"] as const)
          expect(e[k].length, `${e.id} ${k}`).toBeGreaterThan(10);
        expect(e.targets.length).toBeGreaterThan(0);
        expect(e.steps.length).toBeGreaterThanOrEqual(2);
        expect(e.mistakes.length).toBeGreaterThan(0);
        expect(e.precautions.length).toBeGreaterThan(0);
        expect(e.sources.length).toBeGreaterThan(0);
        for (const s of e.sources) expect(ids.has(s), `${e.id} → ${s}`).toBe(true);
      }
      for (const i of r.injuries) {
        expect(i.seeClinician.length).toBeGreaterThan(0);
        expect(healingStages[i.tissue]).toBeTruthy();
        for (const s of i.sources) expect(ids.has(s), `${i.id} → ${s}`).toBe(true);
      }
    }
  });
  it("never claims treatment guarantees healing or prescribes dose", () => {
    const text = JSON.stringify(ptRegions);
    expect(text).not.toMatch(/guarantee[sd]? (to )?heal|will heal|\bcures?\b/i);
    expect(text).not.toMatch(/\b\d+\s*(sets|reps|repetitions)\b/i);
  });
  it("links every region's structures to modeled parts where it claims to", () => {
    for (const r of ptRegions) {
      const resolved = r.structures.filter((s) => resolveStructure(s.match).length);
      expect(resolved.length, r.name).toBeGreaterThanOrEqual(
        Math.ceil(r.structures.length * 0.6),
      );
    }
  });
  it("uses https source links only", () => {
    for (const s of ptSources) expect(s.url).toMatch(/^https:\/\//);
  });
});

describe("game checklist groups", () => {
  it("assigns every modeled structural layer to exactly one group", () => {
    for (const m of modelParts.filter((m) => !m.parentId && m.layer)) {
      const g = groupOf(m);
      expect(structureGroups.some((x) => x.id === g)).toBe(true);
    }
    expect(
      structureGroups.find((g) => g.id === "ligaments")!.layers,
    ).toEqual(["ligaments"]);
  });
});

describe("PT structure resolution", () => {
  it("resolves menisci to the cartilage menisci, not meniscotibial ligaments", () => {
    const parts = resolveStructure("^right (medial|lateral) meniscus$");
    expect(parts.map((p) => p.name).sort()).toEqual([
      "Right lateral meniscus",
      "Right medial meniscus",
    ]);
    expect(parts.every((p) => p.layer === "cartilage")).toBe(true);
  });
  it("only resolves right-sided structural parts", () => {
    for (const r of ptRegions)
      for (const s of r.structures)
        for (const p of resolveStructure(s.match)) {
          expect(/left /i.test(p.name), p.name).toBe(false);
          expect(["muscles", "tendons", "ligaments", "cartilage", "bones", "capsules"]).toContain(p.layer);
        }
  });
});
