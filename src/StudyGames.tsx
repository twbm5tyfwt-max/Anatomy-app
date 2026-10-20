import { useEffect, useMemo, useState } from "react";
import { AnatomyScene, defaultLayers } from "./AnatomyScene";
import { defaultAppearance } from "./Appearance";
import { modelParts, getModelStudy, type ModelPart } from "./modelCatalog";
import { regionNames, regionParts, associatedTissue } from "./atlasDomain";
import { tissues } from "./content";
import { TissueDiagram } from "./TissueDiagram";
import { useStored } from "./storage";
import type { StudyCollection } from "./studyCollections";
const byId = new Map(modelParts.map((m) => [m.id, m]));
type GameResult = {
  id: string;
  date: string;
  mode: string;
  score: number;
  total: number;
  missed: string[];
  collection?: string;
};
export function gamePool(
  region: string,
  system: string,
  collection?: StudyCollection,
) {
  const allowed = collection ? new Set(collection.ids) : null;
  const regional = region
    ? new Set(regionParts(region).map((m) => m.id))
    : null;
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
  const [mode, setMode] = useState("Find & click");
  const [region, setRegion] = useState(initialCollection ? "" : "Skull");
  const [system, setSystem] = useState("");
  const [collectionId, setCollectionId] = useState(initialCollection || "");
  const [checkedIds, setCheckedIds] = useState<string[]>([]);
  const [scopeSearch, setScopeSearch] = useState("");
  const [seconds, setSeconds] = useState("0");
  const [running, setRunning] = useState(false);
  const collection = collections.find((c) => c.id === collectionId);
  const pool = useMemo(
    () => gamePool(region, system, collection),
    [region, system, collection],
  );
  useEffect(() => {
    setCheckedIds(pool.slice(0, 12).map((m) => m.id));
    setScopeSearch("");
  }, [pool]);
  const [roster, setRoster] = useState<ModelPart[]>([]);
  const [round, setRound] = useState(0);
  const [targetId, setTargetId] = useState("");
  const [answers, setAnswers] = useState<{ id: string; correct: boolean }[]>(
    [],
  );
  const [feedback, setFeedback] = useState("");
  const [eligible, setEligible] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [interacting, setInteracting] = useState(false);
  const [remaining, setRemaining] = useState(60);
  const [finished, setFinished] = useState(false);
  const [message, setMessage] = useState("");
  const [history, setHistory] = useStored<GameResult[]>(
    "forma-game-results",
    [],
  );
  const [memory, setMemory] = useState<{ id: string; name: string }[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [paired, setPaired] = useState<number[]>([]);
  const [pageActive, setPageActive] = useState(!document.hidden);
  const target = byId.get(targetId);
  const targetStudy = target ? getModelStudy(target) : null;
  const included = roster.flatMap((m) => [
    m.id,
    ...modelParts.filter((x) => x.parentId === m.id).map((x) => x.id),
  ]);
  const isFind = mode === "Find & click";
  const isMemory = mode === "Memory matching";
  const isTissue = mode === "Tissue identification";
  const tissuePool = useMemo(() => {
    const ids = new Set(roster.map(associatedTissue));
    return collection || region || system
      ? tissues.filter((t) => ids.has(t.id))
      : tissues;
  }, [roster, collection, region, system]);
  const targetTissue = tissuePool[round % Math.max(tissuePool.length, 1)];
  const playable =
    running &&
    !finished &&
    !feedback &&
    pageActive &&
    !interacting &&
    (!isFind || (ready && eligible.includes(targetId))) &&
    (isFind || isMemory || isTissue || ready);
  useEffect(() => {
    const change = () => setPageActive(!document.hidden);
    document.addEventListener("visibilitychange", change);
    return () => document.removeEventListener("visibilitychange", change);
  }, []);
  useEffect(() => {
    if (!playable || seconds === "0") return;
    const interval = setInterval(
      () => setRemaining((s) => Math.max(0, s - 1)),
      1000,
    );
    return () => clearInterval(interval);
  }, [playable, seconds]);
  useEffect(() => {
    if (running && !finished && seconds !== "0" && remaining === 0) finish();
  }, [remaining, running, finished]);
  useEffect(() => {
    if (!isFind || !running || finished || feedback) return;
    if (!eligible.length) {
      setReady(false);
      return;
    }
    if (!eligible.includes(targetId))
      setTargetId(eligible[round % eligible.length]);
    setReady(true);
  }, [eligible, running, round, mode, feedback]);
  useEffect(() => {
    if (flipped.length !== 2) return;
    const [a, b] = flipped;
    if (memory[a]?.id === memory[b]?.id) {
      setPaired((v) => [...v, a, b]);
      setFlipped([]);
      setAnswers((v) => [...v, { id: memory[a].id, correct: true }]);
    } else {
      const timer = setTimeout(() => setFlipped([]), 850);
      return () => clearTimeout(timer);
    }
  }, [flipped, memory]);
  useEffect(() => {
    if (running && isMemory && memory.length && paired.length === memory.length)
      finish();
  }, [paired]);
  function start(only?: string[]) {
    if (mode === "Tissue identification") {
      const unsupported = pool.filter(
        (m) =>
          (only || checkedIds).includes(m.id) &&
          !tissues.some((t) => t.id === associatedTissue(m)),
      );
      if (unsupported.length) {
        setMessage(
          `No matched tissue entry for: ${unsupported.map((m) => m.name).join(", ")}. Uncheck these or choose a name/find activity.`,
        );
        return;
      }
    }
    const candidate = pool
      .filter((m) => (only || checkedIds).includes(m.id))
      .filter(
        (m) =>
          mode !== "Structure → function" ||
          getModelStudy(m).detailLevel !== "identification",
      );
    if (candidate.length < 2) {
      setMessage(
        "Choose at least two available structures. Function matching requires reviewed functional notes.",
      );
      return;
    }
    if (
      mode === "Structure → function" &&
      new Set(candidate.map((m) => getModelStudy(m).function)).size < 2
    ) {
      setMessage(
        "Choose a scope with at least two different reviewed functions.",
      );
      return;
    }
    if (
      mode === "Tissue identification" &&
      new Set(candidate.map(associatedTissue)).size < 2
    ) {
      setMessage("Choose a scope with at least two associated tissue types.");
      return;
    }
    if (candidate.length > 24) {
      setMessage("Choose up to 24 structures for a focused session.");
      return;
    }
    if (isMemory && candidate.length > 8) {
      setMessage(
        "Memory matching supports up to 8 checked structures. Uncheck extras or choose another activity.",
      );
      return;
    }
    const shuffled = [...candidate].sort(() => Math.random() - 0.5);
    setRoster(shuffled);
    setTargetId(shuffled[0].id);
    setRound(0);
    setAnswers([]);
    setFeedback("");
    setEligible([]);
    setReady(isMemory || isTissue);
    setInteracting(false);
    setRemaining(+seconds);
    setFinished(false);
    setRunning(true);
    setMessage("");
    setPaired([]);
    setFlipped([]);
    setMemory(
      shuffled
        .flatMap((m) => [
          { id: m.id, name: m.name },
          { id: m.id, name: m.name },
        ])
        .sort(() => Math.random() - 0.5),
    );
  }
  function finish() {
    if (finished) return;
    setFinished(true);
    const r = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      mode,
      score: answers.filter((a) => a.correct).length,
      total: answers.length,
      missed: answers.filter((a) => !a.correct).map((a) => a.id),
      collection: collection?.name,
    };
    setHistory((old) => [r, ...old].slice(0, 100));
  }
  function answer(id: string) {
    if (!id || !byId.has(id)) return;
    if (
      !running ||
      finished ||
      !ready ||
      !pageActive ||
      feedback ||
      !target ||
      (isFind && !eligible.includes(targetId))
    )
      return;
    const model = byId.get(id);
    const selected = model?.parentId || id;
    const correct = selected === targetId;
    setAnswers((old) => [...old, { id: targetId, correct }]);
    setFeedback(correct ? "Correct." : `Study again: ${target.name}.`);
  }
  function next() {
    setFeedback("");
    setRound((n) => n + 1);
    setTargetId(roster[(round + 1) % roster.length].id);
    if (!isFind && !isMemory && !isTissue) setReady(false);
  }
  const options = target
    ? Array.from(
        new Set(
          [target, ...roster.filter((m) => m.id !== targetId).slice(0, 3)].map(
            (m) =>
              mode === "Structure → function"
                ? getModelStudy(m).function
                : m.name,
          ),
        ),
      ).sort()
    : [];
  return (
    <section className="learning-page games-page">
      <p className="eyebrow">PRACTICE WITH A PURPOSE</p>
      <h1>Study games</h1>
      <p>
        Choose a region or saved collection, check what you want to learn, then
        practice. Start untimed to explore at your own pace.
      </p>
      {!running || finished ? (
        <>
          <div className="learning-toolbar">
            <label>
              Activity
              <select
                aria-label="Game activity"
                value={mode}
                onChange={(e) => {
                  setMode(e.target.value);
                  if (e.target.value === "Tissue identification") {
                    setRegion("");
                    setSystem("");
                  }
                }}
              >
                {[
                  "Find & click",
                  "Structure → name",
                  "Structure → function",
                  "Memory matching",
                  "Tissue identification",
                ].map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
            </label>
            <label>
              Collection
              <select
                aria-label="Game collection"
                value={collectionId}
                onChange={(e) => setCollectionId(e.target.value)}
              >
                <option value="">Available atlas</option>
                {collections.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Region
              <select
                aria-label="Game region"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
              >
                <option value="">Any region in scope</option>
                {regionNames.map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
            </label>
            <label>
              System
              <select
                aria-label="Game system"
                value={system}
                onChange={(e) => setSystem(e.target.value)}
              >
                <option value="">All in scope</option>
                {[
                  "skeletal",
                  "muscular",
                  "nervous",
                  "respiratory",
                  "cardiovascular",
                  "lymphatic",
                ].map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
            </label>
            <label>
              Timer
              <select
                aria-label="Game timer"
                value={seconds}
                onChange={(e) => setSeconds(e.target.value)}
              >
                <option value="0">Untimed</option>
                <option value="60">60 seconds</option>
                <option value="120">120 seconds</option>
              </select>
            </label>
            <button className="primary" onClick={() => start()}>
              Start game
            </button>
          </div>
          <section
            className="game-scope-checklist"
            aria-label="Choose structures to study"
          >
            <div className="game-scope-heading">
              <div>
                <p className="eyebrow">YOUR STUDY CHECKLIST</p>
                <h2>What do you want to practice?</h2>
                <p>
                  {checkedIds.length} checked · choose 2–24 structures, or 2–8
                  for memory. Your checks define the session.
                </p>
              </div>
              <button
                onClick={() =>
                  setCheckedIds(pool.slice(0, 24).map((m) => m.id))
                }
              >
                Select first 24
              </button>
              <button onClick={() => setCheckedIds([])}>Clear checklist</button>
            </div>
            <input
              aria-label="Search study checklist"
              value={scopeSearch}
              onChange={(e) => setScopeSearch(e.target.value)}
              placeholder="Find a bone, muscle or ligament…"
            />
            <div className="game-checklist-groups">
              {[
                "Bones",
                "Muscles",
                "Ligaments & connective",
                "Organs, vessels & nerves",
              ].map((group, i) => {
                const items = pool.filter((m) =>
                  i === 0
                    ? m.layer === "bones"
                    : i === 1
                      ? m.layer === "muscles"
                      : i === 2
                        ? [
                            "ligaments",
                            "tendons",
                            "cartilage",
                            "fascia",
                            "capsules",
                            "bursae",
                          ].includes(m.layer || "")
                        : ![
                            "bones",
                            "muscles",
                            "ligaments",
                            "tendons",
                            "cartilage",
                            "fascia",
                            "capsules",
                            "bursae",
                          ].includes(m.layer || ""),
                );
                if (!items.length) return null;
                const filtered = items.filter((m) =>
                  m.name.toLowerCase().includes(scopeSearch.toLowerCase()),
                );
                return (
                  <details key={group} open>
                    <summary>
                      {group} ·{" "}
                      {items.filter((m) => checkedIds.includes(m.id)).length}/
                      {items.length}
                    </summary>
                    <div>
                      {filtered.slice(0, 250).map((m) => (
                        <label key={m.id}>
                          <input
                            type="checkbox"
                            checked={checkedIds.includes(m.id)}
                            onChange={(e) =>
                              setCheckedIds((v) =>
                                e.target.checked
                                  ? [...v, m.id]
                                  : v.filter((id) => id !== m.id),
                              )
                            }
                          />
                          {m.name}
                        </label>
                      ))}
                      {filtered.length > 250 && (
                        <p>
                          Search to narrow the remaining {filtered.length - 250}{" "}
                          entries.
                        </p>
                      )}
                    </div>
                  </details>
                );
              })}
            </div>
            <button className="primary" onClick={() => start()}>
              Practice checked structures
            </button>
          </section>
          <p>
            {pool.length} structures available in this exact scope. Function
            matching excludes identification-only entries. Timed games pause
            during loading, rotation, feedback, hidden tabs, or an occluded
            target.
          </p>
          {message && <p role="alert">{message}</p>}
        </>
      ) : null}
      {running && !finished && (
        <div className="game-session">
          <div className="game-status">
            <strong>{mode}</strong>
            <span role="timer">
              {seconds === "0" ? "Untimed" : `${remaining}s`}
            </span>
            <span>
              {answers.filter((a) => a.correct).length} correct /{" "}
              {answers.length} answered
            </span>
            <button onClick={finish}>Finish session</button>
          </div>
          {isMemory ? (
            <>
              <h2>Find the identical structure-name pairs</h2>
              <div className="memory-grid">
                {memory.map((card, i) => (
                  <button
                    key={i}
                    aria-label={
                      paired.includes(i)
                        ? `${card.name} matched`
                        : flipped.includes(i)
                          ? card.name
                          : `Memory card ${i + 1}`
                    }
                    disabled={
                      paired.includes(i) ||
                      flipped.includes(i) ||
                      flipped.length === 2
                    }
                    onClick={() => setFlipped((v) => [...v, i])}
                  >
                    {paired.includes(i) || flipped.includes(i)
                      ? card.name
                      : "?"}
                  </button>
                ))}
              </div>
            </>
          ) : isTissue ? (
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
                          setAnswers((v) => [
                            ...v,
                            { id: targetId, correct: t.id === targetTissue.id },
                          ]);
                          setFeedback(
                            t.id === targetTissue.id
                              ? "Correct."
                              : `Study again: ${targetTissue.name}. ${targetTissue.clues}`,
                          );
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
          ) : (
            <>
              <h2>
                {isFind
                  ? ready && eligible.includes(targetId)
                    ? `Find: ${target?.name}`
                    : "Preparing a visible target…"
                  : mode === "Structure → function"
                    ? "Which function fits this isolated structure?"
                    : "Name this isolated structure."}
              </h2>
              <div className="game-model" data-target-id={targetId}>
                <AnatomyScene
                  key={isFind ? roster.map((m) => m.id).join(",") : targetId}
                  quiz
                  visible={[]}
                  selected={[]}
                  hidden={[]}
                  isolated={null}
                  layers={defaultLayers}
                  appearance={defaultAppearance}
                  onlyIds={
                    isFind
                      ? included
                      : included.filter(
                          (id) =>
                            id === targetId ||
                            byId.get(id)?.parentId === targetId,
                        )
                  }
                  labels={false}
                  onPickable={(ids) => {
                    setEligible(ids);
                    if (!isFind) setReady(ids.includes(targetId));
                  }}
                  onInteracting={setInteracting}
                  onSelect={isFind ? answer : undefined}
                />
              </div>
              {!playable && !feedback && (
                <p role="status">
                  Paused: preparing a visible, selectable target. Rotate or
                  reset the view if it is blocked.
                </p>
              )}
              {!isFind && (
                <div className="game-options">
                  {options.map((option) => (
                    <button
                      key={option}
                      disabled={!ready || !!feedback}
                      onClick={() => {
                        if (mode === "Structure → function") {
                          setAnswers((v) => [
                            ...v,
                            {
                              id: targetId,
                              correct: option === targetStudy?.function,
                            },
                          ]);
                          setFeedback(
                            option === targetStudy?.function
                              ? "Correct."
                              : `Study again: ${targetStudy?.function}`,
                          );
                        } else {
                          answer(roster.find((m) => m.name === option)!.id);
                        }
                      }}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
          {feedback && (
            <div className="game-feedback" role="status">
              <p>{feedback}</p>
              {targetStudy && <p>{targetStudy.function}</p>}
              <button onClick={next}>Next challenge</button>
            </div>
          )}
        </div>
      )}
      {finished && (
        <article className="learning-card">
          <h2>Session review</h2>
          <p>
            {answers.filter((a) => a.correct).length} correct from{" "}
            {answers.length} answered. Unattempted or blocked targets are not
            marked wrong.
          </p>
          <h3>Missed structures</h3>
          {answers.some((a) => !a.correct) ? (
            <ul>
              {[
                ...new Set(answers.filter((a) => !a.correct).map((a) => a.id)),
              ].map((id) => (
                <li key={id}>
                  {byId.get(id)?.name}: {getModelStudy(byId.get(id)!).function}
                </li>
              ))}
            </ul>
          ) : (
            <p>No missed answers.</p>
          )}
          <button
            disabled={
              new Set(answers.filter((a) => !a.correct).map((a) => a.id)).size <
              2
            }
            onClick={() =>
              start(answers.filter((a) => !a.correct).map((a) => a.id))
            }
          >
            Practice mistakes
          </button>
          <small>
            Two distinct missed structures are needed for a scoped challenge; a
            single mistake is reviewed above.
          </small>
        </article>
      )}
      <details>
        <summary>{history.length} saved game sessions</summary>
        {history.map((r) => (
          <p key={r.id}>
            {new Date(r.date).toLocaleDateString()} · {r.mode} · {r.score}/
            {r.total}
            {r.collection ? ` · ${r.collection}` : ""}
          </p>
        ))}
      </details>
    </section>
  );
}
