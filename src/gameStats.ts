import { useShared, dayKey, addCards, logActivity, structureKey, landmarkKey } from "./studyStore";

export type Difficulty = "easy" | "normal" | "hard";
export type ModeId =
  | "find"
  | "name"
  | "function"
  | "memory"
  | "tissue"
  | "landmark"
  | "speed"
  | "survival"
  | "labels"
  | "odd"
  | "match"
  | "practical";

export type ModeInfo = {
  id: ModeId;
  title: string;
  text: string;
  group: "On the 3D model" | "Quick thinking" | "Exam practice";
  /** what the checklist must supply */
  needs: "structures" | "bones" | "muscles" | "none";
  min: number;
  max: number;
};

export const MODES: ModeInfo[] = [
  { id: "find", title: "Find & click", text: "Click the named structure on the model. Hints after a miss.", group: "On the 3D model", needs: "structures", min: 2, max: 40 },
  { id: "name", title: "Name it", text: "See one structure on its own and name it.", group: "On the 3D model", needs: "structures", min: 2, max: 40 },
  { id: "landmark", title: "Landmarks", text: "Name the pulsing dot on a bone.", group: "On the 3D model", needs: "bones", min: 4, max: 400 },
  { id: "labels", title: "Colour the labels", text: "Five structures in five colours: drag each name to its colour.", group: "On the 3D model", needs: "structures", min: 5, max: 40 },
  { id: "odd", title: "Odd one out", text: "Four structures are coloured. Which doesn't belong?", group: "On the 3D model", needs: "structures", min: 6, max: 40 },
  { id: "speed", title: "Speed round", text: "60 seconds of find & click. How many can you get?", group: "Quick thinking", needs: "structures", min: 3, max: 40 },
  { id: "survival", title: "Survival", text: "Three lives. Every wrong click costs one.", group: "Quick thinking", needs: "structures", min: 3, max: 40 },
  { id: "function", title: "Match function", text: "Pick what the structure does.", group: "Quick thinking", needs: "structures", min: 2, max: 40 },
  { id: "memory", title: "Memory", text: "Flip cards to pair identical names.", group: "Quick thinking", needs: "structures", min: 2, max: 10 },
  { id: "tissue", title: "Tissues", text: "Identify tissue diagrams linked to your picks.", group: "Quick thinking", needs: "structures", min: 2, max: 40 },
  { id: "match", title: "Muscle match", text: "Pair muscles with their origin, insertion, action or nerve.", group: "Exam practice", needs: "muscles", min: 4, max: 60 },
  { id: "practical", title: "Lab practical", text: "Timed stations like a real practical. Type each answer; results at the end.", group: "Exam practice", needs: "structures", min: 4, max: 40 },
];
export const modeInfo = (id: ModeId) => MODES.find((m) => m.id === id)!;

export const difficulties: { id: Difficulty; label: string; text: string }[] = [
  { id: "easy", label: "Easy", text: "Clues shown, free hints, fewer choices" },
  { id: "normal", label: "Normal", text: "No clues, three hints" },
  { id: "hard", label: "Hard", text: "Typed answers, 25 s a question, no hints" },
];

// ---- settings ---------------------------------------------------------------
export type GameSettings = { light: boolean; colorblind: boolean; sound: boolean; haptics: boolean };
export const SETTINGS_KEY = "forma-game-settings-v1";
export const defaultSettings: GameSettings = { light: false, colorblind: false, sound: true, haptics: true };
export const useGameSettings = () => useShared<GameSettings>(SETTINGS_KEY, defaultSettings);
export function readSettings(): GameSettings {
  try {
    return { ...defaultSettings, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}") };
  } catch {
    return defaultSettings;
  }
}

// ---- stats ------------------------------------------------------------------
export type Mastery = { right: number; wrong: number; last: string; streak: number };
export type Playlist = {
  id: string;
  name: string;
  mode: ModeId;
  difficulty: Difficulty;
  seconds: number;
  region: string;
  collectionId: string;
  ids: string[];
};
export type Setup = {
  mode: ModeId;
  difficulty: Difficulty;
  seconds: number;
  region: string;
  collectionId: string;
  ids: string[];
  players: 1 | 2;
  label?: string;
  /** stations for the lab practical */
  stations?: number;
  stationSeconds?: number;
  /** set for the daily challenge (the date it was made for) */
  daily?: string;
};
export type GameStats = {
  mastery: Record<string, Mastery>;
  bests: Partial<Record<ModeId, { points: number; accuracy: number; date: string }>>;
  daily: Record<string, { points: number; correct: number; total: number }>;
  playlists: Playlist[];
  last?: Setup;
  totalPoints: number;
};
export const STATS_KEY = "forma-game-stats-v1";
export const emptyStats: GameStats = { mastery: {}, bests: {}, daily: {}, playlists: [], totalPoints: 0 };
export const useGameStats = () => useShared<GameStats>(STATS_KEY, emptyStats);
export function readStats(): GameStats {
  try {
    return { ...emptyStats, ...JSON.parse(localStorage.getItem(STATS_KEY) || "{}") };
  } catch {
    return emptyStats;
  }
}
function writeStats(s: GameStats) {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(s));
  } catch {
    window.dispatchEvent(new CustomEvent("forma-storage-error"));
  }
  window.dispatchEvent(new CustomEvent("forma-study-change", { detail: STATS_KEY }));
}
export function updateStats(fn: (s: GameStats) => GameStats) {
  writeStats(fn(readStats()));
}

/** 0 to 3 stars from how often you got a structure right, and how recently you missed it. */
export function stars(m?: Mastery) {
  if (!m) return 0;
  const total = m.right + m.wrong;
  if (m.right >= 6 && m.wrong <= m.right * 0.25 && m.streak >= 3) return 3;
  if (m.right >= 3 && m.wrong <= m.right * 0.5) return 2;
  return total && m.right >= 1 ? 1 : 0;
}

/** Record one answer. A miss also puts the item into the Review today deck. */
export function recordAnswer(key: string | undefined, correct: boolean) {
  if (!key) return;
  updateStats((s) => {
    const m = s.mastery[key] || { right: 0, wrong: 0, last: "", streak: 0 };
    s.mastery = {
      ...s.mastery,
      [key]: {
        right: m.right + (correct ? 1 : 0),
        wrong: m.wrong + (correct ? 0 : 1),
        last: dayKey(),
        streak: correct ? m.streak + 1 : 0,
      },
    };
    return s;
  });
  if (!correct)
    addCards([
      key.startsWith("l:")
        ? { key, kind: "landmark" as const }
        : { key, kind: "structure" as const },
    ]);
}
export { structureKey, landmarkKey, logActivity };

// ---- scoring ------------------------------------------------------------------
const multiplier = { easy: 0.6, normal: 1, hard: 1.5 } as const;
export function pointsFor(opts: {
  difficulty: Difficulty;
  hints: number;
  /** seconds taken */
  took: number;
  /** seconds allowed for a full speed bonus */
  par: number;
  streak: number;
}) {
  const speed = Math.max(0, Math.round(50 * (1 - Math.min(1, opts.took / Math.max(1, opts.par)))));
  const base = (100 + speed - opts.hints * 25) * multiplier[opts.difficulty];
  const combo = Math.min(2, 1 + opts.streak * 0.1);
  return Math.max(10, Math.round(base * combo));
}

// ---- daily challenge ------------------------------------------------------------
export function seeded(seed: string) {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    return ((h >>> 0) % 1_000_000) / 1_000_000;
  };
}
export function seededShuffle<T>(items: T[], seed: string) {
  const rnd = seeded(seed);
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---- small feedback helpers -----------------------------------------------------
let audio: AudioContext | null = null;
export function beep(kind: "right" | "wrong" | "done") {
  const s = readSettings();
  if (s.haptics && "vibrate" in navigator)
    try {
      navigator.vibrate(kind === "wrong" ? [60, 40, 60] : 25);
    } catch {
      /* not supported */
    }
  if (!s.sound) return;
  try {
    audio = audio || new AudioContext();
    const o = audio.createOscillator();
    const g = audio.createGain();
    o.type = "sine";
    const freqs = kind === "right" ? [660, 880] : kind === "wrong" ? [220, 170] : [520, 660, 780];
    const t = audio.currentTime;
    freqs.forEach((f, i) => o.frequency.setValueAtTime(f, t + i * 0.09));
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.12, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09 * freqs.length + 0.1);
    o.connect(g).connect(audio.destination);
    o.start(t);
    o.stop(t + 0.09 * freqs.length + 0.15);
  } catch {
    /* audio unavailable */
  }
}
