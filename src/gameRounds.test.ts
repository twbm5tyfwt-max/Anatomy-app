import { describe, expect, it } from "vitest";
import { normalise, typedMatches, oddRound, dailyRoster } from "./gameRounds";
import { modelParts } from "./modelCatalog";
import { pointsFor, stars } from "./gameStats";

describe("game rounds", () => {
  it("accepts typed answers without side words and with one typo", () => {
    expect(normalise("Right Biceps Brachii muscle")).toBe("biceps brachii");
    expect(typedMatches("biceps brachi", "Right biceps brachii")).toBe(true);
    expect(typedMatches("triceps", "Right biceps brachii")).toBe(false);
    expect(typedMatches("", "Femur")).toBe(false);
  });
  it("builds odd-one-out rounds with three of one tissue and one other", () => {
    const pool = modelParts.filter((m) => !m.parentId && ["bones", "muscles"].includes(m.layer || "")).slice(0, 400);
    const r = oddRound(pool, "t1")!;
    expect(r.parts).toHaveLength(4);
    expect(r.parts.filter((m) => (m.layer || "organs") === r.layer)).toHaveLength(3);
    expect((r.odd.layer || "organs") === r.layer).toBe(false);
  });
  it("gives everyone the same daily set", () => {
    const pool = modelParts.filter((m) => !m.parentId);
    expect(dailyRoster("2026-01-01", pool).map((m) => m.id)).toEqual(dailyRoster("2026-01-01", pool).map((m) => m.id));
  });
  it("scores harder, faster, hint-free answers higher", () => {
    const base = { hints: 0, took: 5, par: 20, streak: 0 };
    expect(pointsFor({ ...base, difficulty: "hard" })).toBeGreaterThan(pointsFor({ ...base, difficulty: "easy" }));
    expect(pointsFor({ ...base, difficulty: "normal", hints: 2 })).toBeLessThan(pointsFor({ ...base, difficulty: "normal" }));
    expect(stars({ right: 6, wrong: 0, last: "", streak: 4 })).toBe(3);
  });
});
