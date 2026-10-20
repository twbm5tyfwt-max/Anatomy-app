import { useMemo, useState } from "react";
import { regionNames, regionParts } from "./atlasDomain";
import type { ModelPart } from "./modelCatalog";
import type { StudyCollection } from "./studyCollections";
import "./games.css";
import { tissueColor } from "./tissueColors";
import { landmarkCounts } from "./LandmarkGame";

export const gameModes = [
  { id: "Find & click", title: "Find & click", text: "Click the named structure on the 3D model." },
  { id: "Structure → name", title: "Name it", text: "See an isolated structure, pick its name." },
  { id: "Structure → function", title: "Match function", text: "Pick what the structure does." },
  { id: "Memory matching", title: "Memory", text: "Flip cards to pair identical names." },
  { id: "Landmarks", title: "Landmarks", text: "Name the marked point on a bone (humerus, tibia, mandible…)." },
  { id: "Tissue identification", title: "Tissues", text: "Identify tissue diagrams linked to your picks." },
] as const;

export const structureGroups: { id: string; label: string; layers: string[] }[] = [
  { id: "bones", label: "Bones", layers: ["bones"] },
  { id: "muscles", label: "Muscles", layers: ["muscles"] },
  { id: "ligaments", label: "Ligaments", layers: ["ligaments"] },
  { id: "tendons", label: "Tendons", layers: ["tendons"] },
  { id: "cartilage", label: "Cartilage & menisci", layers: ["cartilage"] },
  { id: "other", label: "Capsules, fascia & bursae", layers: ["capsules", "fascia", "bursae"] },
  { id: "organs", label: "Organs, vessels & nerves", layers: ["organs"] },
];
export function groupOf(m: ModelPart) {
  return (
    structureGroups.find((g) => g.layers.includes(m.layer || "organs"))?.id ||
    "organs"
  );
}
export const MAX_STRUCTURES = 40;
export const MAX_MEMORY = 10;

const presets: { label: string; region: string; groups: string[] }[] = [
  { label: "Skull bones", region: "Skull", groups: ["bones"] },
  { label: "Knee ligaments", region: "Knee", groups: ["ligaments"] },
  { label: "Knee: bones & cartilage", region: "Knee", groups: ["bones", "cartilage"] },
  { label: "Neck muscles", region: "Neck muscles", groups: ["muscles"] },
  { label: "Shoulder muscles & bones", region: "Shoulder", groups: ["muscles", "bones"] },
  { label: "Spine ligaments", region: "Spine", groups: ["ligaments"] },
];

export function GameSetup({
  collections,
  collectionId,
  setCollectionId,
  region,
  setRegion,
  pool,
  checkedIds,
  setCheckedIds,
  mode,
  setMode,
  seconds,
  setSeconds,
  onStart,
  message,
}: {
  collections: StudyCollection[];
  collectionId: string;
  setCollectionId: (id: string) => void;
  region: string;
  setRegion: (r: string) => void;
  pool: ModelPart[];
  checkedIds: string[];
  setCheckedIds: (f: (v: string[]) => string[]) => void;
  mode: string;
  setMode: (m: string) => void;
  seconds: string;
  setSeconds: (s: string) => void;
  onStart: () => void;
  message: string;
}) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState<string[]>(["bones", "muscles", "ligaments"]);
  const checked = useMemo(() => new Set(checkedIds), [checkedIds]);
  const lmCounts = useMemo(() => landmarkCounts(), []);
  const lmMode = mode === "Landmarks";
  const byGroup = useMemo(() => {
    const out = new Map<string, ModelPart[]>();
    for (const m of lmMode ? pool.filter((p) => lmCounts.has(p.id)) : pool) {
      const g = groupOf(m);
      out.set(g, [...(out.get(g) || []), m]);
    }
    return out;
  }, [pool, lmMode, lmCounts]);
  const limit = mode === "Memory matching" ? MAX_MEMORY : MAX_STRUCTURES;
  const needsStructures = mode !== "Tissue identification";
  const n = lmMode
    ? checkedIds.filter((id) => lmCounts.has(id)).length
    : checkedIds.length;
  const lmTotal = checkedIds.reduce((t, id) => t + (lmCounts.get(id) || 0), 0);
  const ok = lmMode
    ? lmTotal >= 4
    : needsStructures
      ? n >= 2 && n <= limit
      : n >= 2;
  const q = search.trim().toLowerCase();

  function setGroup(id: string, on: boolean) {
    const ids = (byGroup.get(id) || []).map((m) => m.id);
    setCheckedIds((v) =>
      on ? [...new Set([...v, ...ids])] : v.filter((x) => !ids.includes(x)),
    );
  }
  function applyPreset(p: (typeof presets)[number]) {
    setCollectionId("");
    setRegion(p.region);
    // pool recomputes from the region; select its chosen groups once it does
    const ids = regionParts(p.region)
      .filter(
        (m) =>
          !m.parentId &&
          m.layer !== "attachment" &&
          m.layer !== "skin" &&
          p.groups.includes(groupOf(m)),
      )
      .map((m) => m.id)
      .slice(0, MAX_STRUCTURES);
    setTimeout(() => setCheckedIds(() => ids), 0);
    setOpen(p.groups);
  }

  return (
    <div className="gs">
      <section className="gs-step">
        <header>
          <span className="gs-num">1</span>
          <div>
            <h2>What do you want to study?</h2>
            <p>Pick a body region or one of your study collections.</p>
          </div>
        </header>
        <div className="gs-chips" role="group" aria-label="Study area">
          {regionNames.map((r) => (
            <button
              key={r}
              aria-pressed={!collectionId && region === r}
              onClick={() => {
                setCollectionId("");
                setRegion(r);
              }}
            >
              {r}
            </button>
          ))}
        </div>
        {!!collections.length && (
          <div className="gs-chips collections" role="group" aria-label="My study collections">
            <span>My collections</span>
            {collections.map((c) => (
              <button
                key={c.id}
                aria-pressed={collectionId === c.id}
                onClick={() => {
                  setCollectionId(c.id);
                  setRegion("");
                }}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}
        <div className="gs-presets">
          <span>Quick picks</span>
          {presets.map((p) => (
            <button key={p.label} onClick={() => applyPreset(p)}>
              {p.label}
            </button>
          ))}
        </div>
      </section>

      <section className="gs-step">
        <header>
          <span className="gs-num">2</span>
          <div>
            <h2>Tick what you want to be quizzed on</h2>
            <p>
              {pool.length} structures in this area. Only ticked items appear
              in the game.
            </p>
          </div>
          <input
            aria-label="Search study checklist"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search…"
          />
        </header>
        {!pool.length && <p className="gs-empty">Nothing is modeled in this area yet. Pick another.</p>}
        <div className="gs-groups">
          {structureGroups
            .filter((g) => byGroup.has(g.id))
            .map((g) => {
              const items = byGroup.get(g.id)!;
              const shown = items.filter((m) => m.name.toLowerCase().includes(q));
              const count = items.filter((m) => checked.has(m.id)).length;
              const isOpen = open.includes(g.id) || !!q;
              return (
                <div className="gs-group" key={g.id}>
                  <div className="gs-group-head">
                    <button
                      className="gs-fold"
                      aria-expanded={isOpen}
                      onClick={() =>
                        setOpen((o) =>
                          o.includes(g.id) ? o.filter((x) => x !== g.id) : [...o, g.id],
                        )
                      }
                    >
                      <span className="gs-caret">{isOpen ? "▾" : "▸"}</span>
                      <i
                        className="gs-dot"
                        style={{ background: tissueColor(g.layers[0]) }}
                        aria-hidden="true"
                      />
                      {g.label}
                      <b>
                        {count}/{items.length}
                      </b>
                    </button>
                    <button onClick={() => setGroup(g.id, true)}>Select all</button>
                    <button onClick={() => setGroup(g.id, false)}>None</button>
                  </div>
                  {isOpen && (
                    <div className="gs-items">
                      {shown.slice(0, 300).map((m) => (
                        <label key={m.id} className={checked.has(m.id) ? "on" : ""}>
                          <input
                            type="checkbox"
                            checked={checked.has(m.id)}
                            onChange={(e) =>
                              setCheckedIds((v) =>
                                e.target.checked
                                  ? [...v, m.id]
                                  : v.filter((id) => id !== m.id),
                              )
                            }
                          />
                          <i
                            className="gs-dot sm"
                            style={{ background: tissueColor(m.layer) }}
                            aria-hidden="true"
                          />
                          <span>{m.name}</span>
                          {lmCounts.has(m.id) && (
                            <small className="gs-lm">
                              {lmCounts.get(m.id)} landmarks
                            </small>
                          )}
                        </label>
                      ))}
                      {!shown.length && <p className="gs-empty">No matches.</p>}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </section>

      <section className="gs-step">
        <header>
          <span className="gs-num">3</span>
          <div>
            <h2>Choose a game</h2>
            <p>Untimed is the default. Timers pause during feedback and loading.</p>
          </div>
        </header>
        <div className="gs-modes" role="radiogroup" aria-label="Game">
          {gameModes.map((g) => (
            <button
              key={g.id}
              role="radio"
              aria-checked={mode === g.id}
              onClick={() => setMode(g.id)}
            >
              <strong>{g.title}</strong>
              <span>{g.text}</span>
            </button>
          ))}
        </div>
      </section>

      <div className="gs-bar" role="region" aria-label="Start game">
        <div className="gs-summary">
          <strong>
            {n} selected
          </strong>
          <span>
            {lmMode
              ? `${lmTotal} landmarks on ${n} bone${n === 1 ? "" : "s"} · need at least 4`
              : needsStructures
                ? `Need 2–${limit} for this game`
                : "Tissues come from your picks"}
          </span>
        </div>
        <div className="gs-timer" role="group" aria-label="Timer">
          {[
            ["0", "Untimed"],
            ["60", "60s"],
            ["120", "120s"],
          ].map(([v, l]) => (
            <button key={v} aria-pressed={seconds === v} onClick={() => setSeconds(v)}>
              {l}
            </button>
          ))}
        </div>
        <button className="primary" disabled={!ok} onClick={onStart}>
          Start
        </button>
      </div>
      {message && (
        <p role="alert" className="gs-msg">
          {message}
        </p>
      )}
    </div>
  );
}
