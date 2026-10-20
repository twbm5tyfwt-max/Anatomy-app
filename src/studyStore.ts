import { useEffect, useState } from "react";

/** Small shared localStorage store so every study panel sees the same data instantly. */
const EVENT = "forma-study-change";
function read<T>(key: string, initial: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : initial;
  } catch {
    return initial;
  }
}
function write<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    window.dispatchEvent(new CustomEvent("forma-storage-error"));
  }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: key }));
}
export function useShared<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => read(key, initial));
  useEffect(() => {
    const f = (e: Event) => {
      if (!(e instanceof CustomEvent) || e.detail === key) setValue(read(key, initial));
    };
    window.addEventListener(EVENT, f);
    window.addEventListener("storage", f);
    return () => {
      window.removeEventListener(EVENT, f);
      window.removeEventListener("storage", f);
    };
  }, [key]);
  const update = (v: T | ((old: T) => T)) => {
    const next = typeof v === "function" ? (v as (o: T) => T)(read(key, initial)) : v;
    write(key, next);
    setValue(next);
  };
  return [value, update] as const;
}

export const dayKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const addDays = (key: string, n: number) => {
  const [y, m, d] = key.split("-").map(Number);
  return dayKey(new Date(y, m - 1, d + n));
};
export const daysBetween = (a: string, b: string) => {
  const t = (k: string) => {
    const [y, m, d] = k.split("-").map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((t(b) - t(a)) / 86400000);
};

// ---- activity, goals, streak -------------------------------------------------
export const ACTIVITY_KEY = "forma-activity-v1";
export const GOALS_KEY = "forma-goals-v1";
export type Goals = { examName: string; examDate: string; dailyGoal: number };
export const defaultGoals: Goals = { examName: "", examDate: "", dailyGoal: 20 };

/** Count answered questions/cards for today. Safe to call from anywhere. */
export function logActivity(n = 1) {
  if (n <= 0) return;
  const all = read<Record<string, number>>(ACTIVITY_KEY, {});
  const k = dayKey();
  all[k] = (all[k] || 0) + n;
  write(ACTIVITY_KEY, all);
}
/** Consecutive days with any activity, ending today (or yesterday, if today is still empty). */
export function streakOf(activity: Record<string, number>, today = dayKey()) {
  let day = activity[today] ? today : addDays(today, -1);
  let n = 0;
  while (activity[day]) {
    n++;
    day = addDays(day, -1);
  }
  return n;
}

// ---- spaced repetition (Leitner boxes) -----------------------------------------
export const SRS_KEY = "forma-srs-v1";
export const INTERVALS = [0, 1, 3, 7, 14, 30, 60];
export type SrsKind = "structure" | "landmark" | "term" | "exam";
export type SrsEntry = {
  kind: SrsKind;
  box: number;
  due: string;
  seen: number;
  lapses: number;
  added: string;
  /** text cards (course terms, exam questions) carry their own content */
  front?: string;
  back?: string;
  label?: string;
};
export type Srs = Record<string, SrsEntry>;
export type Rating = "again" | "hard" | "good" | "easy";

export const structureKey = (modelId: string) => `s:${modelId}`;
export const landmarkKey = (id: string) => `l:${id}`;

export function addCards(
  items: { key: string; kind: SrsKind; front?: string; back?: string; label?: string }[],
) {
  const srs = read<Srs>(SRS_KEY, {});
  const today = dayKey();
  let added = 0;
  for (const i of items) {
    if (srs[i.key]) continue;
    srs[i.key] = {
      kind: i.kind,
      box: 0,
      due: today,
      seen: 0,
      lapses: 0,
      added: today,
      front: i.front,
      back: i.back,
      label: i.label,
    };
    added++;
  }
  if (added) write(SRS_KEY, srs);
  return added;
}
export function rate(key: string, rating: Rating) {
  const srs = read<Srs>(SRS_KEY, {});
  const e = srs[key];
  if (!e) return;
  const today = dayKey();
  e.seen++;
  if (rating === "again") {
    e.box = 0;
    e.lapses++;
    e.due = today;
  } else {
    e.box = Math.min(
      INTERVALS.length - 1,
      rating === "hard" ? Math.max(1, e.box) : e.box + (rating === "easy" ? 2 : 1),
    );
    e.due = addDays(today, rating === "hard" ? 1 : INTERVALS[e.box]);
  }
  srs[key] = e;
  write(SRS_KEY, srs);
  logActivity(1);
}
export const isDue = (e: SrsEntry, today = dayKey()) => e.due <= today;
export function removeCards(keys: string[]) {
  const srs = read<Srs>(SRS_KEY, {});
  for (const k of keys) delete srs[k];
  write(SRS_KEY, srs);
}
export const readSrs = () => read<Srs>(SRS_KEY, {});
