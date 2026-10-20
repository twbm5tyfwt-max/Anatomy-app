import { useMemo, useState } from "react";
import { landmarks } from "./landmarkCatalog";
import { modelParts } from "./modelCatalog";
import { isCorrect, type QuizScope, type Result } from "./quiz";
import { addCards, landmarkKey, structureKey } from "./studyStore";
import "./study.css";

const byId = new Map(modelParts.map((m) => [m.id, m]));
const lmById = new Map(landmarks.map((l) => [l.id, l]));

type Row = {
  key: string;
  name: string;
  region: string;
  attempts: number;
  misses: number;
  last: string;
  modelId?: string;
  landmarkId?: string;
};

/** Where your answers go wrong: by structure and by region, from quizzes and games. */
export function WeakSpots({
  results,
  onQuiz,
  onReview,
}: {
  results: Result[];
  onQuiz: (scope: Partial<QuizScope>) => void;
  onReview: () => void;
}) {
  const [picked, setPicked] = useState<string[]>([]);
  const [msg, setMsg] = useState("");
  const { rows, regions, answered } = useMemo(() => {
    const map = new Map<string, Row>();
    const reg = new Map<string, { attempts: number; misses: number }>();
    let answered = 0;
    const touch = (
      key: string,
      name: string,
      region: string,
      date: string,
      miss: boolean,
      countAttempt: boolean,
      ids: Pick<Row, "modelId" | "landmarkId">,
    ) => {
      const r = map.get(key) || { key, name, region, attempts: 0, misses: 0, last: "", ...ids };
      if (countAttempt) r.attempts++;
      if (miss) {
        r.misses++;
        if (date > r.last) r.last = date;
      }
      map.set(key, r);
    };
    for (const res of results)
      for (const q of res.questions) {
        const ok = isCorrect(res.answers[q.id] || "", q);
        answered++;
        const lm = /^3d-(.+)-(identify|concept)$/.exec(q.id)?.[1];
        const model = q.anatomySourceId ? byId.get(q.anatomySourceId) : undefined;
        const region = model?.region || "Other";
        const g = reg.get(region) || { attempts: 0, misses: 0 };
        g.attempts++;
        if (!ok) g.misses++;
        reg.set(region, g);
        if (lm && lmById.has(lm))
          touch(landmarkKey(lm), `${lmById.get(lm)!.name} (landmark)`, region, res.date, !ok, true, { landmarkId: lm });
        else if (model)
          touch(structureKey(model.id), model.name, region, res.date, !ok, true, { modelId: model.id });
      }
    try {
      const games = JSON.parse(localStorage.getItem("forma-game-results") || "[]") as {
        date: string;
        missed?: string[];
      }[];
      for (const g of games)
        for (const id of g.missed || []) {
          const m = byId.get(id);
          const l = lmById.get(id);
          if (m) touch(structureKey(id), m.name, m.region || "Other", g.date, true, false, { modelId: id });
          else if (l) {
            const bone = byId.get(l.modelId);
            touch(landmarkKey(id), `${l.name} (landmark)`, bone?.region || "Other", g.date, true, false, { landmarkId: id });
          }
        }
    } catch {
      /* no games yet */
    }
    const rows = [...map.values()]
      .filter((r) => r.misses > 0)
      .sort(
        (a, b) =>
          b.misses / Math.max(1, b.attempts || b.misses) - a.misses / Math.max(1, a.attempts || a.misses) ||
          b.misses - a.misses,
      );
    const regions = [...reg.entries()]
      .filter(([, v]) => v.attempts >= 1)
      .map(([name, v]) => ({ name, ...v, pct: Math.round(((v.attempts - v.misses) / v.attempts) * 100) }))
      .sort((a, b) => a.pct - b.pct);
    return { rows, regions, answered };
  }, [results]);

  if (!rows.length && !answered)
    return (
      <p className="sh-warn">
        Nothing to analyse yet. Take a quiz or play a game and your misses will
        show up here with a “study next” list.
      </p>
    );
  const chosen = rows.filter((r) => picked.includes(r.key));
  const target = chosen.length ? chosen : rows.slice(0, 10);
  const modelIds = [
    ...new Set(
      target
        .map((r) => r.modelId || (r.landmarkId ? lmById.get(r.landmarkId)?.modelId : undefined))
        .filter(Boolean) as string[],
    ),
  ];
  return (
    <div className="sh-grid">
      <article className="sh-card">
        <h2>Accuracy by region</h2>
        <p className="sh-note">From {answered} quiz answers. Lowest first.</p>
        <ul className="sh-list">
          {regions.map((r) => (
            <li key={r.name}>
              <span>
                {r.name} <small>({r.attempts})</small>
              </span>
              <span className={"sh-bar" + (r.pct >= 70 ? " good" : "")} aria-hidden="true">
                <i style={{ width: r.pct + "%" }} />
              </span>
              <b>{r.pct}%</b>
            </li>
          ))}
        </ul>
      </article>
      <article className="sh-card">
        <h2>Study next</h2>
        {rows.length ? (
          <>
            <p className="sh-note">
              Your most-missed structures. Tick some, or use the top ten.
            </p>
            <ul className="sh-list" role="list">
              {rows.slice(0, 25).map((r) => (
                <li key={r.key}>
                  <input
                    type="checkbox"
                    aria-label={`Select ${r.name}`}
                    checked={picked.includes(r.key)}
                    onChange={(e) =>
                      setPicked((v) => (e.target.checked ? [...v, r.key] : v.filter((x) => x !== r.key)))
                    }
                  />
                  <span>
                    {r.name}
                    <br />
                    <small>
                      {r.region} · missed {r.misses}×
                      {r.attempts ? ` of ${r.attempts} in quizzes` : " in games"}
                      {r.last && ` · last ${new Date(r.last).toLocaleDateString()}`}
                    </small>
                  </span>
                </li>
              ))}
            </ul>
            <div className="sh-row">
              <button
                className="primary"
                onClick={() => {
                  const n = addCards(
                    target.map((r) => ({
                      key: r.key,
                      kind: r.landmarkId ? ("landmark" as const) : ("structure" as const),
                    })),
                  );
                  setMsg(`${n} card${n === 1 ? "" : "s"} added (already-in-deck cards unchanged).`);
                  onReview();
                }}
              >
                Review {chosen.length ? "selected" : "top"} {target.length}
              </button>
              <button
                disabled={modelIds.length < 2}
                onClick={() =>
                  onQuiz({
                    modelIds,
                    scopeLabel: "My weak spots",
                    system: "",
                    anatomy: false,
                    structure: "",
                    format: "mixed",
                  })
                }
              >
                Quiz me on these
              </button>
            </div>
            {modelIds.length < 2 && (
              <p className="sh-note">A weak-spot quiz needs at least two different structures.</p>
            )}
            {msg && <p role="status">{msg}</p>}
          </>
        ) : (
          <p>No misses recorded. Keep going.</p>
        )}
      </article>
    </div>
  );
}
