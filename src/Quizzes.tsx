import { PracticeExams } from "./PracticeExams";
import { anatomyQuestionModels } from "./anatomyQuestions";
import { AnatomyQuestion } from "./AnatomyQuestion";
import { modelParts } from "./modelCatalog";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  CheckCircle2,
  XCircle,
  Clock3,
  RotateCcw,
  Bookmark,
  Target,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { structures, systems, tissues, regions } from "./content";
import { Atlas } from "./atlas";
import { TissueDiagram } from "./TissueDiagram";
import {
  createQuestions,
  isCorrect,
  type QuizScope,
  type Question,
  type Result,
  type CourseCard,
} from "./quiz";
export const defaultScope: QuizScope = {
  modelIds: undefined, scopeLabel: undefined,
  anatomy: false,
  anatomyTopic: "",
  system: "muscular",
  region: "",
  tissue: "",
  structure: "",
  count: 10,
  format: "mixed",
  difficulty: "Foundations",
  course: false,
  missedOnly: false,
  includeSystems: [],
  includeTissues: [],
};
export function Quizzes({
  initialScope,
  cards,
  missed,
  setMissed,
  onSave,
  saved,
  setSaved,
}: {
  initialScope: Partial<QuizScope>;
  cards: CourseCard[];
  missed: string[];
  setMissed: (v: string[]) => void;
  onSave: (r: Result) => void;
  saved: string[];
  setSaved: (v: string[]) => void;
}) {
  const [scope, setScope] = useState<QuizScope>({
    ...defaultScope,
    ...initialScope,
  });
  const [mode, setMode] = useState("Practice");
  const [timed, setTimed] = useState(false);
  const [remaining, setRemaining] = useState(600);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [current, setCurrent] = useState(0);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const q = questions[current];
  const answered = q ? answers[q.id] || "" : "";
  const isChecked = q ? checked[q.id] : false;
  const available = createQuestions(
    { ...scope, count: 1000 },
    cards,
    missed,
  ).length;
  const change = (patch: Partial<QuizScope>) =>
    setScope({ ...scope, ...patch });
  function start(qs?: Question[]) {
    const generated = qs || createQuestions(scope, cards, missed);
    if (!generated.length) {
      setError(
        "No questions match these filters. Broaden the scope or choose a different format. Course practice requires reviewed study cards.",
      );
      return;
    }
    setQuestions(generated);
    setAnswers({});
    setChecked({});
    setCurrent(0);
    setResult(null);
    setError("");
    setRemaining(600);
  }
  function finish() {
    if (result) return;
    const correct = questions.filter((x) => isCorrect(answers[x.id] || "", x));
    const res: Result = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      questions,
      answers,
      score: Math.round((correct.length / questions.length) * 100),
      mode,
    };
    setResult(res);
    onSave(res);
    setMissed([
      ...new Set([
        ...missed.filter((id) => !correct.some((x) => x.id === id)),
        ...questions.filter((x) => !correct.includes(x)).map((x) => x.id),
      ]),
    ]);
  }
  useEffect(() => {
    if (!questions.length || result || !timed) return;
    const timer = window.setInterval(
      () => setRemaining((t) => Math.max(0, t - 1)),
      1000,
    );
    return () => clearInterval(timer);
  }, [questions, result, timed]);
  useEffect(() => {
    if (timed && remaining === 0 && questions.length && !result) finish();
  }, [remaining]);
  function save(id: string) {
    setSaved(
      saved.includes(id) ? saved.filter((x) => x !== id) : [...saved, id],
    );
  }
  if (result) {
    const wrong = result.questions.filter(
      (x) => !isCorrect(result.answers[x.id] || "", x),
    );
    return (
      <div className="quiz-results">
        <div className="page-heading">
          <div>
            <span className="eyebrow">
              A LITTLE PRACTICE, A LITTLE PROGRESS
            </span>
            <h1>
              {result.score >= 80
                ? "Look at what you know."
                : "Every mistake is a place to start."}
            </h1>
            <p>
              Your session is saved. Come back to the tricky parts whenever
              you’re ready.
            </p>
          </div>
          <button
            className="secondary"
            onClick={() => {
              setQuestions([]);
              setResult(null);
            }}
          >
            <SlidersHorizontal size={16} />
            New quiz
          </button>
        </div>
        <section className="score-hero panel">
          <div className="score-circle">
            {result.score}
            <span>%</span>
          </div>
          <div>
            <h2>
              {result.questions.length - wrong.length} of{" "}
              {result.questions.length} correct
            </h2>
            <p>
              {wrong.length
                ? `Focus next on ${[...new Set(wrong.map((q) => systems.find((s) => s.id === q.topic)?.name || q.topic))].join(", ")}.`
                : "All answers correct in this session. Try a more detailed scope next."}
            </p>
            <button
              className="primary"
              disabled={!wrong.length}
              onClick={() => start(wrong)}
            >
              <RotateCcw size={16} />
              Retry {wrong.length} missed questions
            </button>
          </div>
        </section>
        <h2>Your answer review</h2>
        {result.questions.map((x, i) => {
          const correct = isCorrect(result.answers[x.id] || "", x);
          return (
            <section
              className={`answer-review panel ${correct ? "correct" : "incorrect"}`}
              key={x.id}
            >
              <div className="review-title">
                {correct ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                <strong>
                  {i + 1}. {x.prompt}
                </strong>
                <button
                  className={`icon-button ${saved.includes(x.id) ? "bookmarked" : ""}`}
                  aria-label={`Save question ${i + 1} for review`}
                  onClick={() => save(x.id)}
                >
                  <Bookmark size={17} />
                </button>
              </div>
              <p>
                Your answer: {result.answers[x.id] || "Unanswered"}
                {!correct && (
                  <>
                    <br />
                    <strong>Correct answer: {x.answer}</strong>
                  </>
                )}
              </p>
              <p>{x.explanation}</p>
              <small>{x.source}</small>
            </section>
          );
        })}
      </div>
    );
  }
  if (q)
    return (
      <div className="quiz-session">
        <div className="session-top">
          <button
            className="text-button"
            onClick={() => {
              setQuestions([]);
              setAnswers({});
            }}
          >
            <ArrowLeft size={16} />
            Exit session
          </button>
          <span className="badge">{mode} mode</span>
          {timed && (
            <span className="timer">
              <Clock3 size={15} />
              {Math.floor(remaining / 60)}:
              {String(remaining % 60).padStart(2, "0")}
            </span>
          )}
        </div>
        <div className="session-progress">
          <span style={{ width: `${(current / questions.length) * 100}%` }} />
        </div>
        <section className="question-card panel">
          <div className="question-kicker">
            <span>
              QUESTION {current + 1} OF {questions.length}
            </span>
            <button
              className={`icon-button ${saved.includes(q.id) ? "bookmarked" : ""}`}
              aria-label="Bookmark this question"
              onClick={() => save(q.id)}
            >
              <Bookmark size={18} />
            </button>
          </div>
          <span className="eyebrow">
            {systems.find((s) => s.id === q.topic)?.name || q.topic}
          </span>
          <h2>{q.prompt}</h2>
          {q.anatomy && (
            <AnatomyQuestion
              question={q.anatomy}
              checked={!!isChecked}
              onAnswer={(name) => setAnswers({ ...answers, [q.id]: name })}
            />
          )}
          {q.structureId && (
            <div className="quiz-anatomy">
              <Atlas
                quiz
                selected={
                  q.format === "click"
                    ? isChecked
                      ? q.structureId
                      : ""
                    : q.structureId
                }
                labels={false}
                onSelect={
                  q.format === "click" && !isChecked
                    ? (id) =>
                        setAnswers({
                          ...answers,
                          [q.id]: structures.find((s) => s.id === id)!.name,
                        })
                    : undefined
                }
              />
            </div>
          )}
          {q.tissueId && (
            <div className="quiz-tissue">
              <TissueDiagram
                tissue={tissues.find((t) => t.id === q.tissueId)!}
                labels={false}
              />
            </div>
          )}
          {q.format === "typed" ? (
            <label className="typed-answer">
              Your answer
              <input
                autoFocus
                value={answered}
                disabled={isChecked}
                placeholder="Enter the anatomical name…"
                onChange={(e) =>
                  setAnswers({ ...answers, [q.id]: e.target.value })
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter" && mode === "Practice" && answered)
                    setChecked({ ...checked, [q.id]: true });
                }}
              />
              <small>
                Valid synonyms and minor spelling errors are accepted.
              </small>
            </label>
          ) : q.format === "click" ? (
            <p className="click-selection">
              Selected:{" "}
              <strong>
                {q.anatomy
                  ? answered
                    ? isChecked
                      ? answered
                      : "Marker selected"
                    : "Choose an unlabeled marker"
                  : answered || "Click a region on the plate"}
              </strong>
            </p>
          ) : (
            <div className="answer-options">
              {q.options.map((o, i) => (
                <button
                  key={o}
                  disabled={isChecked}
                  className={`${answered === o ? "chosen" : ""} ${isChecked && o === q.answer ? "right" : ""} ${isChecked && answered === o && answered !== q.answer ? "wrong" : ""}`}
                  onClick={() => setAnswers({ ...answers, [q.id]: o })}
                >
                  <span>{String.fromCharCode(65 + i)}</span>
                  {o}
                  {answered === o && <Check size={17} />}
                </button>
              ))}
            </div>
          )}
          {isChecked && (
            <div
              className={`answer-feedback ${isCorrect(answered, q) ? "correct" : "incorrect"}`}
              role="status"
            >
              <strong>
                {isCorrect(answered, q)
                  ? "That’s right."
                  : `Correct answer: ${q.answer}`}
              </strong>
              <p>{q.explanation}</p>
              <small>{q.source}</small>
            </div>
          )}
          <div className="question-actions">
            {mode === "Practice" && !isChecked ? (
              <button
                className="primary"
                disabled={!answered.trim()}
                onClick={() => setChecked({ ...checked, [q.id]: true })}
              >
                Check answer <Check size={16} />
              </button>
            ) : (
              <>
                {mode === "Exam" && current > 0 && (
                  <button
                    className="secondary"
                    onClick={() => setCurrent(current - 1)}
                  >
                    <ArrowLeft size={16} />
                    Previous
                  </button>
                )}
                <button
                  className="primary"
                  onClick={() =>
                    current === questions.length - 1
                      ? finish()
                      : setCurrent(current + 1)
                  }
                >
                  {current === questions.length - 1
                    ? "Submit quiz"
                    : "Next question"}
                  <ArrowRight size={16} />
                </button>
              </>
            )}
          </div>
        </section>
        <p className="session-note">
          {mode === "Exam"
            ? "Answers and explanations will appear after you submit. You can revisit previous questions."
            : "Take your time. Feedback appears after each answer."}
        </p>
      </div>
    );
  return (
    <div className="quiz-builder">
      <div className="page-heading">
        <div>
          <span className="eyebrow">SMALL SESSIONS. STRONGER CONNECTIONS.</span>
          <h1>Make it stick.</h1>
          <p>
            A little retrieval practice goes a long way. Choose what you want to
            work on.
          </p>
        </div>
        <span className="soft-icon">
          <Target size={28} />
        </span>
      </div>
      <div className="quiz-builder-grid">
        <section className="panel quiz-settings">
          <div className="panel-head">
            <h2>Build your practice</h2>
            <span className="badge">No AI required</span>
          </div>
          <PracticeExams onStart={(qs) => start(qs)} />
          {scope.modelIds && <p className="education-note">Confirmed collection: {scope.scopeLabel || "Study model"} · {scope.modelIds.length} structures. Other catalog entries are excluded. <button onClick={()=>change({modelIds:undefined,scopeLabel:undefined})}>Leave collection scope</button></p>}
          <div className="quiz-presets">
            <button
              onClick={() =>
                change({
                  ...defaultScope,
                  anatomy: true,
                  anatomyTopic: "spine",
                  system: "skeletal",
                  structure: "",
                  format: "mixed",
                })
              }
            >
              3D spine & landmarks
            </button>
            <button
              onClick={() =>
                change({
                  ...defaultScope,
                  system: "skeletal",
                  region: "Head & neck",
                })
              }
            >
              Skull & landmarks
            </button>
            <button
              onClick={() =>
                change({
                  ...defaultScope,
                  system: "muscular",
                  region: "Head & neck",
                  difficulty: "Detailed",
                })
              }
            >
              Head & neck muscles
            </button>
            <button
              onClick={() =>
                change({ ...defaultScope, system: "", tissue: "Epithelial" })
              }
            >
              Epithelial tissues
            </button>
            <button
              onClick={() => change({ ...defaultScope, region: "Upper limbs" })}
            >
              Upper limb muscles
            </button>
            <button
              onClick={() =>
                change({ ...defaultScope, system: "cardiovascular" })
              }
            >
              Cardiovascular
            </button>
          </div>
          <div className="form-grid">
            <label>
              Study collection
              <select
                aria-label="Study collection"
                value={
                  scope.course
                    ? "course"
                    : scope.anatomy
                      ? "anatomy3d"
                      : "atlas"
                }
                onChange={(e) =>
                  change({
                    course: e.target.value === "course",
                    anatomy: e.target.value === "anatomy3d",
                    anatomyTopic: "",
                    system: "",
                    tissue: "",
                    region: "",
                    structure: "",
                    format: e.target.value === "course" ? "typed" : "mixed",
                  })
                }
              >
                <option value="atlas">Burdett’s Anatomy collection</option>
                <option value="anatomy3d">
                  3D anatomy & reviewed landmarks
                </option>
                <option value="course">
                  My reviewed course cards ({cards.length})
                </option>
              </select>
            </label>
            <label>
              Organ system
              <select
                aria-label="Organ system"
                disabled={scope.course}
                value={scope.system}
                onChange={(e) =>
                  change({ system: e.target.value, tissue: "", structure: "" })
                }
              >
                <option value="">All systems & tissues</option>
                {systems.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Body region
              <select
                aria-label="Body region"
                disabled={scope.course || !!scope.tissue}
                value={scope.region}
                onChange={(e) =>
                  change({ region: e.target.value, structure: "" })
                }
              >
                <option value="">All regions</option>
                {regions.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </label>
            <label>
              Tissue scope
              <select
                aria-label="Tissue scope"
                disabled={scope.course || scope.anatomy}
                value={scope.tissue}
                onChange={(e) =>
                  change({
                    tissue: e.target.value,
                    system: "",
                    region: "",
                    structure: "",
                  })
                }
              >
                <option value="">Include according to collection</option>
                {["Epithelial", "Connective", "Muscle", "Nervous"].map((c) => (
                  <optgroup key={c} label={c}>
                    <option value={c}>All {c.toLowerCase()} tissues</option>
                    {tissues
                      .filter((t) => t.class === c)
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                  </optgroup>
                ))}
              </select>
            </label>
            <label>
              Specific structure
              <select
                aria-label="Specific structure"
                value={scope.structure}
                disabled={scope.course || !!scope.tissue}
                onChange={(e) => change({ structure: e.target.value })}
              >
                <option value="">All matching structures</option>
                {scope.anatomy &&
                  scope.structure.startsWith("model:") &&
                  !anatomyQuestionModels().some(
                    (m) => "model:" + m.id === scope.structure,
                  ) && (
                    <option value={scope.structure}>
                      {modelParts.find((m) => m.id === scope.structure.slice(6))
                        ?.name || "Selected 3D structure"}
                    </option>
                  )}
                {scope.anatomy &&
                  anatomyQuestionModels()
                    .filter(
                      (m) =>
                        (!scope.system || m.system === scope.system) &&
                        (!scope.region || m.region === scope.region),
                    )
                    .map((m) => (
                      <option key={m.id} value={"model:" + m.id}>
                        {m.name}
                      </option>
                    ))}
                {!scope.anatomy &&
                  structures
                    .filter(
                      (s) =>
                        (!scope.system || s.system === scope.system) &&
                        (!scope.region || s.region === scope.region),
                    )
                    .map((s) => (
                      <option value={s.id} key={s.id}>
                        {s.name}
                      </option>
                    ))}
              </select>
            </label>
            <label>
              Question type
              <select
                aria-label="Question type"
                disabled={scope.course}
                value={scope.format}
                onChange={(e) => change({ format: e.target.value })}
              >
                <option value="mixed">Mixed practice</option>
                <option value="choice">Multiple choice</option>
                <option value="typed">Typed identification</option>
                <option value="image">Image identification</option>
                <option value="click">
                  {scope.anatomy
                    ? "Select a 3D landmark"
                    : "Click the structure (muscle plate)"}
                </option>
              </select>
            </label>
            <label>
              Question count
              <select
                aria-label="Question count"
                value={scope.count}
                onChange={(e) => change({ count: Number(e.target.value) })}
              >
                {[5, 10, 15, 20, 30].map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
            </label>
            <label>
              Difficulty
              <select
                aria-label="Difficulty"
                value={scope.difficulty}
                onChange={(e) => change({ difficulty: e.target.value })}
              >
                <option>Foundations</option>
                <option>Detailed</option>
              </select>
            </label>
          </div>
          {!scope.course && !scope.anatomy && (
            <details className="combined-topics">
              <summary>
                Combine with other topics <PlusTopicIcon />
              </summary>
              <p>
                Add complete system or tissue-class collections to your main
                scope above.
              </p>
              <div>
                {systems.map((s) => (
                  <label className="checkbox-label" key={s.id}>
                    <input
                      type="checkbox"
                      checked={scope.includeSystems?.includes(s.id) || false}
                      onChange={(e) =>
                        change({
                          includeSystems: e.target.checked
                            ? [...(scope.includeSystems || []), s.id]
                            : (scope.includeSystems || []).filter(
                                (id) => id !== s.id,
                              ),
                        })
                      }
                    />
                    {s.name}
                  </label>
                ))}
                {["Epithelial", "Connective", "Muscle", "Nervous"].map((c) => (
                  <label className="checkbox-label" key={c}>
                    <input
                      type="checkbox"
                      checked={scope.includeTissues?.includes(c) || false}
                      onChange={(e) =>
                        change({
                          includeTissues: e.target.checked
                            ? [...(scope.includeTissues || []), c]
                            : (scope.includeTissues || []).filter(
                                (id) => id !== c,
                              ),
                        })
                      }
                    />
                    {c} tissues
                  </label>
                ))}
              </div>
            </details>
          )}
          <div className="mode-options">
            <button
              className={mode === "Practice" ? "active" : ""}
              onClick={() => setMode("Practice")}
            >
              <Sparkles size={18} />
              <strong>Practice</strong>
              <span>Feedback after each answer</span>
            </button>
            <button
              className={mode === "Exam" ? "active" : ""}
              onClick={() => setMode("Exam")}
            >
              <FileExamIcon />
              <strong>Exam</strong>
              <span>Review after you submit</span>
            </button>
          </div>
          <div className="quiz-toggles">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={scope.missedOnly}
                onChange={(e) => change({ missedOnly: e.target.checked })}
              />
              Previously missed questions
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={timed}
                onChange={(e) => setTimed(e.target.checked)}
              />
              <Clock3 size={15} />
              10-minute timer
            </label>
          </div>
          <div className="quiz-start">
            <span>
              {available} matching questions
              {available < scope.count
                ? " · quiz will use available questions"
                : ""}
            </span>
            <button
              className="primary"
              disabled={!available}
              onClick={() => start()}
            >
              Start {Math.min(available, scope.count)}-question quiz{" "}
              <ArrowRight size={17} />
            </button>
          </div>
          {error && <p className="error">{error}</p>}
        </section>
        <aside>
          <div className="quiz-tip panel">
            <div className="soft-icon">
              <Sparkles size={24} />
            </div>
            <h2>Study with intention.</h2>
            <p>
              Start with one region. Connect its structures to their functions,
              then put your memory to work.
            </p>
            <div>
              <CheckCircle2 size={17} />
              Source-linked explanations
            </div>
            <div>
              <CheckCircle2 size={17} />
              Progress saved on this device
            </div>
            <div>
              <CheckCircle2 size={17} />
              Review based on real mistakes
            </div>
          </div>
          <p className="small muted">
            Image questions use only supported anterior muscle regions and
            educational tissue illustrations. Foundations covers function and
            location; Detailed adds muscle origins, insertions, and innervation.
          </p>
        </aside>
      </div>
    </div>
  );
}
function FileExamIcon() {
  return <SlidersHorizontal size={18} />;
}
function PlusTopicIcon() {
  return <SlidersHorizontal size={14} />;
}
