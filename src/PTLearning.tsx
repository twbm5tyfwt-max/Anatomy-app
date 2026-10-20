import { useMemo, useState } from "react";
import { PTAnatomy } from "./PTAnatomy";
import {
  PT_CONTENT_WRITTEN,
  approaches,
  generalRedFlags,
  healingStages,
  ptRegions,
  ptSources,
  type ExerciseType,
  type PTExercise,
  type PTRegion,
} from "./ptContent";
import "./pt.css";

const tabs = [
  ["anatomy", "Anatomy"],
  ["injuries", "Common injuries"],
  ["healing", "Healing stages"],
  ["exercises", "Exercise examples"],
  ["approaches", "Why treatments are used"],
  ["sources", "Sources"],
] as const;
type Tab = (typeof tabs)[number][0];
const typeFilters: ("All" | ExerciseType)[] = [
  "All",
  "Mobility",
  "Strength",
  "Balance",
  "Functional",
];
const sourceById = new Map(ptSources.map((s) => [s.id, s]));

function regionFor(hint?: string) {
  const h = (hint || "").toLowerCase();
  const found = ptRegions.find(
    (r) =>
      h.includes(r.id) ||
      (h.includes("lower") && r.id === "knee") ||
      (h.includes("upper") && r.id === "shoulder") ||
      (h.includes("head") && r.id === "neck"),
  );
  return found?.id || "knee";
}

export function PTLearning({
  initialRegion,
  onExplore,
  onStructure,
}: {
  initialRegion?: string;
  onExplore: (region: string) => void;
  onStructure: (id: string) => void;
}) {
  const [regionId, setRegionId] = useState(regionFor(initialRegion));
  const [tab, setTab] = useState<Tab>("anatomy");
  const [focus, setFocus] = useState<string | null>(null);
  const [filter, setFilter] = useState<"All" | ExerciseType>("All");
  const [query, setQuery] = useState("");
  const region = ptRegions.find((r) => r.id === regionId)!;

  const search = query.trim().toLowerCase();
  const found = useMemo(() => {
    if (search.length < 2) return [];
    return ptRegions.flatMap((r) => [
      ...r.structures
        .filter((s) => (s.label + " " + s.role).toLowerCase().includes(search))
        .map((s) => ({ region: r, kind: "Structure", label: s.label })),
      ...r.exercises
        .filter((e) =>
          (e.name + " " + e.targets.join(" ")).toLowerCase().includes(search),
        )
        .map((e) => ({ region: r, kind: "Exercise", label: e.name })),
      ...r.injuries
        .filter((i) =>
          (i.name + " " + i.structures.join(" "))
            .toLowerCase()
            .includes(search),
        )
        .map((i) => ({ region: r, kind: "Injury", label: i.name })),
    ]);
  }, [search]);

  function goRegion(id: string, to?: Tab) {
    setRegionId(id);
    setFocus(null);
    setFilter("All");
    if (to) setTab(to);
  }

  return (
    <section className="pt-page">
      <header className="pt-hero">
        <div>
          <p className="eyebrow">PHYSICAL THERAPY / ATHLETIC TRAINING</p>
          <h1>Learn how movement, injury and rehab connect to anatomy</h1>
          <p>
            Pick a region, see the structures in 3D, then study common injuries,
            how tissues heal and example exercises. General education only.
          </p>
        </div>
        <label className="pt-search">
          <span>Find a muscle, injury or exercise</span>
          <input
            type="search"
            value={query}
            placeholder="e.g. hamstring, ankle sprain, bridge"
            onChange={(e) => setQuery(e.target.value)}
          />
          {!!found.length && (
            <ul className="pt-results" role="listbox">
              {found.slice(0, 8).map((f, i) => (
                <li key={i}>
                  <button
                    onClick={() => {
                      goRegion(
                        f.region.id,
                        f.kind === "Exercise"
                          ? "exercises"
                          : f.kind === "Injury"
                            ? "injuries"
                            : "anatomy",
                      );
                      if (f.kind === "Structure") setFocus(f.label);
                      setQuery("");
                    }}
                  >
                    <b>{f.label}</b>
                    <small>
                      {f.kind} · {f.region.name}
                    </small>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </label>
      </header>

      <aside className="pt-disclaimer" role="note">
        <strong>Education, not medical advice.</strong> This section does not
        diagnose a problem or provide a personalised rehabilitation plan.
        Different injuries need different approaches, and no exercise or
        treatment is guaranteed to make tissue heal. See a licensed clinician
        for an injury, symptoms that persist, or any recent surgery.
      </aside>

      <nav className="pt-regions" aria-label="Body region">
        {ptRegions.map((r) => (
          <button
            key={r.id}
            aria-pressed={r.id === regionId}
            onClick={() => goRegion(r.id)}
          >
            {r.name}
          </button>
        ))}
        <button
          className="pt-open-viewer"
          onClick={() => onExplore(region.viewerRegion)}
        >
          Open {region.name.toLowerCase()} in body viewer →
        </button>
      </nav>

      <div className="pt-tabs" role="tablist">
        {tabs.map(([id, label]) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "anatomy" && (
        <PTAnatomy
          region={region}
          focus={focus}
          onFocus={setFocus}
          onOpen={onStructure}
        />
      )}

      {tab === "injuries" && (
        <div className="pt-stack">
          <p className="pt-lead">
            These are common patterns, described in general terms. Pain in a
            region does not tell you which structure is involved; that needs an
            examination.
          </p>
          {region.injuries.map((inj) => (
            <article className="pt-card" key={inj.id}>
              <header>
                <h2>{inj.name}</h2>
                <div className="pt-chips">
                  <span className="pt-chip tissue">{inj.tissue}</span>
                  {inj.structures.map((s) => (
                    <button
                      key={s}
                      className="pt-chip"
                      title="Show this structure in 3D"
                      onClick={() => {
                        setFocus(s);
                        setTab("anatomy");
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </header>
              <p>{inj.what}</p>
              <p className="pt-context">{inj.context}</p>
              <div className="pt-two">
                <div>
                  <h3>General rehabilitation goals</h3>
                  <ul>
                    {inj.goals.map((g) => (
                      <li key={g}>{g}</li>
                    ))}
                  </ul>
                  <button
                    className="pt-link"
                    onClick={() => {
                      setTab("healing");
                    }}
                  >
                    How {inj.tissue.toLowerCase()} heals →
                  </button>
                </div>
                <div className="pt-warn">
                  <h3>When to be assessed by a clinician</h3>
                  <ul>
                    {inj.seeClinician.map((g) => (
                      <li key={g}>{g}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <Cites ids={inj.sources} />
            </article>
          ))}
        </div>
      )}

      {tab === "healing" && (
        <div className="pt-stack">
          <p className="pt-lead">
            Healing overlaps three broad phases and is not a calendar. Tissue
            type, injury severity, age, health, surgery and loading all change
            the timeline, and feeling better does not by itself show a tissue is
            ready for full load.
          </p>
          {(Object.keys(healingStages) as (keyof typeof healingStages)[]).map(
            (tissue) => {
              const data = healingStages[tissue];
              const relevant = region.injuries.some((i) => i.tissue === tissue);
              return (
                <article
                  className={"pt-card" + (relevant ? " relevant" : "")}
                  key={tissue}
                >
                  <header>
                    <h2>{tissue}</h2>
                    {relevant && (
                      <span className="pt-chip tissue">
                        Relevant to {region.name.toLowerCase()} injuries
                      </span>
                    )}
                  </header>
                  <p>{data.blurb}</p>
                  <ol className="pt-stages">
                    {data.stages.map((s) => (
                      <li key={s.stage}>
                        <strong>{s.stage}</strong>
                        <span>{s.what}</span>
                        <em>Typical aim: {s.goal}</em>
                      </li>
                    ))}
                  </ol>
                </article>
              );
            },
          )}
          <Cites ids={["openstax", "nhs-sprains"]} />
        </div>
      )}

      {tab === "exercises" && (
        <div className="pt-stack">
          <p className="pt-lead">
            These are <strong>examples to understand</strong>, not a programme.
            There are no sets, reps or schedules because the right choice
            depends on the injury, its stage and the person. Check with your
            clinician before trying any of them after an injury or surgery.
          </p>
          <div className="pt-filter" role="group" aria-label="Exercise type">
            {typeFilters.map((f) => (
              <button
                key={f}
                aria-pressed={filter === f}
                onClick={() => setFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="pt-grid">
            {region.exercises
              .filter((e) => filter === "All" || e.type === filter)
              .map((e) => (
                <ExerciseCard key={e.id} e={e} region={region} />
              ))}
          </div>
          <aside className="pt-videos">
            <strong>About demonstrations</strong>
            <p>
              This app does not embed exercise videos: none have been licensed
              for redistribution and none are invented. Each exercise cites a
              clinical education page you can open to see illustrations or
              demonstrations authored by that organisation.
            </p>
          </aside>
        </div>
      )}

      {tab === "approaches" && (
        <div className="pt-stack">
          <p className="pt-lead">
            Clinicians choose from several tools. Knowing what each is{" "}
            <em>for</em>, and what it cannot do, helps you read a rehab plan
            critically.
          </p>
          <div className="pt-grid">
            {approaches.map((a) => (
              <article className="pt-card" key={a.name}>
                <h2>{a.name}</h2>
                <h3>Purpose</h3>
                <p>{a.purpose}</p>
                <h3>What is known</h3>
                <p>{a.evidence}</p>
                <h3>Limits</h3>
                <p>{a.limits}</p>
              </article>
            ))}
          </div>
        </div>
      )}

      {tab === "sources" && (
        <div className="pt-stack">
          <article className="pt-card">
            <h2>Citations and review status</h2>
            <p>
              Content in this section was written on{" "}
              <strong>{PT_CONTENT_WRITTEN}</strong> as plain-language education
              based on the topics covered by the pages below. It is not a
              clinical guideline.
            </p>
            <p>
              <strong>Verification limit:</strong> the build environment could
              not open these sites, so the current wording and "last reviewed"
              dates on the linked pages are <em>unverified</em>. Read the date
              on each page before relying on it.
            </p>
            <h3>When to seek urgent care for any problem</h3>
            <ul>
              {generalRedFlags.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </article>
          <table className="pt-table">
            <thead>
              <tr>
                <th>Organisation</th>
                <th>Page</th>
                <th>Page review date</th>
                <th>Link</th>
              </tr>
            </thead>
            <tbody>
              {ptSources.map((s) => (
                <tr key={s.id}>
                  <td>{s.org}</td>
                  <td>{s.title}</td>
                  <td>Not live-checked: see page</td>
                  <td>
                    <a href={s.url} target="_blank" rel="noreferrer">
                      Open ↗
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function Cites({ ids }: { ids: string[] }) {
  return (
    <p className="pt-cites">
      <span>Sources:</span>{" "}
      {ids.map((id, i) => {
        const s = sourceById.get(id);
        if (!s) return null;
        return (
          <span key={id}>
            {i > 0 && " · "}
            <a href={s.url} target="_blank" rel="noreferrer">
              {s.org}: {s.title} ↗
            </a>
          </span>
        );
      })}
    </p>
  );
}

function ExerciseCard({ e }: { e: PTExercise; region: PTRegion }) {
  const [open, setOpen] = useState(false);
  return (
    <article className="pt-card pt-exercise" data-type={e.type}>
      <header>
        <span className={"pt-type " + e.type.toLowerCase()}>{e.type}</span>
        <h2>{e.name}</h2>
      </header>
      <p>
        <strong>Targets:</strong> {e.targets.join(", ")}
      </p>
      <p>
        <strong>Purpose:</strong> {e.purpose}
      </p>
      <button
        className="pt-toggle"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        {open ? "Hide details" : "Technique, mistakes, precautions & levels"}
      </button>
      {open && (
        <div className="pt-detail">
          <h3>Basic technique</h3>
          <ol>
            {e.steps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
          <h3>Common mistakes</h3>
          <ul>
            {e.mistakes.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
          <h3>Precautions</h3>
          <ul className="warn">
            {e.precautions.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
          <div className="pt-levels">
            <div>
              <h3>Easier (regression)</h3>
              <p>{e.regression}</p>
            </div>
            <div>
              <h3>Harder (progression)</h3>
              <p>{e.progression}</p>
            </div>
          </div>
          <Cites ids={e.sources} />
        </div>
      )}
    </article>
  );
}
