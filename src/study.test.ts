import { beforeEach, describe, expect, it } from "vitest";

const store = new Map<string, string>();
Object.assign(globalThis, {
  localStorage: {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
    key: (i: number) => [...store.keys()][i] ?? null,
    get length() {
      return store.size;
    },
  },
  window: { dispatchEvent: () => true, addEventListener: () => {} },
});

const study = await import("./studyStore");
const { muscleRows, muscleQuestions } = await import("./MuscleTables");

describe("review schedule", () => {
  beforeEach(() => store.clear());
  const today = study.dayKey();
  it("adds each card once and makes it due today", () => {
    const n = study.addCards([
      { key: "s:a", kind: "structure" },
      { key: "s:a", kind: "structure" },
      { key: "s:b", kind: "structure" },
    ]);
    expect(n).toBe(2);
    expect(Object.values(study.readSrs()).every((e) => study.isDue(e, today))).toBe(true);
  });
  it("spaces cards out with Good/Easy and resets them with Again", () => {
    study.addCards([{ key: "s:a", kind: "structure" }]);
    study.rate("s:a", "good");
    let e = study.readSrs()["s:a"];
    expect(e.box).toBe(1);
    expect(e.due).toBe(study.addDays(today, study.INTERVALS[1]));
    study.rate("s:a", "easy");
    e = study.readSrs()["s:a"];
    expect(e.box).toBe(3);
    expect(e.due).toBe(study.addDays(today, study.INTERVALS[3]));
    study.rate("s:a", "again");
    e = study.readSrs()["s:a"];
    expect(e.box).toBe(0);
    expect(e.lapses).toBe(1);
    expect(study.isDue(e, today)).toBe(true);
  });
  it("counts reviews as activity", () => {
    study.addCards([{ key: "s:a", kind: "structure" }]);
    study.rate("s:a", "good");
    expect(JSON.parse(store.get(study.ACTIVITY_KEY)!)[today]).toBe(1);
  });
});

describe("streaks and dates", () => {
  it("counts consecutive days and tolerates an empty today", () => {
    const t = "2026-10-20";
    expect(study.streakOf({ "2026-10-20": 3, "2026-10-19": 1, "2026-10-18": 2 }, t)).toBe(3);
    expect(study.streakOf({ "2026-10-19": 1, "2026-10-18": 2 }, t)).toBe(2);
    expect(study.streakOf({ "2026-10-17": 5 }, t)).toBe(0);
  });
  it("handles month boundaries", () => {
    expect(study.addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(study.daysBetween("2026-10-20", "2026-12-01")).toBe(42);
  });
});

describe("muscle tables", () => {
  const rows = muscleRows();
  it("only includes muscles with reviewed origin, insertion and action", () => {
    expect(rows.length).toBeGreaterThan(30);
    for (const r of rows) {
      expect(r.origin && r.insertion && r.actions).toBeTruthy();
    }
    expect(new Set(rows.map((r) => r.name.toLowerCase())).size).toBe(rows.length);
  });
  it("does not reuse a hand muscle's entry for its foot namesake", () => {
    const foot = rows.find((r) => /of foot/i.test(r.name));
    if (foot) expect(foot.origin).not.toMatch(/pisiform/i);
  });
  it("builds unambiguous multiple-choice questions", () => {
    const qs = muscleQuestions(rows, ["origin", "insertion", "actions", "innervation"], "mixed", 40);
    expect(qs.length).toBeGreaterThan(10);
    expect(new Set(qs.map((q) => q.id)).size).toBe(qs.length);
    for (const q of qs) {
      expect(q.options).toContain(q.answer);
      expect(new Set(q.options).size).toBe(q.options.length);
      expect(q.options.length).toBeGreaterThanOrEqual(4);
    }
  });
});
