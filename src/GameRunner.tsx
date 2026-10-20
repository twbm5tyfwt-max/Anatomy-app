import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnatomyScene, defaultLayers, type SceneApi } from "./AnatomyScene";
import { defaultAppearance } from "./Appearance";
import { getModelStudy, modelParts, type ModelPart } from "./modelCatalog";
import { associatedTissue } from "./atlasDomain";
import { tissues } from "./content";
import { TissueDiagram } from "./TissueDiagram";
import { tissuePalette } from "./tissueColors";
import {
  beep,
  modeInfo,
  pointsFor,
  recordAnswer,
  seeded,
  seededShuffle,
  structureKey,
  type GameSettings,
  type Setup,
} from "./gameStats";
import { distractors, oddPalette, oddRound, typedMatches } from "./gameRounds";
import { muscleQuestions, muscleRows } from "./MuscleTables";
import { displayName } from "./modelDisplay";
import type { Question } from "./quiz";
import "./games.css";

const byId = new Map(modelParts.map((m) => [m.id, m]));
const kids = (id: string) => [id, ...modelParts.filter((x) => x.parentId === id).map((x) => x.id)];

export type Ans = {
  id: string;
  label: string;
  correct: boolean;
  points: number;
  hints: number;
  player: number;
  given?: string;
  detail?: string;
};
export type RunResult = {
  answers: Ans[];
  points: number;
  scores: [number, number];
  seconds: number;
  ended: "manual" | "time" | "lives" | "done";
  bestStreak: number;
};

/** Progressive, name-free hints for the find games. */
export function findHint(m: ModelPart, n: number) {
  const side = /^left |\bleft\b/i.test(m.name)
    ? "left"
    : /^right |\bright\b/i.test(m.name)
      ? "right"
      : "midline";
  const tissue = tissuePalette[m.layer || "organs"]?.label.toLowerCase() || "structure";
  if (n === 1)
    return `it is a ${tissue} ${side === "midline" ? "on or near the midline" : "on the " + side + " side"}.`;
  const center = (x: ModelPart) => [0, 1, 2].map((i) => (x.bounds[0][i] + x.bounds[1][i]) / 2);
  const c = center(m);
  const fam = m.name.replace(/^(left|right) /i, "").toLowerCase();
  const near = modelParts
    .filter(
      (x) =>
        !x.parentId &&
        x.id !== m.id &&
        ["bones", m.layer || "bones"].includes(x.layer || "") &&
        !x.name.toLowerCase().includes(fam) &&
        (side === "midline" || new RegExp(side, "i").test(x.name) || !/left|right/i.test(x.name)),
    )
    .map((x) => ({ name: x.name, d: Math.hypot(...center(x).map((v, i) => v - c[i])) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, 2)
    .map((x) => x.name);
  return near.length
    ? `it sits right next to the ${near.join(" and the ")}.`
    : "look near the structures in this region.";
}

export function GameRunner({
  setup,
  roster,
  settings,
  onFinish,
}: {
  setup: Setup;
  roster: ModelPart[];
  settings: GameSettings;
  onFinish: (r: RunResult) => void;
}) {
  const mode = setup.mode;
  const diff = setup.difficulty;
  const two = setup.players === 2;
  const clickMode = mode === "find" || mode === "speed" || mode === "survival";
  const eligibleMode = clickMode || mode === "practical";
  const sceneMode = eligibleMode || mode === "name" || mode === "function" || mode === "odd" || mode === "labels";
  const total = mode === "speed" ? 60 : +setup.seconds;
  const perQ =
    mode === "practical"
      ? setup.stationSeconds || (diff === "easy" ? 60 : diff === "hard" ? 30 : 45)
      : diff === "hard" && mode !== "memory" && mode !== "tissue" && mode !== "speed"
        ? 25
        : 0;
  const stations = mode === "practical" ? Math.min(setup.stations || 10, roster.length) : 0;

  const [round, setRound] = useState(0);
  const [targetId, setTargetId] = useState(roster[0]?.id || "");
  const [answers, setAnswers] = useState<Ans[]>([]);
  const [score, setScore] = useState(0);
  const [scores, setScores] = useState<[number, number]>([0, 0]);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [lives, setLives] = useState(3);
  const [misses, setMisses] = useState(0);
  const [hintN, setHintN] = useState(0);
  const [findMsg, setFindMsg] = useState("");
  const [feedback, setFeedback] = useState("");
  const [eligible, setEligible] = useState<string[]>([]);
  const [sceneReady, setSceneReady] = useState(false);
  const [interacting, setInteracting] = useState(false);
  const [paused, setPaused] = useState(false);
  const [pageActive, setPageActive] = useState(!document.hidden);
  const [remaining, setRemaining] = useState(total);
  const [qLeft, setQLeft] = useState(perQ);
  const [typed, setTyped] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [qElapsed, setQElapsed] = useState(0);
  const [turn, setTurn] = useState(0);
  const [toast, setToast] = useState("");
  const api = useRef<SceneApi | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const finishedRef = useRef(false);
  const target = byId.get(targetId);
  const study = target ? getModelStudy(target) : null;

  // ---- per-mode round data -----------------------------------------------------
  const ids = useMemo(() => roster.flatMap((m) => kids(m.id)), [roster]);
  const odd = useMemo(
    () => (mode === "odd" ? oddRound(roster, `${setup.daily || "x"}-${round}-${roster.length}`) : null),
    [mode, roster, round, setup.daily],
  );
  const labelParts = useMemo(
    () => (mode === "labels" ? seededShuffle(roster, `lab-${round}-${roster.length}`).slice(0, 5) : []),
    [mode, roster, round],
  );
  const [slots, setSlots] = useState<(string | null)[]>([null, null, null, null, null]);
  const [chip, setChip] = useState("");
  const [checked, setChecked] = useState(false);
  const roundIds = useMemo(() => {
    if (mode === "odd" && odd) return odd.parts.flatMap((m) => kids(m.id));
    if (mode === "labels") return labelParts.flatMap((m) => kids(m.id));
    if (mode === "name" || mode === "function") return target ? kids(target.id) : [];
    return ids;
  }, [mode, odd, labelParts, target, ids]);
  const colors = useMemo(() => {
    const out: Record<string, string> = {};
    const parts = mode === "odd" && odd ? odd.parts : mode === "labels" ? labelParts : [];
    parts.forEach((m, i) => kids(m.id).forEach((id) => (out[id] = oddPalette[i])));
    return out;
  }, [mode, odd, labelParts]);

  const rnd = useMemo(() => seeded(`${targetId}-${round}`), [targetId, round]);
  const options = useMemo(() => {
    if (!target) return [] as string[];
    const n = diff === "easy" ? 2 : 3;
    if (mode === "name") {
      return seededShuffle([target.name, ...distractors(target, roster, n, rnd)], `o-${targetId}-${round}`);
    }
    if (mode === "function") {
      const mine = getModelStudy(target).function;
      const others = [
        ...new Set(
          roster
            .filter((m) => m.id !== target.id)
            .map((m) => getModelStudy(m).function)
            .filter((f) => f && f !== mine),
        ),
      ];
      return seededShuffle([mine, ...seededShuffle(others, `f-${targetId}`).slice(0, n)], `o-${targetId}-${round}`);
    }
    if (mode === "odd" && odd) return odd.parts.map((m) => m.name);
    return [];
  }, [mode, target, roster, diff, rnd, targetId, round, odd]);

  // match: text questions from the muscle table
  const matchQs = useMemo<Question[]>(() => {
    if (mode !== "match") return [];
    const keys = new Set(roster.map((m) => displayName(m).replace(/^(right|left)\s+/i, "").toLowerCase()));
    const rows = muscleRows();
    const qs = muscleQuestions(rows, ["origin", "insertion", "actions", "innervation"], "forward", 400).filter((q) =>
      [...keys].some((k) => q.id.startsWith(`muscle-${k}-`)),
    );
    return seededShuffle(qs, "match-" + roster.length);
  }, [mode, roster]);
  const mq = matchQs[round % Math.max(matchQs.length, 1)];

  // memory
  const [memory] = useState(() =>
    seededShuffle(
      roster.flatMap((m) => [
        { id: m.id, name: m.name },
        { id: m.id, name: m.name },
      ]),
      "mem-" + Math.random(),
    ),
  );
  const [flipped, setFlipped] = useState<number[]>([]);
  const [paired, setPaired] = useState<number[]>([]);

  // tissue
  const tissuePool = useMemo(() => {
    const t = new Set(roster.map(associatedTissue));
    return tissues.filter((x) => t.has(x.id));
  }, [roster]);
  const targetTissue = tissuePool[round % Math.max(tissuePool.length, 1)];

  const choiceTotal =
    mode === "odd"
      ? roster.length
      : mode === "labels"
        ? Math.max(1, Math.floor(roster.length / 5)) * 5
        : mode === "match"
          ? matchQs.length
          : mode === "memory"
            ? roster.length
            : stations || roster.length;

  // ---- finishing -----------------------------------------------------------------
  const live = useRef({ answers, scores, bestStreak, elapsed });
  live.current = { answers, scores, bestStreak, elapsed };
  const finish = useCallback(
    (ended: RunResult["ended"], extra?: Ans[]) => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      const all = [...live.current.answers, ...(extra || [])];
      beep("done");
      onFinish({
        answers: all,
        points: all.reduce((t, a) => t + a.points, 0),
        scores: live.current.scores,
        seconds: live.current.elapsed,
        ended,
        bestStreak: live.current.bestStreak,
      });
    },
    [onFinish],
  );

  // ---- scoring ---------------------------------------------------------------------
  function record(list: Omit<Ans, "player" | "hints" | "points">[], hints = 0) {
    let s = streak;
    let gained = 0;
    let lost = 0;
    const out: Ans[] = list.map((a) => {
      const pts = a.correct
        ? pointsFor({ difficulty: diff, hints: diff === "easy" ? 0 : hints, took: qElapsed, par: 20, streak: s })
        : 0;
      s = a.correct ? s + 1 : 0;
      gained += pts;
      if (!a.correct) lost++;
      if (byId.has(a.id)) recordAnswer(structureKey(a.id), a.correct);
      return { ...a, points: pts, hints, player: turn };
    });
    setAnswers((v) => [...v, ...out]);
    setScore((v) => v + gained);
    if (two) setScores((v) => (turn ? [v[0], v[1] + gained] : [v[0] + gained, v[1]]));
    setStreak(s);
    setBestStreak((b) => Math.max(b, s));
    beep(lost ? "wrong" : "right");
    return { gained, lost };
  }

  function nextRound() {
    setFeedback("");
    setFindMsg("");
    setToast("");
    setMisses(0);
    setHintN(0);
    setTyped("");
    setChecked(false);
    setChip("");
    setSlots([null, null, null, null, null]);
    setQLeft(perQ);
    setQElapsed(0);
    setRound((n) => n + 1);
    if (two) setTurn((t) => 1 - t);
    if (roster.length) setTargetId(roster[(round + 1) % roster.length].id);
  }

  // the question is answered correctly or abandoned
  function settle(correct: boolean, given?: string) {
    if (!target) return;
    const base = {
      id: target.id,
      label: target.name,
      correct,
      given,
      detail: study?.function,
    };
    if (mode === "practical") {
      record([base]);
      if (live.current.answers.length + 1 >= stations) finish("done", []);
      else nextRound();
      return;
    }
    const { gained } = record([base], hintN);
    if (mode === "speed" || mode === "survival") {
      if (!correct && mode === "survival") {
        const l = lives - 1;
        setLives(l);
        if (l <= 0) {
          finish("lives");
          return;
        }
      }
      setToast(correct ? `${target.name} +${gained}` : `Missed: ${target.name}`);
      nextRound();
      return;
    }
    setFeedback(
      correct
        ? `Correct. +${gained} points${streak >= 2 ? ` · ${streak + 1} in a row` : ""}.`
        : given === ""
          ? `Time's up. It was the ${target.name}.`
          : `Study again: ${target.name}.`,
    );
  }

  // click-to-find
  function clicked(id: string) {
    if (!clickMode || !target || feedback || paused || !pageActive || !ready) return;
    const sel = byId.get(id)?.parentId || id;
    if (!byId.has(sel)) return;
    if (sel === targetId) {
      if (misses > 0) {
        // already counted as missed on the first wrong click
        beep("right");
        setStreak(0);
        if (mode === "find") setFeedback("Found it. It stays on your missed list so you can practice it again.");
        else {
          setToast(`Found ${target.name}`);
          nextRound();
        }
        return;
      }
      settle(true);
      return;
    }
    const n = misses + 1;
    setMisses(n);
    const name = byId.get(sel)?.name || "another structure";
    if (n === 1) {
      record([{ id: targetId, label: target.name, correct: false, detail: study?.function }]);
      if (mode === "survival") {
        const l = lives - 1;
        setLives(l);
        if (l <= 0) {
          finish("lives");
          return;
        }
      }
    } else beep("wrong");
    if (diff !== "hard") setHintN((h) => Math.max(h, Math.min(3, n)));
    setFindMsg(
      diff === "hard"
        ? `That was the ${name}, not the ${target.name}.`
        : n >= 3
          ? `That was the ${name}. The ${target.name} is now highlighted: click it.`
          : `That was the ${name}, not the ${target.name}. Hint ${n} of 3: ${findHint(target, n)}`,
    );
  }
  function hint() {
    if (!target || diff === "hard" || feedback || !clickMode) return;
    const n = Math.min(3, hintN + 1);
    setHintN(n);
    setFindMsg(
      n >= 3
        ? `The ${target.name} is now highlighted: click it.`
        : `Hint ${n} of 3: ${findHint(target, n)}`,
    );
  }
  function choose(option: string) {
    if (feedback || paused || !target) return;
    if (mode === "name") settle(option === target.name, option);
    else if (mode === "function") settle(option === study?.function, option);
    else if (mode === "odd" && odd) {
      const correct = option === odd.odd.name;
      const { gained } = record(
        [{ id: odd.odd.id, label: odd.odd.name, correct, given: option, detail: `Not a ${tissuePalette[odd.layer]?.label.toLowerCase() || odd.layer}` }],
        0,
      );
      setFeedback(
        correct
          ? `Correct. +${gained} points. The others are ${tissuePalette[odd.layer]?.label.toLowerCase() || odd.layer}; the ${odd.odd.name} is ${
              tissuePalette[odd.odd.layer || "organs"]?.label.toLowerCase() || "different"
            }.`
          : `Not quite. The odd one was the ${odd.odd.name}.`,
      );
    } else if (mode === "match" && mq) {
      const correct = option === mq.answer;
      const { gained } = record([{ id: mq.id, label: mq.prompt, correct, given: option, detail: mq.explanation }], 0);
      setFeedback(correct ? `Correct. +${gained} points.` : `Study again: ${mq.answer}`);
    }
  }
  function submitTyped() {
    if (!target || feedback || paused) return;
    settle(typedMatches(typed, target.name), typed);
  }
  function checkLabels() {
    const out = labelParts.map((m, i) => ({
      id: m.id,
      label: m.name,
      correct: slots[i] === m.id,
      given: byId.get(slots[i] || "")?.name || "",
      detail: getModelStudy(m).function,
    }));
    const { gained } = record(out, 0);
    setChecked(true);
    setFeedback(`${out.filter((o) => o.correct).length} of ${out.length} right. +${gained} points.`);
  }

  // ---- readiness / timers -----------------------------------------------------------
  const ready = !sceneMode ? true : eligibleMode ? sceneReady && eligible.includes(targetId) : sceneReady;
  const playable = !paused && pageActive && !interacting && !feedback && ready && !finishedRef.current;

  useEffect(() => {
    const change = () => setPageActive(!document.hidden);
    document.addEventListener("visibilitychange", change);
    return () => document.removeEventListener("visibilitychange", change);
  }, []);
  useEffect(() => {
    if (!playable) return;
    const t = setInterval(() => {
      setElapsed((s) => s + 1);
      setQElapsed((s) => s + 1);
      if (total) setRemaining((s) => Math.max(0, s - 1));
      if (perQ) setQLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [playable, total, perQ]);
  useEffect(() => {
    if (total && remaining === 0) finish("time");
  }, [remaining]);
  useEffect(() => {
    if (!perQ || qLeft !== 0 || feedback || !target) return;
    if (mode === "practical") settle(typedMatches(typed, target.name), typed);
    else if (mode === "name" && diff === "hard" && typed) settle(typedMatches(typed, target.name), typed);
    else if (mode === "odd" || mode === "match") {
      setFeedback("Time's up.");
      if (odd) record([{ id: odd.odd.id, label: odd.odd.name, correct: false, given: "" }]);
    } else settle(false, "");
  }, [qLeft]);

  // find: if the target is hidden behind something, ask for another one that is visible
  useEffect(() => {
    if (!eligibleMode || !eligible.length || feedback) return;
    if (!eligible.includes(targetId)) {
      const pick = roster.filter((m) => eligible.includes(m.id));
      if (pick.length) setTargetId(pick[round % pick.length].id);
    }
  }, [eligible, round, feedback]);

  // the persistent stage: refit the camera when the question changes
  useEffect(() => {
    if (!sceneReady || !api.current) return;
    if (mode === "name" || mode === "function") api.current.frame(roundIds, "front", 450);
    else if (mode === "odd" || mode === "labels") api.current.frame(roundIds, "front", 450);
  }, [sceneReady, targetId, round, mode]);

  // memory
  useEffect(() => {
    if (flipped.length !== 2) return;
    const [a, b] = flipped;
    if (memory[a]?.id === memory[b]?.id) {
      setPaired((v) => [...v, a, b]);
      setFlipped([]);
      record([{ id: memory[a].id, label: memory[a].name, correct: true }]);
    } else {
      const t = setTimeout(() => setFlipped([]), 850);
      return () => clearTimeout(t);
    }
  }, [flipped]);
  useEffect(() => {
    if (mode === "memory" && memory.length && paired.length === memory.length) finish("done");
  }, [paired]);

  // keyboard
  const keys = useRef<(e: KeyboardEvent) => void>(() => {});
  keys.current = (e) => {
    const el = e.target as HTMLElement;
    if (/INPUT|TEXTAREA|SELECT/.test(el.tagName)) return;
    if (e.key === "p" || e.key === "P") setPaused((v) => !v);
    else if (e.key === "h" || e.key === "H") hint();
    else if (e.key === "f" || e.key === "F") toggleFull();
    else if ((e.key === "Enter" || e.key === "n" || e.key === "N") && feedback) {
      if (mode === "match" && round + 1 >= matchQs.length) finish("done");
      else if (choiceTotal && answers.length >= choiceTotal && (mode === "odd" || mode === "labels")) finish("done");
      else nextRound();
    } else if (/^[1-4]$/.test(e.key) && options[+e.key - 1] && !feedback) choose(options[+e.key - 1]);
    else if (/^[1-4]$/.test(e.key) && mode === "match" && mq && !feedback) choose(mq.options[+e.key - 1]);
  };
  useEffect(() => {
    const f = (e: KeyboardEvent) => keys.current(e);
    window.addEventListener("keydown", f);
    return () => window.removeEventListener("keydown", f);
  }, []);
  function toggleFull() {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void box.current?.requestFullscreen?.().catch(() => {});
  }

  const correct = answers.filter((a) => a.correct).length;
  const typedMode = mode === "practical" || (mode === "name" && diff === "hard");
  const reveal = clickMode && !!target && (hintN >= 3 || misses >= 3);
  const progress = Math.min(1, answers.length / Math.max(1, choiceTotal));
  const prompt =
    mode === "labels"
      ? "Drag each name onto its colour"
      : mode === "odd"
        ? "Which one doesn't belong with the others?"
        : mode === "function"
          ? "Which function fits this isolated structure?"
          : mode === "name"
            ? diff === "hard"
              ? "Type the name of this isolated structure."
              : "Name this isolated structure."
            : mode === "practical"
              ? `Station ${answers.length + 1} of ${stations}: name the highlighted structure`
              : eligibleMode
                ? ready
                  ? `Find: ${target?.name}`
                  : "Preparing a visible target…"
                : "";
  const clue =
    diff === "easy" && target && (mode === "name" || mode === "find" || mode === "survival")
      ? `Clue: ${tissuePalette[target.layer || "organs"]?.label.toLowerCase()} · ${target.region || "this region"}`
      : "";

  return (
    <div className={"game-session game-hud" + (paused ? " paused" : "")} ref={box}>
      <div className="game-status">
        <strong>{modeInfo(mode).title}</strong>
        <span role="timer" aria-label="Time left">
          {total ? `${remaining}s` : "Untimed"}
          {perQ ? ` · ${qLeft}s` : ""}
        </span>
        <span>
          {correct} correct / {answers.length} answered
        </span>
        <span className="hud-score" aria-label="Score">
          {score} pts
        </span>
        {streak >= 2 && <span className="hud-streak">×{Math.min(2, 1 + streak * 0.1).toFixed(1)} · {streak} in a row</span>}
        {mode === "survival" && (
          <span className="hud-lives" aria-label={`${lives} lives left`}>
            {"♥".repeat(lives)}
            {"♡".repeat(3 - lives)}
          </span>
        )}
        {clickMode && diff !== "hard" && (
          <button onClick={hint} disabled={!!feedback || hintN >= 3} title="Hint (H)">
            Hint ({Math.max(0, 3 - hintN)} left)
          </button>
        )}
        <button onClick={() => setPaused((v) => !v)} title="Pause (P)">
          {paused ? "Resume" : "Pause"}
        </button>
        <button onClick={toggleFull} title="Full screen (F)" aria-label="Full screen">
          ⤢
        </button>
        <button onClick={() => finish("manual")}>Finish session</button>
      </div>
      <div className="hud-bar" aria-hidden="true">
        <i style={{ width: `${progress * 100}%` }} />
      </div>
      {two && (
        <p className="hud-players" role="status">
          <b className={turn === 0 ? "on" : ""}>Player 1: {scores[0]}</b>
          <b className={turn === 1 ? "on" : ""}>Player 2: {scores[1]}</b>
          <span>Player {turn + 1}'s turn</span>
        </p>
      )}
      {paused && (
        <div className="hud-pause" role="dialog" aria-label="Paused">
          <p>Paused</p>
          <button className="primary" onClick={() => setPaused(false)}>
            Resume
          </button>
        </div>
      )}

      {sceneMode && roster.length > 0 && (
        <>
          {eligibleMode || mode === "name" || mode === "function" ? (
            <ul className="tissue-legend" aria-label="Colour key">
              {[...new Set(roster.map((m) => m.layer || "organs"))].map((l) => (
                <li key={l}>
                  <i style={{ background: tissuePalette[l]?.color }} />
                  {tissuePalette[l]?.label || l}
                </li>
              ))}
            </ul>
          ) : null}
          <h2>{prompt}</h2>
          {clue && <p className="hud-clue">{clue}</p>}
          <div className="game-model" data-target-id={targetId}>
            <AnatomyScene
              key={roster.map((m) => m.id).join(",") + (settings.light ? "L" : "")}
              quiz
              light={settings.light}
              visible={[]}
              selected={reveal || mode === "practical" ? [targetId] : []}
              hidden={[]}
              isolated={eligibleMode ? null : roundIds}
              layers={defaultLayers}
              appearance={defaultAppearance}
              onlyIds={ids}
              colorOverrides={mode === "odd" || mode === "labels" ? colors : undefined}
              labels={false}
              onPickable={(p) => setEligible(p)}
              onInteracting={setInteracting}
              onSelect={clickMode ? clicked : undefined}
              onReady={(a) => {
                api.current = a;
                a.frame(eligibleMode ? ids : roundIds, "front", 0);
                setSceneReady(true);
              }}
            />
          </div>
          {toast && !feedback && <p className="hud-toast">{toast}</p>}
          {clickMode && findMsg && !feedback && (
            <p className="find-msg" role="alert">
              {findMsg}
            </p>
          )}
          {!playable && !feedback && !paused && (
            <p role="status">Paused: preparing a visible, selectable target. Rotate or reset the view if it is blocked.</p>
          )}
          {typedMode && !feedback && (
            <form
              className="hud-typed"
              onSubmit={(e) => {
                e.preventDefault();
                submitTyped();
              }}
            >
              <input
                aria-label="Your answer"
                autoFocus
                autoComplete="off"
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                placeholder="Type the structure's name"
              />
              <button className="primary" disabled={!typed.trim()}>
                {mode === "practical" ? "Lock in" : "Check"}
              </button>
            </form>
          )}
          {(mode === "name" && diff !== "hard") || mode === "function" || mode === "odd" ? (
            <div className="game-options">
              {options.map((o, i) => (
                <button
                  key={o}
                  aria-label={o}
                  disabled={!ready || !!feedback}
                  className={
                    feedback && (o === target?.name || o === study?.function || (odd && o === odd.odd.name))
                      ? "right"
                      : ""
                  }
                  onClick={() => choose(o)}
                >
                  {mode === "odd" && <i className="odd-dot" style={{ background: oddPalette[i] }} />}
                  <kbd aria-hidden="true">{i + 1}</kbd> {o}
                </button>
              ))}
            </div>
          ) : null}
          {mode === "labels" && (
            <div className="label-board">
              <div className="label-chips">
                {labelParts.map((m) => {
                  const used = slots.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      draggable={!used && !checked}
                      disabled={used || checked}
                      aria-pressed={chip === m.id}
                      onDragStart={(e) => e.dataTransfer.setData("text/plain", m.id)}
                      onClick={() => setChip(chip === m.id ? "" : m.id)}
                    >
                      {m.name}
                    </button>
                  );
                })}
              </div>
              <div className="label-slots">
                {labelParts.map((m, i) => (
                  <div
                    key={m.id}
                    className="label-slot"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      const id = e.dataTransfer.getData("text/plain");
                      if (id && !checked) setSlots((s) => s.map((v, j) => (j === i ? id : v === id ? null : v)));
                    }}
                    onClick={() => {
                      if (checked) return;
                      if (chip) {
                        setSlots((s) => s.map((v, j) => (j === i ? chip : v === chip ? null : v)));
                        setChip("");
                      } else if (slots[i]) setSlots((s) => s.map((v, j) => (j === i ? null : v)));
                    }}
                  >
                    <i style={{ background: oddPalette[i] }} />
                    <span>
                      {slots[i] ? (
                        <>
                          {byId.get(slots[i]!)?.name}
                          {checked && (slots[i] === m.id ? " ✓" : ` ✗ (${m.name})`)}
                        </>
                      ) : (
                        "drop a name here"
                      )}
                    </span>
                  </div>
                ))}
              </div>
              {!checked && (
                <button className="primary" disabled={slots.some((s) => !s)} onClick={checkLabels}>
                  Check my answers
                </button>
              )}
            </div>
          )}
        </>
      )}

      {mode === "match" && mq && (
        <>
          <h2>{mq.prompt}</h2>
          <div className="game-options">
            {mq.options.map((o, i) => (
              <button
                key={o}
                aria-label={o}
                disabled={!!feedback}
                className={feedback && o === mq.answer ? "right" : ""}
                onClick={() => choose(o)}
              >
                <kbd aria-hidden="true">{i + 1}</kbd> {o}
              </button>
            ))}
          </div>
        </>
      )}
      {mode === "match" && !mq && <p role="alert">No muscle questions could be built from this selection.</p>}

      {mode === "memory" && (
        <>
          <h2>Find the identical structure-name pairs</h2>
          <div className="memory-grid">
            {memory.map((card, i) => (
              <button
                key={i}
                aria-label={
                  paired.includes(i) ? `${card.name} matched` : flipped.includes(i) ? card.name : `Memory card ${i + 1}`
                }
                disabled={paired.includes(i) || flipped.includes(i) || flipped.length === 2 || paused}
                onClick={() => setFlipped((v) => [...v, i])}
              >
                {paired.includes(i) || flipped.includes(i) ? card.name : "?"}
              </button>
            ))}
          </div>
        </>
      )}

      {mode === "tissue" && (
        <>
          <h2>Identify this educational tissue diagram</h2>
          {targetTissue ? (
            <>
              <TissueDiagram tissue={targetTissue} labels={false} />
              <div className="game-options">
                {tissuePool.map((t) => (
                  <button
                    key={t.id}
                    disabled={!!feedback}
                    onClick={() => {
                      const ok = t.id === targetTissue.id;
                      const { gained } = record(
                        [{ id: targetTissue.id, label: targetTissue.name, correct: ok, given: t.name, detail: targetTissue.clues }],
                        0,
                      );
                      setFeedback(ok ? `Correct. +${gained} points.` : `Study again: ${targetTissue.name}. ${targetTissue.clues}`);
                    }}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <p>No associated tissue is available for this scope.</p>
          )}
        </>
      )}

      {feedback && (
        <div className="game-feedback" role="status" aria-live="polite">
          <p>{feedback}</p>
          {mode !== "match" && mode !== "tissue" && study && <p>{study.function}</p>}
          {mode === "match" && mq && <p>{mq.explanation}</p>}
          <button
            className="primary"
            onClick={() => {
              if (mode === "match" && round + 1 >= matchQs.length) finish("done");
              else if ((mode === "odd" || mode === "labels") && answers.length >= choiceTotal) finish("done");
              else nextRound();
            }}
          >
            Next challenge
          </button>
        </div>
      )}
    </div>
  );
}
