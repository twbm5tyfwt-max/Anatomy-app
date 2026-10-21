import type { ModelPart } from "./modelCatalog";
import { seeded, seededShuffle, stars, type GameStats } from "./gameStats";

/** Lower-case, drop side words, punctuation and filler so typed answers compare fairly. */
export function normalise(s: string) {
  return s
    .toLowerCase()
    .replace(/\b(right|left|the|of|muscle|bone)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
function distance(a: string, b: string) {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return row[b.length];
}
/** A typed answer is right if it matches the name, ignoring side words and one small typo. */
export function typedMatches(input: string, name: string) {
  const a = normalise(input);
  const b = normalise(name);
  if (!a) return false;
  if (a === b) return true;
  return b.length > 5 && distance(a, b) <= 1;
}

const family = (m: ModelPart) => m.name.replace(/^(left|right)\s+/i, "").toLowerCase();

/** Wrong choices for a name question: same tissue first, then the rest. Side-twins are never offered. */
export function distractors(target: ModelPart, roster: ModelPart[], n: number, rnd: () => number) {
  const others = roster.filter((m) => m.id !== target.id && family(m) !== family(target));
  const same = others.filter((m) => m.layer === target.layer);
  const pick = [...seededOrder(same, rnd), ...seededOrder(others.filter((m) => !same.includes(m)), rnd)];
  const names: string[] = [];
  for (const m of pick) {
    if (names.length >= n) break;
    if (!names.includes(m.name)) names.push(m.name);
  }
  return names;
}
function seededOrder<T>(a: T[], rnd: () => number) {
  return [...a].sort(() => rnd() - 0.5);
}

export const oddPalette = ["#e8b84a", "#5aa8e0", "#e06c8a", "#7bc67e", "#b08ae0"];

/** Three structures from one tissue plus one from another. */
export function oddRound(roster: ModelPart[], seed: string) {
  const rnd = seeded(seed);
  const byLayer = new Map<string, ModelPart[]>();
  for (const m of roster) byLayer.set(m.layer || "organs", [...(byLayer.get(m.layer || "organs") || []), m]);
  const majors = [...byLayer.entries()].filter(([, v]) => v.length >= 3);
  if (!majors.length || byLayer.size < 2) return null;
  const [layer, members] = majors[Math.floor(rnd() * majors.length)];
  const three = seededShuffle(members, seed + "a").slice(0, 3);
  const rest = roster.filter((m) => (m.layer || "organs") !== layer);
  const odd = seededShuffle(rest, seed + "b")[0];
  const all = seededShuffle([...three, odd], seed + "c");
  return { parts: all, odd, layer };
}
export const canPlayOdd = (roster: ModelPart[]) => !!oddRound(roster, "check");

/** The same ten structures for everyone on a given date. */
export function dailyRoster(date: string, pool: ModelPart[], n = 10) {
  const usable = pool.filter((m) => ["bones", "muscles", "ligaments"].includes(m.layer || ""));
  return seededShuffle(usable, "daily-" + date).slice(0, n);
}

/** The structure ids you miss most, from mastery records (key `s:<id>`). */
export function weakestIds(stats: GameStats, valid: Set<string>, n = 10) {
  return Object.entries(stats.mastery)
    .filter(([k, m]) => k.startsWith("s:") && m.wrong > 0 && valid.has(k.slice(2)))
    .sort(
      ([, a], [, b]) =>
        b.wrong / (b.right + b.wrong) - a.wrong / (a.right + a.wrong) || b.wrong - a.wrong,
    )
    .slice(0, n)
    .map(([k]) => k.slice(2));
}

export const starsOf = (stats: GameStats, id: string) => stars(stats.mastery["s:" + id]);
