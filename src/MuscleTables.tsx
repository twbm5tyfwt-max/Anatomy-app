import { useMemo, useState } from "react";
import { getModelStudy, modelParts } from "./modelCatalog";
import { displayName } from "./modelDisplay";
import { shuffle, type Question, type QuizScope } from "./quiz";
import "./study.css";

type Field = "origin" | "insertion" | "actions" | "innervation";
const fields: { id: Field; label: string; ask: string }[] = [
  { id: "origin", label: "Origin", ask: "origin" },
  { id: "insertion", label: "Insertion", ask: "insertion" },
  { id: "actions", label: "Action", ask: "main action" },
  { id: "innervation", label: "Nerve", ask: "nerve supply" },
];

export type MuscleRow = {
  key: string;
  name: string;
  region: string;
  origin: string;
  insertion: string;
  actions: string;
  innervation: string;
  source: string;
};

/** One row per muscle (sides merged) that has reviewed origin, insertion and action. */
export function muscleRows(): MuscleRow[] {
  const rows = new Map<string, MuscleRow>();
  for (const m of modelParts) {
    if (m.layer !== "muscles" || m.parentId || /^left /i.test(m.name) || /\bleft\b/i.test(m.name))
      continue;
    const s = getModelStudy(m);
    if (!s.origin || !s.insertion || !s.actions) continue;
    const name = displayName(m).replace(/^(right|left)\s+/i, "");
    // The source reference may attach a hand muscle's text to its foot namesake (and vice
    // versa). Drop a row whose text names the other limb rather than teach it.
    const text = `${s.origin} ${s.insertion} ${s.actions}`;
    if (/\bof foot\b/i.test(name) && /pisiform|carpal|thumb|finger|digits? of (the )?hand/i.test(text)) continue;
    if (/\bof hand\b/i.test(name) && /calcane|metatarsal|\btoes?\b|hallux|digits? of (the )?foot/i.test(text)) continue;
    const key = name.toLowerCase();
    if (rows.has(key)) continue;
    rows.set(key, {
      key,
      name: name[0].toUpperCase() + name.slice(1),
      region: m.region || "Other",
      origin: s.origin,
      insertion: s.insertion,
      actions: s.actions,
      innervation: s.innervation || "",
      source: s.source,
    });
  }
  return [...rows.values()].sort((a, b) => a.name.localeCompare(b.name));
}

const clip = (t: string, n = 140) => (t.length > n ? t.slice(0, n - 1).trimEnd() + "…" : t);

/** Build multiple-choice questions from the table, mixing directions. */
export function muscleQuestions(
  rows: MuscleRow[],
  use: Field[],
  direction: "forward" | "reverse" | "mixed",
  count: number,
): Question[] {
  const out: Question[] = [];
  for (const r of rows)
    for (const f of use) {
      const value = r[f];
      if (!value) continue;
      const others = rows.filter((o) => o.key !== r.key && o[f] && o[f] !== value);
      const sameRegion = others.filter((o) => o.region === r.region);
      const pool = shuffle([...sameRegion, ...others.filter((o) => o.region !== r.region)]);
      const ask = fields.find((x) => x.id === f)!.ask;
      const base = {
        topic: "muscular",
        aliases: [],
        source: `Muscle table: ${r.source}`,
        explanation: `${r.name}. Origin: ${r.origin} Insertion: ${r.insertion} Action: ${r.actions}${r.innervation ? ` Nerve: ${r.innervation}` : ""}`,
        format: "choice" as const,
      };
      const forward = direction !== "reverse";
      const reverse = direction !== "forward";
      // muscle -> fact
      if (forward) {
        const distract = [...new Set(pool.map((o) => o[f]))].slice(0, 3);
        if (distract.length >= 3)
          out.push({
            ...base,
            id: `muscle-${r.key}-${f}-fact`,
            prompt: `What is the ${ask} of the ${r.name.toLowerCase()}?`,
            answer: clip(value, 160),
            options: shuffle([clip(value, 160), ...distract.map((d) => clip(d, 160))]),
          });
      }
      // fact -> muscle (unique facts only, so the answer is unambiguous)
      if (reverse && rows.filter((o) => o[f] === value).length === 1) {
        const distract = pool.map((o) => o.name).slice(0, 3);
        if (distract.length >= 3)
          out.push({
            ...base,
            id: `muscle-${r.key}-${f}-name`,
            prompt: `Which muscle has this ${ask}? ${clip(value, 200)}`,
            answer: r.name,
            options: shuffle([r.name, ...distract]),
          });
      }
    }
  return shuffle(out).slice(0, count);
}

/** Reference table with a self-test mode, plus quizzes built from it. */
export function MuscleTables({
  onQuiz,
}: {
  onQuiz: (scope: Partial<QuizScope>) => void;
}) {
  const all = useMemo(muscleRows, []);
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState("");
  const [hidden, setHidden] = useState<Field[]>([]);
  const [revealed, setRevealed] = useState<string[]>([]);
  const [use, setUse] = useState<Field[]>(["origin", "insertion", "actions", "innervation"]);
  const [direction, setDirection] = useState<"forward" | "reverse" | "mixed">("mixed");
  const [count, setCount] = useState(15);
  const [msg, setMsg] = useState("");
  const regions = [...new Set(all.map((r) => r.region))].sort();
  const rows = all.filter(
    (r) =>
      (!region || r.region === region) &&
      (!search || r.name.toLowerCase().includes(search.toLowerCase())),
  );
  const withNerve = rows.filter((r) => r.innervation).length;

  function start() {
    const usable = use.filter((f) => f !== "innervation" || withNerve >= 4);
    const qs = muscleQuestions(rows, usable, direction, count);
    if (qs.length < 4) {
      setMsg(
        "Not enough muscles in this filter to build a quiz. Choose a wider region or more fields.",
      );
      return;
    }
    setMsg("");
    onQuiz({ custom: qs, scopeLabel: "Muscle tables" });
  }

  return (
    <div className="sh-grid" style={{ gridTemplateColumns: "1fr" }}>
      <article className="sh-card">
        <h2>Quiz me on origins, insertions, actions and nerves</h2>
        <div className="sh-row sh-chips" role="group" aria-label="Fields">
          {fields.map((f) => (
            <button
              key={f.id}
              aria-pressed={use.includes(f.id)}
              onClick={() =>
                setUse((v) => (v.includes(f.id) ? v.filter((x) => x !== f.id) : [...v, f.id]))
              }
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="sh-row">
          <label>
            Direction{" "}
            <select value={direction} onChange={(e) => setDirection(e.target.value as typeof direction)}>
              <option value="mixed">Both ways</option>
              <option value="forward">Muscle → fact</option>
              <option value="reverse">Fact → muscle</option>
            </select>
          </label>
          <label>
            Questions{" "}
            <select value={count} onChange={(e) => setCount(+e.target.value)}>
              {[10, 15, 25, 40].map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
          </label>
          <button className="primary" disabled={!use.length} onClick={start}>
            Start muscle quiz ({rows.length} muscles in view)
          </button>
        </div>
        {msg && <p role="alert">{msg}</p>}
        <p className="sh-note">
          The table covers {all.length} muscles with reviewed origin, insertion and
          action; {all.filter((r) => r.innervation).length} also have a nerve. Muscles
          without a reviewed entry are left out rather than guessed.
        </p>
      </article>
      <article className="sh-card">
        <h2>Muscle table</h2>
        <div className="sh-row">
          <input
            type="search"
            aria-label="Search muscles"
            placeholder="Search muscles…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select aria-label="Region" value={region} onChange={(e) => setRegion(e.target.value)}>
            <option value="">All regions</option>
            {regions.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
          <span className="sh-note">Cover columns to test yourself:</span>
          <span className="sh-chips sh-row" role="group" aria-label="Cover columns">
            {fields.map((f) => (
              <button
                key={f.id}
                aria-pressed={hidden.includes(f.id)}
                onClick={() => {
                  setRevealed([]);
                  setHidden((v) => (v.includes(f.id) ? v.filter((x) => x !== f.id) : [...v, f.id]));
                }}
              >
                {f.label}
              </button>
            ))}
          </span>
        </div>
        <div className="sh-scroll">
          <table className="sh-table">
            <thead>
              <tr>
                <th>Muscle</th>
                {fields.map((f) => (
                  <th key={f.id}>{f.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.key}>
                  <td>
                    <strong>{r.name}</strong>
                    <br />
                    <small>{r.region}</small>
                  </td>
                  {fields.map((f) => {
                    const covered = hidden.includes(f.id) && !revealed.includes(r.key + f.id);
                    return (
                      <td
                        key={f.id}
                        className={covered ? "hide" : ""}
                        onClick={() => covered && setRevealed((v) => [...v, r.key + f.id])}
                        title={covered ? "Click to reveal" : undefined}
                      >
                        {r[f.id] || <em className="sh-note">not in dataset</em>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </div>
  );
}
