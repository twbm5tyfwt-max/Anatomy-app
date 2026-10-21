import { useState } from "react";
import {
  examToQuestions,
  loadExams,
  parseExam,
  saveExams,
  type ParsedQuestion,
  type PracticeExam,
} from "./examImport";
import type { Question } from "./quiz";
import "./exams.css";

/** Turn your own practice questions into a quiz. Everything stays in this browser. */
export function PracticeExams({
  onStart,
}: {
  onStart: (questions: Question[]) => void;
}) {
  const [exams, setExams] = useState<PracticeExam[]>(loadExams);
  const [editing, setEditing] = useState<PracticeExam | null>(null);
  const [text, setText] = useState("");
  const [name, setName] = useState("");
  const [parsed, setParsed] = useState<ParsedQuestion[]>([]);
  const [source, setSource] = useState("pasted text");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  function persist(next: PracticeExam[]) {
    setExams(next);
    saveExams(next);
  }
  function openNew() {
    setEditing({ id: crypto.randomUUID(), name: "", created: "", source: "", questions: [] });
    setText("");
    setName("My practice exam");
    setParsed([]);
    setSource("pasted text");
    setError("");
  }
  function openEdit(e: PracticeExam) {
    setEditing(e);
    setText("");
    setName(e.name);
    setParsed(e.questions);
    setSource(e.source);
    setError("");
  }
  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setBusy("Reading your file locally…");
    setError("");
    try {
      const { importReferences } = await import("./documentImport");
      let all = "";
      for (const f of Array.from(files)) {
        const refs = await importReferences(f, setBusy);
        all += refs.map((r) => r.text).join("\n") + "\n";
        setSource(f.name);
      }
      setText((t) => (t ? t + "\n" : "") + all);
      const q = parseExam(all);
      setParsed((old) => [...old, ...q]);
      if (!q.length)
        setError(
          "No numbered questions were found in that file. Check the text box, add numbers like “1.” and options like “A.”, then press Find questions.",
        );
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy("");
    }
  }
  function find() {
    const q = parseExam(text);
    setParsed(q);
    setError(q.length ? "" : "No numbered questions were found. Use “1.” for questions and “A.” for options.");
  }
  function update(i: number, patch: Partial<ParsedQuestion>) {
    setParsed((old) =>
      old.map((q, j) => {
        if (j !== i) return q;
        const next = { ...q, ...patch };
        next.flags = q.flags.filter(
          (f) => !(next.correct >= 0 && /No correct answer|has no matching/.test(f)),
        );
        return next;
      }),
    );
  }
  function save() {
    if (!editing) return;
    const ready = parsed.filter((q) =>
      q.options.length ? q.correct >= 0 : !!q.typedAnswer,
    );
    if (!name.trim() || !ready.length) {
      setError("Name the exam and make sure at least one question has a correct answer.");
      return;
    }
    const exam: PracticeExam = {
      ...editing,
      name: name.trim(),
      source,
      created: editing.created || new Date().toISOString(),
      questions: parsed,
    };
    persist([...exams.filter((x) => x.id !== exam.id), exam]);
    setEditing(null);
  }
  const ready = parsed.filter((q) => (q.options.length ? q.correct >= 0 : !!q.typedAnswer)).length;

  return (
    <section className="pe" aria-label="My practice exams">
      <header>
        <div>
          <h2>My practice exams</h2>
          <p>
            Paste or upload your own questions (numbered, with A/B/C/D options and
            an answer or answer key) and quiz yourself on exactly those.
          </p>
        </div>
        <button className="primary" onClick={openNew}>
          + Add practice exam
        </button>
      </header>
      {!!exams.length && (
        <ul className="pe-list">
          {exams.map((e) => {
            const n = examToQuestions(e).length;
            return (
              <li key={e.id}>
                <div>
                  <strong>{e.name}</strong>
                  <span>
                    {n} question{n === 1 ? "" : "s"} ready
                    {e.questions.length > n ? ` · ${e.questions.length - n} need an answer` : ""}
                  </span>
                </div>
                <button className="primary" disabled={!n} onClick={() => onStart(examToQuestions(e))}>
                  Start
                </button>
                <button onClick={() => openEdit(e)}>Edit</button>
                <button
                  onClick={() => {
                    if (window.confirm(`Delete “${e.name}”?`))
                      persist(exams.filter((x) => x.id !== e.id));
                  }}
                >
                  Delete
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {editing && (
        <div className="modal-backdrop">
          <section className="modal pe-modal" role="dialog" aria-modal="true" aria-label="Practice exam editor">
            <button className="modal-close icon-button" aria-label="Close practice exam editor" onClick={() => setEditing(null)}>
              ×
            </button>
            <h2>Practice exam</h2>
            <label>
              Exam name
              <input value={name} placeholder="e.g. Lab practical 2" onChange={(e) => setName(e.target.value)} />
            </label>
            <label>
              Paste your questions
              <textarea
                rows={7}
                value={text}
                placeholder={"1. Which bone forms the lower jaw?\nA. Maxilla\nB. Mandible\nC. Zygomatic\nD. Frontal\nAnswer: B"}
                onChange={(e) => setText(e.target.value)}
              />
            </label>
            <div className="pe-actions">
              <button onClick={find} disabled={!text.trim()}>
                Find questions
              </button>
              <label className="pe-file">
                Or upload a PDF, slides, photo or text file
                <input
                  type="file"
                  aria-label="Practice exam file"
                  accept=".pdf,.pptx,.txt,.md,.csv,image/*"
                  disabled={!!busy}
                  onChange={(e) => void upload(e.target.files)}
                />
              </label>
            </div>
            {busy && <p role="status">{busy}</p>}
            <p className="pe-note">
              Files are read in this browser; nothing is uploaded. Photos and
              scans use local OCR, so check every question below. Questions that
              depend on a picture can't be imported as pictures: add the text
              version, or use the point-to-part questions from a study tab.
            </p>
            {!!parsed.length && (
              <>
                <h3>
                  {ready} of {parsed.length} questions ready
                </h3>
                <ol className="pe-review">
                  {parsed.map((q, i) => (
                    <li key={i} className={q.flags.length && !(q.options.length ? q.correct >= 0 : q.typedAnswer) ? "todo" : ""}>
                      <textarea
                        aria-label={`Question ${i + 1}`}
                        rows={2}
                        value={q.prompt}
                        onChange={(e) => update(i, { prompt: e.target.value })}
                      />
                      {q.options.length ? (
                        <div className="pe-options">
                          {q.options.map((o, j) => (
                            <label key={j} className={q.correct === j ? "on" : ""}>
                              <input
                                type="radio"
                                name={`correct-${i}`}
                                checked={q.correct === j}
                                onChange={() => update(i, { correct: j })}
                              />
                              <input
                                className="pe-opt"
                                aria-label={`Question ${i + 1} option ${"ABCDEFGH"[j]}`}
                                value={o}
                                onChange={(e) =>
                                  update(i, {
                                    options: q.options.map((x, k) => (k === j ? e.target.value : x)),
                                  })
                                }
                              />
                            </label>
                          ))}
                        </div>
                      ) : (
                        <input
                          aria-label={`Question ${i + 1} answer`}
                          placeholder="Correct answer"
                          value={q.typedAnswer || ""}
                          onChange={(e) => update(i, { typedAnswer: e.target.value })}
                        />
                      )}
                      {q.flags.map((f) => (
                        <small key={f} className="pe-flag">
                          {f}
                        </small>
                      ))}
                      <button
                        className="pe-remove"
                        onClick={() => setParsed((old) => old.filter((_, j) => j !== i))}
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ol>
              </>
            )}
            {error && <p role="alert" className="pe-error">{error}</p>}
            <button className="primary" disabled={!!busy || !ready} onClick={save}>
              Save exam ({ready})
            </button>
          </section>
        </div>
      )}
    </section>
  );
}
