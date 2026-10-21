import { useEffect, useMemo, useState } from "react";
import { modelParts, getModelStudy, type ModelPart } from "./modelCatalog";
import { regionParts, associatedTissue } from "./atlasDomain";
import { tissues } from "./content";
import { useStored } from "./storage";
import type { StudyCollection } from "./studyCollections";
import { setColourBlind } from "./tissueColors";
import { LandmarkGame } from "./LandmarkGame";
import { landmarks as allLandmarks } from "./landmarkCatalog";
import { GameSetup, MAX_STRUCTURES } from "./GameSetup";
import { GameRunner, type RunResult } from "./GameRunner";
import {
  logActivity,
  modeInfo,
  updateStats,
  useGameSettings,
  useGameStats,
  type Difficulty,
  type ModeId,
  type Playlist,
  type Setup,
} from "./gameStats";
import { dayKey } from "./studyStore";
import { canPlayOdd, dailyRoster, weakestIds } from "./gameRounds";

const byId = new Map(modelParts.map((m) => [m.id, m]));
type GameResult = {
  id: string;
  date: string;
  mode: string;
  score: number;
  total: number;
  missed: string[];
  collection?: string;
  points?: number;
  difficulty?: Difficulty;
};
export function gamePool(region: string, system: string, collection?: StudyCollection) {
  const allowed = collection ? new Set(collection.ids) : null;
  const regional = region ? new Set(regionParts(region).map((m) => m.id)) : null;
  return modelParts.filter(
    (m) =>
      !m.parentId &&
      m.layer !== "attachment" &&
      m.layer !== "skin" &&
      (!allowed || allowed.has(m.id)) &&
      (!regional || regional.has(m.id)) &&
      (!system || m.system === system),
  );
}

export function StudyGames({
  collections,
  initialCollection,
}: {
  collections: StudyCollection[];
  initialCollection?: string;
}) {
  const [mode, setMode] = useState<ModeId>("find");
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");
  const [players, setPlayers] = useState<1 | 2>(1);
  const [region, setRegion] = useState(initialCollection ? "" : "Knee");
  const [collectionId, setCollectionId] = useState(initialCollection || "");
  const [checkedIds, setCheckedIds] = useState<string[]>([]);
  const [seconds, setSeconds] = useState("0");
  const [phase, setPhase] = useState<"setup" | "play" | "results">("setup");
  const [setup, setSetup] = useState<Setup | null>(null);
  const [roster, setRoster] = useState<ModelPart[]>([]);
  const [result, setResult] = useState<RunResult | null>(null);
  const [newBest, setNewBest] = useState(false);
  const [message, setMessage] = useState("");
  const [runKey, setRunKey] = useState(0);
  const [stats] = useGameStats();
  const [settings, setSettings] = useGameSettings();
  const [history, setHistory] = useStored<GameResult[]>("forma-game-results", []);
  const collection = collections.find((c) => c.id === collectionId);
  const pool = useMemo(() => gamePool(region, "", collection), [region, collection]);

  useEffect(() => {
    setCheckedIds(collection ? pool.slice(0, MAX_STRUCTURES).map((m) => m.id) : []);
  }, [pool]);
  useEffect(() => {
    setColourBlind(settings.colorblind);
  }, [settings.colorblind]);

  function begin(s: Setup, list: ModelPart[]) {
    setSetup(s);
    setRoster(list);
    setResult(null);
    setMessage("");
    setRunKey((k) => k + 1);
    setPhase("play");
  }

  /** Validate the ticked structures for the chosen game and start it. */
  function start(over?: Partial<Setup>, only?: string[]) {
    const m = over?.mode || mode;
    const info = modeInfo(m);
    const ids = only || over?.ids || checkedIds;
    const s: Setup = {
      mode: m,
      difficulty,
      seconds: +seconds,
      region,
      collectionId,
      ids,
      players,
      ...over,
    } as Setup;
    if (m === "landmark") {
      const bones = ids.filter((id) => allLandmarks.some((l) => l.modelId === id));
      if (allLandmarks.filter((l) => bones.includes(l.modelId)).length < 4) {
        setMessage(
          "Tick bones that have at least four mapped landmark points in total, such as the humerus, tibia, mandible or frontal bone.",
        );
        return;
      }
      begin({ ...s, ids: bones }, bones.map((id) => byId.get(id)!).filter(Boolean));
      return;
    }
    const pickable = (only || over?.ids) ? ids.map((id) => byId.get(id)).filter(Boolean) as ModelPart[] : pool.filter((x) => ids.includes(x.id));
    let candidate = pickable.filter((x) => m !== "function" || getModelStudy(x).detailLevel !== "identification");
    if (m === "match") candidate = candidate.filter((x) => x.layer === "muscles");
    if (m === "tissue") {
      const unsupported = candidate.filter((x) => !tissues.some((t) => t.id === associatedTissue(x)));
      if (unsupported.length) {
        setMessage(
          `No matched tissue entry for: ${unsupported.map((x) => x.name).join(", ")}. Uncheck these or choose a name/find activity.`,
        );
        return;
      }
      if (new Set(candidate.map(associatedTissue)).size < 2) {
        setMessage("Choose a scope with at least two associated tissue types.");
        return;
      }
    }
    if (candidate.length < info.min) {
      setMessage(
        m === "function"
          ? "Choose at least two available structures. Function matching requires reviewed functional notes."
          : `Choose at least ${info.min} structures for ${info.title}.`,
      );
      return;
    }
    if (m === "function" && new Set(candidate.map((x) => getModelStudy(x).function)).size < 2) {
      setMessage("Choose a scope with at least two different reviewed functions.");
      return;
    }
    if (candidate.length > info.max) {
      setMessage(
        m === "memory"
          ? `Memory matching supports up to ${info.max} checked structures. Uncheck extras or choose another game.`
          : `Choose up to ${info.max} structures for a focused session.`,
      );
      return;
    }
    if (m === "odd" && !canPlayOdd(candidate)) {
      setMessage("Odd one out needs at least three structures of one tissue plus one of another.");
      return;
    }
    const list = [...candidate].sort(() => Math.random() - 0.5);
    begin({ ...s, ids: list.map((x) => x.id) }, list);
  }

  function finished(r: RunResult) {
    if (!setup) return;
    const info = modeInfo(setup.mode);
    const correct = r.answers.filter((a) => a.correct).length;
    const missed = r.answers.filter((a) => !a.correct && byId.has(a.id)).map((a) => a.id);
    setHistory((old) =>
      [
        {
          id: crypto.randomUUID(),
          date: new Date().toISOString(),
          mode: info.title,
          score: correct,
          total: r.answers.length,
          missed,
          collection: collection?.name,
          points: r.points,
          difficulty: setup.difficulty,
        },
        ...old,
      ].slice(0, 100),
    );
    const prev = stats.bests[setup.mode];
    const acc = r.answers.length ? correct / r.answers.length : 0;
    const better = r.answers.length >= 3 && (!prev || r.points > prev.points);
    setNewBest(better && !!prev);
    updateStats((s) => ({
      ...s,
      totalPoints: s.totalPoints + r.points,
      last: setup,
      bests: better
        ? { ...s.bests, [setup.mode]: { points: r.points, accuracy: acc, date: dayKey() } }
        : s.bests,
      daily: setup.daily
        ? { ...s.daily, [setup.daily]: { points: r.points, correct, total: r.answers.length } }
        : s.daily,
    }));
    logActivity(r.answers.length);
    setResult(r);
    setPhase("results");
  }

  // ---- quick starts -------------------------------------------------------------------
  const today = dayKey();
  const valid = useMemo(() => new Set(modelParts.map((m) => m.id)), []);
  const weak = weakestIds(stats, valid, 10);
  const quick = [
    {
      label: "Continue",
      sub: stats.last ? `${modeInfo(stats.last.mode).title} · ${stats.last.ids.length} structures` : "Nothing played yet",
      disabled: !stats.last,
      onClick: () => stats.last && start({ ...stats.last }, stats.last.ids),
    },
    {
      label: "Daily challenge",
      sub: stats.daily[today]
        ? `Done today: ${stats.daily[today].correct}/${stats.daily[today].total} · ${stats.daily[today].points} pts. Play again`
        : "Ten bones, muscles and ligaments, the same for everyone today",
      onClick: () => {
        const list = dailyRoster(today, gamePool("", ""));
        start({ mode: "find", difficulty: "normal", daily: today, label: "Daily challenge", players: 1 }, list.map((m) => m.id));
      },
    },
    {
      label: "My 10 weakest",
      sub: weak.length >= 3 ? `From your misses · ${weak.length} structures` : "Play a few games to build this list",
      disabled: weak.length < 3,
      onClick: () => start({ mode: "find", label: "My weakest" }, weak),
    },
    {
      label: "Speed round",
      sub: "60 seconds on what's ticked",
      disabled: checkedIds.length < 3,
      onClick: () => start({ mode: "speed" }),
    },
  ];

  function savePlaylist(name: string) {
    const p: Playlist = {
      id: crypto.randomUUID(),
      name,
      mode,
      difficulty,
      seconds: +seconds,
      region,
      collectionId,
      ids: checkedIds,
    };
    updateStats((s) => ({ ...s, playlists: [...s.playlists, p] }));
  }
  function playPlaylist(p: Playlist) {
    setMode(p.mode);
    setDifficulty(p.difficulty);
    setSeconds(String(p.seconds));
    setRegion(p.region);
    setCollectionId(p.collectionId);
    start({ mode: p.mode, difficulty: p.difficulty, seconds: p.seconds, region: p.region, collectionId: p.collectionId }, p.ids);
  }

  const answers = result?.answers || [];
  const missedIds = [...new Set(answers.filter((a) => !a.correct && byId.has(a.id)).map((a) => a.id))];
  const best = setup ? stats.bests[setup.mode] : undefined;

  return (
    <section className="learning-page games-page">
      <p className="eyebrow">PRACTICE WITH A PURPOSE</p>
      <h1>Study games</h1>
      {phase === "setup" && <p>Pick what to study, tick the structures, then choose a game.</p>}
      {phase === "setup" && (
        <GameSetup
          collections={collections}
          collectionId={collectionId}
          setCollectionId={setCollectionId}
          region={region}
          setRegion={setRegion}
          pool={pool}
          checkedIds={checkedIds}
          setCheckedIds={setCheckedIds}
          mode={mode}
          setMode={(m) => {
            setMode(m);
            setMessage("");
          }}
          seconds={seconds}
          setSeconds={setSeconds}
          onStart={() => start()}
          message={message}
          difficulty={difficulty}
          setDifficulty={setDifficulty}
          players={players}
          setPlayers={setPlayers}
          stats={stats}
          settings={settings}
          setSettings={setSettings}
          quick={quick}
          onPlaylist={playPlaylist}
          onDeletePlaylist={(id) => updateStats((s) => ({ ...s, playlists: s.playlists.filter((p) => p.id !== id) }))}
          onSavePlaylist={savePlaylist}
        />
      )}
      {phase === "play" && setup && setup.mode === "landmark" && (
        <LandmarkGame boneIds={roster.map((m) => m.id)} seconds={+setup.seconds} onExit={() => setPhase("setup")} />
      )}
      {phase === "play" && setup && setup.mode !== "landmark" && (
        <GameRunner key={runKey} setup={setup} roster={roster} settings={settings} onFinish={finished} />
      )}
      {phase === "results" && result && setup && (
        <article className="learning-card game-results">
          <h2>Session review</h2>
          {setup.label && <p className="gs-total">{setup.label}</p>}
          <div className="gr-stats">
            <div>
              <b>{result.points}</b>
              <span>points</span>
            </div>
            <div>
              <b>
                {answers.filter((a) => a.correct).length}/{answers.length}
              </b>
              <span>correct</span>
            </div>
            <div>
              <b>{result.bestStreak}</b>
              <span>best streak</span>
            </div>
            <div>
              <b>{Math.floor(result.seconds / 60)}:{String(result.seconds % 60).padStart(2, "0")}</b>
              <span>time</span>
            </div>
          </div>
          <p>
            {answers.filter((a) => a.correct).length} correct from {answers.length} answered. Unattempted or blocked
            targets are not marked wrong.
            {result.ended === "lives" && " You ran out of lives."}
            {result.ended === "time" && " Time was up."}
          </p>
          {setup.players === 2 && (
            <p className="gs-total">
              Player 1: {result.scores[0]} · Player 2: {result.scores[1]} ·{" "}
              {result.scores[0] === result.scores[1]
                ? "A tie"
                : `Player ${result.scores[0] > result.scores[1] ? 1 : 2} wins`}
            </p>
          )}
          {newBest && best && <p className="gs-total">New personal best for {modeInfo(setup.mode).title}.</p>}
          {setup.daily && <p className="gs-total">Daily challenge saved for {setup.daily}.</p>}
          <h3>Every answer</h3>
          <ul className="gr-list">
            {answers.map((a, i) => (
              <li key={i} className={a.correct ? "ok" : "bad"}>
                <b aria-hidden="true">{a.correct ? "✓" : "✗"}</b>
                <span>
                  {a.label}
                  {!a.correct && a.given ? <em> · you said {a.given}</em> : null}
                  {!a.correct && a.detail ? <small>{a.detail}</small> : null}
                </span>
                <i>{a.points ? `+${a.points}` : ""}</i>
              </li>
            ))}
          </ul>
          <h3>Missed structures</h3>
          {missedIds.length ? (
            <>
              <ul>
                {missedIds.map((id) => (
                  <li key={id}>
                    {byId.get(id)?.name}: {getModelStudy(byId.get(id)!).function}
                  </li>
                ))}
              </ul>
              <p className="gs-total">These were added to Review today in the Study tab.</p>
            </>
          ) : (
            <p>No missed answers.</p>
          )}
          <div className="gr-actions">
            <button
              disabled={missedIds.length < 2}
              onClick={() => start({ ...setup, mode: setup.mode === "practical" ? "name" : setup.mode, daily: undefined }, missedIds)}
            >
              Practice mistakes
            </button>
            <button className="primary" onClick={() => start({ ...setup, daily: setup.daily }, setup.ids)}>
              Play again
            </button>
            <button onClick={() => setPhase("setup")}>Back to games</button>
          </div>
          <small>Two distinct missed structures are needed for a scoped challenge; a single mistake is reviewed above.</small>
        </article>
      )}
      <details>
        <summary>{history.length} saved game sessions</summary>
        {history.map((r) => (
          <p key={r.id}>
            {new Date(r.date).toLocaleDateString()} · {r.mode} · {r.score}/{r.total}
            {r.points ? ` · ${r.points} pts` : ""}
            {r.difficulty ? ` · ${r.difficulty}` : ""}
            {r.collection ? ` · ${r.collection}` : ""}
          </p>
        ))}
      </details>
    </section>
  );
}
