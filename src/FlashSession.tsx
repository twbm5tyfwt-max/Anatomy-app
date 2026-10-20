import { useMemo, useState } from "react";
import { AnatomyQuestion } from "./AnatomyQuestion";
import type { AnatomyQuestionView } from "./anatomyQuestions";
import { pointerView } from "./collectionQuestions";
import { landmarks } from "./landmarkCatalog";
import { getModelStudy, modelParts } from "./modelCatalog";
import {
  INTERVALS,
  rate,
  type Rating,
  type Srs,
  type SrsEntry,
} from "./studyStore";
import "./study.css";

const byId = new Map(modelParts.map((m) => [m.id, m]));
const lmById = new Map(landmarks.map((l) => [l.id, l]));

export type CardFace = {
  prompt: string;
  view?: AnatomyQuestionView;
  text?: string;
  title: string;
  lines: string[];
  kicker: string;
};

/** Build what a card shows from its key. Structure and landmark cards come from the atlas. */
export function describeCard(key: string, e?: SrsEntry): CardFace | null {
  if (key.startsWith("s:")) {
    const m = byId.get(key.slice(2));
    if (!m) return null;
    const s = getModelStudy(m);
    return {
      kicker: "Structure",
      prompt: "What is the highlighted structure?",
      view: pointerView(m),
      title: m.name,
      lines: [
        s.function && `Function: ${s.function}`,
        s.location && `Location: ${s.location}`,
        s.origin && `Origin: ${s.origin}`,
        s.insertion && `Insertion: ${s.insertion}`,
        s.innervation && `Nerve: ${s.innervation}`,
      ].filter(Boolean) as string[],
    };
  }
  if (key.startsWith("l:")) {
    const l = lmById.get(key.slice(2));
    const bone = l && byId.get(l.modelId);
    if (!l || !bone) return null;
    return {
      kicker: `Landmark · ${bone.name}`,
      prompt: "Name the point marked by the yellow dot.",
      view: {
        ids: [
          bone.id,
          ...modelParts.filter((m) => m.parentId === bone.id).map((m) => m.id),
        ],
        modelId: bone.id,
        view: l.view,
        landmarkIds: [l.id],
        targetLandmarkId: l.id,
        interaction: "identify",
      },
      title: l.name,
      lines: [l.location, l.function].filter(Boolean),
    };
  }
  if (e)
    return {
      kicker: e.label || (e.kind === "exam" ? "Practice exam" : "Course term"),
      prompt: e.front || "",
      text: e.front,
      title: e.back || "",
      lines: [],
    };
  return null;
}

const ratings: { id: Rating; label: string; hint: string }[] = [
  { id: "again", label: "Again", hint: "today" },
  { id: "hard", label: "Hard", hint: "1 day" },
  { id: "good", label: "Good", hint: "" },
  { id: "easy", label: "Easy", hint: "" },
];

/** Flip-and-rate session. Ratings feed the review schedule. */
export function FlashSession({
  keys,
  srs,
  title,
  onExit,
}: {
  keys: string[];
  srs: Srs;
  title: string;
  onExit: () => void;
}) {
  const [queue, setQueue] = useState(() =>
    keys.filter((k) => describeCard(k, srs[k])),
  );
  const [shown, setShown] = useState(false);
  const [done, setDone] = useState<Record<string, Rating>>({});
  const [total] = useState(queue.length);
  const [retries, setRetries] = useState<Record<string, number>>({});
  const key = queue[0];
  const face = useMemo(() => (key ? describeCard(key, srs[key]) : null), [key]);
  const entry = key ? srs[key] : undefined;

  function answer(r: Rating) {
    rate(key, r);
    setDone((d) => ({ ...d, [key]: r }));
    setShown(false);
    setQueue((q) => {
      const rest = q.slice(1);
      // "Again" brings the card back later in this session, at most twice.
      if (r === "again" && (retries[key] || 0) < 2) {
        setRetries((x) => ({ ...x, [key]: (x[key] || 0) + 1 }));
        return [...rest.slice(0, 4), key, ...rest.slice(4)];
      }
      return rest;
    });
  }
  function nextInterval(r: Rating) {
    if (!entry) return "";
    if (r === "again") return "today";
    if (r === "hard") return "1 day";
    const box = Math.min(INTERVALS.length - 1, entry.box + (r === "easy" ? 2 : 1));
    return `${INTERVALS[box]} day${INTERVALS[box] === 1 ? "" : "s"}`;
  }

  if (!key || !face) {
    const counts = Object.values(done).reduce(
      (c, r) => ({ ...c, [r]: (c[r] || 0) + 1 }),
      {} as Record<string, number>,
    );
    return (
      <article className="fs-done">
        <h2>{total ? "Session complete" : "No cards to review"}</h2>
        {total > 0 && (
          <p>
            {Object.keys(done).length} cards reviewed ·{" "}
            {counts.again || 0} again · {counts.hard || 0} hard ·{" "}
            {counts.good || 0} good · {counts.easy || 0} easy.
          </p>
        )}
        <button className="primary" onClick={onExit}>
          Back
        </button>
      </article>
    );
  }
  return (
    <section className="fs" aria-label="Flashcard session">
      <header>
        <strong>{title}</strong>
        <span>
          Card {Math.min(total, Object.keys(done).length + 1)} of {total} ·{" "}
          {queue.length} left
        </span>
        <button onClick={onExit}>End session</button>
      </header>
      <div className="fs-progress">
        <span style={{ width: `${(Object.keys(done).length / total) * 100}%` }} />
      </div>
      <article className="fs-card">
        <span className="fs-kicker">{face.kicker}</span>
        <h2>{face.prompt}</h2>
        {face.view && (
          <AnatomyQuestion
            question={face.view}
            checked={shown}
            onAnswer={() => {}}
          />
        )}
        {!shown ? (
          <button className="primary fs-reveal" onClick={() => setShown(true)}>
            Show answer
          </button>
        ) : (
          <div className="fs-back">
            <h3>{face.title}</h3>
            {face.lines.map((l) => (
              <p key={l}>{l}</p>
            ))}
            <div className="fs-rate" role="group" aria-label="How well did you know it?">
              {ratings.map((r) => (
                <button key={r.id} data-rating={r.id} onClick={() => answer(r.id)}>
                  <strong>{r.label}</strong>
                  <small>{nextInterval(r.id)}</small>
                </button>
              ))}
            </div>
          </div>
        )}
      </article>
    </section>
  );
}
