import { useEffect, useMemo, useRef, useState } from "react";
import { AnatomyScene, defaultLayers, type SceneApi } from "./AnatomyScene";
import { defaultAppearance } from "./Appearance";
import { landmarks, type AnatomyLandmark } from "./landmarkCatalog";
import { modelParts } from "./modelCatalog";
import { useStored } from "./storage";

const byId = new Map(modelParts.map((m) => [m.id, m]));
const shuffle = <T,>(a: T[]) => [...a].sort(() => Math.random() - 0.5);

export function landmarkCounts() {
  const out = new Map<string, number>();
  for (const l of landmarks) out.set(l.modelId, (out.get(l.modelId) || 0) + 1);
  return out;
}

type Answer = { id: string; correct: boolean };

/** Name the colored dot on a bone. Every point is a validated source-mapped landmark. */
export function LandmarkGame({
  boneIds,
  seconds,
  onExit,
}: {
  boneIds: string[];
  seconds: number;
  onExit: () => void;
}) {
  const [pool, setPool] = useState<AnatomyLandmark[]>(() =>
    shuffle(landmarks.filter((l) => boneIds.includes(l.modelId))).slice(0, 40),
  );
  const [round, setRound] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [picked, setPicked] = useState("");
  const [finished, setFinished] = useState(false);
  const [remaining, setRemaining] = useState(seconds);
  const [, setHistory] = useStored<unknown[]>("forma-game-results", []);
  const api = useRef<SceneApi | null>(null);
  const target = pool[round % Math.max(pool.length, 1)];
  const bone = target ? byId.get(target.modelId) : undefined;
  const ids = useMemo(
    () =>
      bone
        ? [
            bone.id,
            ...modelParts.filter((m) => m.parentId === bone.id).map((m) => m.id),
          ]
        : [],
    [bone],
  );
  const options = useMemo(() => {
    if (!target) return [];
    const same = landmarks.filter(
      (l) => l.modelId === target.modelId && l.name !== target.name,
    );
    const others = landmarks.filter(
      (l) => l.modelId !== target.modelId && l.name !== target.name,
    );
    const names = new Set<string>();
    for (const l of [...shuffle(same), ...shuffle(others)]) {
      if (names.size >= 3) break;
      names.add(l.name);
    }
    return shuffle([target.name, ...names]);
  }, [target]);

  useEffect(() => {
    if (!seconds || finished || picked) return;
    const t = setInterval(() => setRemaining((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [seconds, finished, picked]);
  useEffect(() => {
    if (seconds && remaining === 0 && !finished) finish();
  }, [remaining]);

  function finish() {
    if (finished) return;
    setFinished(true);
    setHistory((old) =>
      [
        {
          id: crypto.randomUUID(),
          date: new Date().toISOString(),
          mode: "Landmarks",
          score: answers.filter((a) => a.correct).length,
          total: answers.length,
          missed: answers.filter((a) => !a.correct).map((a) => a.id),
        },
        ...old,
      ].slice(0, 100),
    );
  }
  function answer(name: string) {
    if (picked || !target) return;
    setPicked(name);
    setAnswers((v) => [...v, { id: target.id, correct: name === target.name }]);
  }
  function next() {
    setPicked("");
    setRound((n) => n + 1);
  }
  const lmById = new Map(landmarks.map((l) => [l.id, l]));
  const score = answers.filter((a) => a.correct).length;

  if (!pool.length)
    return (
      <p role="alert">
        None of the checked bones have mapped landmark points. Pick bones with a
        landmark count, such as the humerus, tibia, mandible or frontal bone.
      </p>
    );

  if (finished) {
    const missed = [...new Set(answers.filter((a) => !a.correct).map((a) => a.id))];
    return (
      <article className="learning-card lm-review">
        <h2>Landmark review</h2>
        <p>
          {score} correct from {answers.length} answered.
        </p>
        {missed.length ? (
          <>
            <h3>Study these again</h3>
            <ul>
              {missed.map((id) => {
                const l = lmById.get(id)!;
                return (
                  <li key={id}>
                    <b>{l.name}</b> on the {byId.get(l.modelId)?.name}: {l.location}
                  </li>
                );
              })}
            </ul>
            <button
              onClick={() => {
                setPool(shuffle(missed.map((id) => lmById.get(id)!)));
                setRound(0);
                setAnswers([]);
                setPicked("");
                setFinished(false);
                setRemaining(seconds);
              }}
            >
              Practice mistakes
            </button>
          </>
        ) : (
          <p>No missed landmarks.</p>
        )}
        <button className="primary" onClick={onExit}>
          Back to setup
        </button>
      </article>
    );
  }

  return (
    <div className="game-session lm-session">
      <div className="game-status">
        <strong>Landmarks</strong>
        <span role="timer">{seconds ? `${remaining}s` : "Untimed"}</span>
        <span>
          {score} correct / {answers.length} answered · point {Math.min(round + 1, pool.length)} of {pool.length}
        </span>
        <button onClick={finish}>Finish session</button>
      </div>
      <h2>
        What is the marked point on this {bone?.name.toLowerCase()}?
      </h2>
      <div className="game-model lm-model" data-target-id={target.id}>
        <AnatomyScene
          key={target.id}
          quiz
          visible={[]}
          selected={[]}
          hidden={[]}
          isolated={null}
          layers={defaultLayers}
          appearance={defaultAppearance}
          onlyIds={ids}
          labels={false}
          landmarks={[
            {
              id: target.id,
              name: target.name,
              anchor: target.anchor,
              modelId: target.modelId,
              contextIds: target.contextIds,
            },
          ]}
          targetMarker={target.id}
          initialView={target.view}
          onReady={(a) => {
            api.current = a;
            a.frame(ids, target.view, 0);
          }}
        />
      </div>
      <p className="lm-tip">Drag to rotate the bone. The colored dot is the point to name.</p>
      <div className="game-options">
        {options.map((o) => (
          <button
            key={o}
            disabled={!!picked}
            className={
              picked
                ? o === target.name
                  ? "right"
                  : o === picked
                    ? "wrong"
                    : ""
                : ""
            }
            onClick={() => answer(o)}
          >
            {o}
          </button>
        ))}
      </div>
      {picked && (
        <div className="game-feedback" role="status">
          <p>
            {picked === target.name ? "Correct." : `Not quite. This is the ${target.name}.`}
          </p>
          <p>{target.location}</p>
          <button onClick={next}>Next landmark</button>
        </div>
      )}
    </div>
  );
}
