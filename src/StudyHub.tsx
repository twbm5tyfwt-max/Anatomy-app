import { useEffect, useMemo, useState } from "react";
import { FlashSession } from "./FlashSession";
import { landmarks } from "./landmarkCatalog";
import { modelParts } from "./modelCatalog";
import type { CourseCard, QuizScope, Result } from "./quiz";
import type { StudyCollection } from "./studyCollections";
import {
  ACTIVITY_KEY,
  GOALS_KEY,
  SRS_KEY,
  addCards,
  addDays,
  dayKey,
  daysBetween,
  defaultGoals,
  isDue,
  landmarkKey,
  removeCards,
  streakOf,
  structureKey,
  useShared,
  type Goals,
  type Srs,
} from "./studyStore";
import { BackupPanel } from "./BackupPanel";
import { MuscleTables } from "./MuscleTables";
import { WeakSpots } from "./WeakSpots";
import { Worksheets } from "./Worksheets";
import "./study.css";

const modelIds = new Set(modelParts.map((m) => m.id));
const landmarkIds = new Set(landmarks.map((l) => l.id));

type Sub = "today" | "cards" | "weak" | "tables" | "sheets" | "backup";
const subs: [Sub, string][] = [
  ["today", "Today"],
  ["cards", "Flashcards"],
  ["weak", "Weak spots"],
  ["tables", "Muscle tables"],
  ["sheets", "Worksheets"],
  ["backup", "Backup"],
];

export function StudyHub({
  collections,
  results,
  missed,
  cards,
  onQuiz,
  initialSub,
  initialCollection,
}: {
  collections: StudyCollection[];
  results: Result[];
  missed: string[];
  cards: CourseCard[];
  onQuiz: (scope: Partial<QuizScope>) => void;
  initialSub?: Sub;
  initialCollection?: string;
}) {
  const [sub, setSub] = useState<Sub>(initialSub || "today");
  const [srs] = useShared<Srs>(SRS_KEY, {});
  const due = Object.values(srs).filter((e) => isDue(e)).length;

  return (
    <section className="sh">
      <p className="eyebrow">STUDY SMARTER</p>
      <h1>Study</h1>
      <p className="sh-lead">
        Daily review, your weak spots, flashcards, muscle tables and printable
        worksheets, all built from what you have studied here.
      </p>
      <div className="sh-tabs" role="tablist">
        {subs.map(([id, label]) => (
          <button
            key={id}
            role="tab"
            aria-selected={sub === id}
            onClick={() => setSub(id)}
          >
            {label}
            {id === "today" && due > 0 && <b>{due}</b>}
          </button>
        ))}
      </div>
      {sub === "today" && (
        <Today
          results={results}
          missed={missed}
          cards={cards}
          onCards={() => setSub("cards")}
        />
      )}
      {sub === "cards" && (
        <Cards collections={collections} initialCollection={initialCollection} />
      )}
      {sub === "weak" && (
        <WeakSpots
          results={results}
          onQuiz={onQuiz}
          onReview={() => setSub("today")}
        />
      )}
      {sub === "tables" && <MuscleTables onQuiz={onQuiz} />}
      {sub === "sheets" && <Worksheets collections={collections} />}
      {sub === "backup" && <BackupPanel />}
    </section>
  );
}

/** Missed quiz questions and game answers become review cards (once each). */
function missedItems(results: Result[], missed: string[]) {
  const items: Parameters<typeof addCards>[0] = [];
  const wanted = new Set(missed);
  for (const r of results)
    for (const q of r.questions) {
      if (!wanted.has(q.id)) continue;
      wanted.delete(q.id);
      const lm = /^3d-(.+)-(identify|concept)$/.exec(q.id)?.[1];
      if (lm && landmarkIds.has(lm))
        items.push({ key: landmarkKey(lm), kind: "landmark" });
      else if (q.anatomySourceId && modelIds.has(q.anatomySourceId))
        items.push({ key: structureKey(q.anatomySourceId), kind: "structure" });
      else
        items.push({
          key: `q:${q.id}`,
          kind: q.id.startsWith("exam-") ? "exam" : "term",
          front: q.prompt,
          back: `${q.answer}${q.explanation ? ` — ${q.explanation}` : ""}`,
          label: q.id.startsWith("exam-") ? "Practice exam" : "Missed question",
        });
    }
  try {
    const games = JSON.parse(localStorage.getItem("forma-game-results") || "[]") as {
      missed?: string[];
    }[];
    for (const g of games)
      for (const id of g.missed || []) {
        if (modelIds.has(id)) items.push({ key: structureKey(id), kind: "structure" });
        else if (landmarkIds.has(id)) items.push({ key: landmarkKey(id), kind: "landmark" });
      }
  } catch {
    /* no game history */
  }
  return items;
}

function Today({
  results,
  missed,
  cards,
  onCards,
}: {
  results: Result[];
  missed: string[];
  cards: CourseCard[];
  onCards: () => void;
}) {
  const [srs] = useShared<Srs>(SRS_KEY, {});
  const [activity] = useShared<Record<string, number>>(ACTIVITY_KEY, {});
  const [goals, setGoals] = useShared<Goals>(GOALS_KEY, defaultGoals);
  const [running, setRunning] = useState<string[] | null>(null);
  const today = dayKey();
  const [added, setAdded] = useState(0);

  // Pull misses into the deck whenever this page opens.
  useEffect(() => {
    const n = addCards(missedItems(results, missed));
    if (n) setAdded(n);
  }, []);

  const entries = Object.entries(srs);
  const dueKeys = entries.filter(([, e]) => isDue(e, today)).map(([k]) => k);
  const learned = entries.filter(([, e]) => e.box >= 3).length;
  const streak = streakOf(activity, today);
  const doneToday = activity[today] || 0;
  const goal = Math.max(1, goals.dailyGoal);
  const pct = Math.min(100, Math.round((doneToday / goal) * 100));
  const daysLeft = goals.examDate ? daysBetween(today, goals.examDate) : null;
  const toLearn = entries.length - learned;
  const week = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6));
  const courseNew = useMemo(
    () => cards.filter((c) => !srs[`t:${c.id}`]).length,
    [cards, srs],
  );

  if (running)
    return (
      <FlashSession
        keys={running}
        srs={srs}
        title="Review today"
        onExit={() => setRunning(null)}
      />
    );
  return (
    <div className="sh-grid">
      <article className="sh-card">
        <h2>Review today</h2>
        <div className="sh-stat">
          <span className="sh-big">{dueKeys.length}</span>
          <span>
            card{dueKeys.length === 1 ? "" : "s"} due ·{" "}
            {entries.length} in your deck · {learned} well known
          </span>
        </div>
        {added > 0 && (
          <p>
            {added} new card{added === 1 ? "" : "s"} added from things you
            missed in quizzes and games.
          </p>
        )}
        <div className="sh-row">
          <button
            className="primary"
            disabled={!dueKeys.length}
            onClick={() => setRunning(dueKeys)}
          >
            Start review ({dueKeys.length})
          </button>
          <button onClick={onCards}>Make flashcards from a study tab</button>
          {courseNew > 0 && (
            <button
              onClick={() =>
                addCards(
                  cards.map((c) => ({
                    key: `t:${c.id}`,
                    kind: "term" as const,
                    front: `Define: ${c.term}`,
                    back: c.definition,
                    label: `${c.file}, p. ${c.page}`,
                  })),
                )
              }
            >
              Add my {courseNew} course cards
            </button>
          )}
        </div>
        <p className="sh-note">
          Cards you rate Again come back today; Good and Easy push them days
          further out, so you spend time where it helps most.
        </p>
      </article>

      <article className="sh-card">
        <h2>Daily goal and streak</h2>
        <div className="sh-stat">
          <div className="sh-ring" style={{ ["--p" as string]: pct + "%" }}>
            <span>
              {doneToday}/{goal}
            </span>
          </div>
          <div>
            <span className="sh-big">{streak}</span> day{streak === 1 ? "" : "s"}
            <p className="sh-note">
              {doneToday >= goal
                ? "Goal met today. Nice."
                : `${goal - doneToday} more answers to reach today's goal.`}
            </p>
          </div>
        </div>
        <div className="sh-week" aria-label="Last seven days">
          {week.map((d) => (
            <i key={d} className={activity[d] ? "on" : ""} title={`${d}: ${activity[d] || 0}`}>
              {new Date(d + "T12:00:00").toLocaleDateString(undefined, { weekday: "narrow" })}
            </i>
          ))}
        </div>
        <label className="field">
          Daily goal (answered questions + reviewed cards)
          <input
            type="number"
            min={1}
            max={500}
            value={goals.dailyGoal}
            onChange={(e) => setGoals({ ...goals, dailyGoal: Math.max(1, +e.target.value || 1) })}
          />
        </label>
      </article>

      <article className="sh-card">
        <h2>Exam countdown</h2>
        <label className="field">
          Exam or lab practical
          <input
            value={goals.examName}
            placeholder="e.g. Head & neck lab practical"
            onChange={(e) => setGoals({ ...goals, examName: e.target.value })}
          />
        </label>
        <label className="field">
          Date
          <input
            type="date"
            value={goals.examDate}
            onChange={(e) => setGoals({ ...goals, examDate: e.target.value })}
          />
        </label>
        {daysLeft !== null ? (
          daysLeft >= 0 ? (
            <>
              <p>
                <span className="sh-big">{daysLeft}</span> day{daysLeft === 1 ? "" : "s"} until{" "}
                {goals.examName || "your exam"}
              </p>
              {toLearn > 0 && (
                <p className="sh-note">
                  {toLearn} cards are not yet well known: about{" "}
                  {Math.ceil(toLearn / Math.max(1, daysLeft))} a day would cover
                  them by then.
                </p>
              )}
            </>
          ) : (
            <p className="sh-note">That date has passed. Pick the next one.</p>
          )
        ) : (
          <p className="sh-note">Add a date to see a countdown and a daily pace.</p>
        )}
      </article>

      <article className="sh-card">
        <h2>Your deck</h2>
        {entries.length ? (
          <>
            <ul className="sh-list">
              {[
                ["New / learning", entries.filter(([, e]) => e.box <= 1).length],
                ["Getting there", entries.filter(([, e]) => e.box === 2 || e.box === 3).length],
                ["Well known", entries.filter(([, e]) => e.box >= 4).length],
              ].map(([l, n]) => (
                <li key={l as string}>
                  <span>{l}</span>
                  <b>{n}</b>
                </li>
              ))}
            </ul>
            <button
              onClick={() => {
                if (window.confirm("Remove every card from your review deck? Your quizzes and notes are not affected."))
                  removeCards(entries.map(([k]) => k));
              }}
            >
              Clear deck
            </button>
          </>
        ) : (
          <p className="sh-note">
            Your deck is empty. Make flashcards from a study tab, or miss a few
            questions: they appear here automatically.
          </p>
        )}
      </article>
    </div>
  );
}

function Cards({
  collections,
  initialCollection,
}: {
  collections: StudyCollection[];
  initialCollection?: string;
}) {
  const [srs] = useShared<Srs>(SRS_KEY, {});
  const [pick, setPick] = useState(initialCollection || collections[0]?.id || "");
  const [withLandmarks, setWithLandmarks] = useState(true);
  const [session, setSession] = useState<string[] | null>(null);
  const [msg, setMsg] = useState("");
  const collection = collections.find((c) => c.id === pick);
  const keys = useMemo(() => {
    if (!collection) return [];
    const ids = collection.ids.filter((id) => modelIds.has(id));
    return [
      ...ids.map(structureKey),
      ...(withLandmarks
        ? landmarks.filter((l) => ids.includes(l.modelId)).map((l) => landmarkKey(l.id))
        : []),
    ];
  }, [collection, withLandmarks]);

  if (session)
    return (
      <FlashSession
        keys={session}
        srs={srs}
        title={collection?.name || "Flashcards"}
        onExit={() => setSession(null)}
      />
    );
  if (!collections.length)
    return (
      <p className="sh-warn">
        Flashcards are made from a study tab. Create one with “+ Study model”
        in the Body Explorer (upload notes, or pick a region), then come back.
      </p>
    );
  const structures = keys.filter((k) => k.startsWith("s:")).length;
  return (
    <div className="sh-grid">
      <article className="sh-card">
        <h2>Flashcards from a study tab</h2>
        <label className="field">
          Study tab
          <select value={pick} onChange={(e) => setPick(e.target.value)}>
            {collections.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.ids.length} structures)
              </option>
            ))}
          </select>
        </label>
        <label className="sh-row">
          <input
            type="checkbox"
            checked={withLandmarks}
            onChange={(e) => setWithLandmarks(e.target.checked)}
          />
          Include landmark cards for bones with mapped points
        </label>
        <p>
          {keys.length} cards: {structures} structure pictures
          {withLandmarks ? ` and ${keys.length - structures} landmarks` : ""}.
          Front: the part highlighted among its neighbours. Back: name,
          function, location (and origin, insertion and nerve for muscles).
        </p>
        <div className="sh-row">
          <button
            className="primary"
            disabled={!keys.length}
            onClick={() => {
              const n = addCards(keys.map((key) => ({ key, kind: key.startsWith("s:") ? "structure" as const : "landmark" as const })));
              setMsg(n ? `${n} new cards added to your review deck.` : "These cards are already in your deck.");
              setSession(keys);
            }}
          >
            Study these now
          </button>
          <button
            disabled={!keys.length}
            onClick={() => {
              const n = addCards(keys.map((key) => ({ key, kind: key.startsWith("s:") ? "structure" as const : "landmark" as const })));
              setMsg(n ? `${n} cards added. They are due today in “Review today”.` : "These cards are already in your deck.");
            }}
          >
            Add to review deck only
          </button>
        </div>
        {msg && <p role="status">{msg}</p>}
        <p className="sh-note">
          Landmark points exist for about 50 bones; other bones get structure
          cards only.
        </p>
      </article>
    </div>
  );
}
