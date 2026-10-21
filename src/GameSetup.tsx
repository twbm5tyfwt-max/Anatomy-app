import { useMemo, useState } from "react";
import { regionNames, regionParts } from "./atlasDomain";
import type { ModelPart } from "./modelCatalog";
import type { StudyCollection } from "./studyCollections";
import "./games.css";
import { tissueColor } from "./tissueColors";
import { landmarkCounts } from "./LandmarkGame";
import {
  MODES,
  difficulties,
  stars,
  type Difficulty,
  type GameSettings,
  type GameStats,
  type ModeId,
  type Playlist,
} from "./gameStats";
import { canPlayOdd } from "./gameRounds";

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
  difficulty,
  setDifficulty,
  players,
  setPlayers,
  stats,
  settings,
  setSettings,
  quick,
  onPlaylist,
  onDeletePlaylist,
  onSavePlaylist,
}: {
  collections: StudyCollection[];
  collectionId: string;
  setCollectionId: (id: string) => void;
  region: string;
  setRegion: (r: string) => void;
  pool: ModelPart[];
  checkedIds: string[];
  setCheckedIds: (f: (v: string[]) => string[]) => void;
  mode: ModeId;
  setMode: (m: ModeId) => void;
  seconds: string;
  setSeconds: (s: string) => void;
  onStart: () => void;
  message: string;
  difficulty: Difficulty;
  setDifficulty: (d: Difficulty) => void;
  players: 1 | 2;
  setPlayers: (p: 1 | 2) => void;
  stats: GameStats;
  settings: GameSettings;
  setSettings: (s: GameSettings) => void;
  quick: { label: string; sub: string; disabled?: boolean; onClick: () => void }[];
  onPlaylist: (p: Playlist) => void;
  onDeletePlaylist: (id: string) => void;
  onSavePlaylist: (name: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState<string[]>(["bones", "muscles", "ligaments"]);
  const checked = useMemo(() => new Set(checkedIds), [checkedIds]);
  const lmCounts = useMemo(() => landmarkCounts(), []);
  const lmMode = mode === "landmark";
  const [listName, setListName] = useState("");
  const info = MODES.find((m) => m.id === mode)!;
  const byId = useMemo(() => new Map(pool.map((m) => [m.id, m])), [pool]);
  const byGroup = useMemo(() => {
    const out = new Map<string, ModelPart[]>();
    for (const m of lmMode ? pool.filter((p) => lmCounts.has(p.id)) : pool) {
      const g = groupOf(m);
      out.set(g, [...(out.get(g) || []), m]);
    }
    return out;
  }, [pool, lmMode, lmCounts]);
  const limit = info.max;
  const picked = checkedIds.map((id) => byId.get(id)).filter(Boolean) as ModelPart[];
  const needsStructures = mode !== "tissue";
  const n = lmMode ? checkedIds.filter((id) => lmCounts.has(id)).length : checkedIds.length;
  const lmTotal = checkedIds.reduce((t, id) => t + (lmCounts.get(id) || 0), 0);
  const muscles = picked.filter((m) => m.layer === "muscles").length;
  const ok = lmMode
    ? lmTotal >= 4
    : mode === "match"
      ? muscles >= 4
      : mode === "odd"
        ? canPlayOdd(picked)
        : needsStructures
          ? n >= info.min && n <= limit
          : n >= 2;
  const need =
    mode === "odd"
      ? "needs 3 of one tissue plus another tissue"
      : mode === "match"
        ? `${muscles} muscles ticked · need at least 4`
        : `Need ${info.min}–${limit} for this game`;
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
      <section className="gs-home" aria-label="Quick start">
        <div className="gs-quick">
          {quick.map((q) => (
            <button key={q.label} disabled={q.disabled} onClick={q.onClick}>
              <strong>{q.label}</strong>
              <span>{q.sub}</span>
            </button>
          ))}
        </div>
        {!!stats.playlists.length && (
          <div className="gs-lists" aria-label="My playlists">
            <span>My playlists</span>
            {stats.playlists.map((p) => (
              <span key={p.id} className="gs-list">
                <button onClick={() => onPlaylist(p)}>{p.name}</button>
                <button aria-label={`Delete playlist ${p.name}`} onClick={() => onDeletePlaylist(p.id)}>
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
        {stats.totalPoints > 0 && <p className="gs-total">{stats.totalPoints.toLocaleString()} points earned in total</p>}
      </section>
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
                          {stars(stats.mastery["s:" + m.id]) > 0 && (
                            <small className="gs-stars" title="Mastery from your game answers">
                              {"★".repeat(stars(stats.mastery["s:" + m.id]))}
                            </small>
                          )}
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
        {(["On the 3D model", "Quick thinking", "Exam practice"] as const).map((group) => (
          <div key={group}>
            <h3 className="gs-group-title">{group}</h3>
            <div className="gs-modes" role="radiogroup" aria-label={group}>
              {MODES.filter((g) => g.group === group).map((g) => (
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
          </div>
        ))}
        <div className="gs-options">
          <div role="radiogroup" aria-label="Difficulty" className="gs-seg">
            {difficulties.map((d) => (
              <button
                key={d.id}
                role="radio"
                aria-checked={difficulty === d.id}
                title={d.text}
                onClick={() => setDifficulty(d.id)}
              >
                {d.label}
              </button>
            ))}
          </div>
          <span className="gs-hint">{difficulties.find((d) => d.id === difficulty)!.text}</span>
          <div role="radiogroup" aria-label="Players" className="gs-seg">
            {([1, 2] as const).map((p) => (
              <button key={p} role="radio" aria-checked={players === p} onClick={() => setPlayers(p)}>
                {p === 1 ? "1 player" : "Pass & play (2)"}
              </button>
            ))}
          </div>
        </div>
        <details className="gs-settings">
          <summary>Game settings</summary>
          {(
            [
              ["light", "Light graphics (older laptops and phones)"],
              ["colorblind", "Colour-blind friendly colours"],
              ["sound", "Sound effects"],
              ["haptics", "Vibration feedback"],
            ] as const
          ).map(([k, label]) => (
            <label key={k}>
              <input
                type="checkbox"
                checked={settings[k]}
                onChange={(e) => setSettings({ ...settings, [k]: e.target.checked })}
              />{" "}
              {label}
            </label>
          ))}
        </details>
      </section>

      <div className="gs-bar" role="region" aria-label="Start game">
        <div className="gs-summary">
          <strong>{n} selected</strong>
          <span>
            {lmMode
              ? `${lmTotal} landmarks on ${n} bone${n === 1 ? "" : "s"} · need at least 4`
              : needsStructures
                ? need
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
        <span className="gs-save">
          <input
            aria-label="Playlist name"
            placeholder="Save as playlist…"
            value={listName}
            onChange={(e) => setListName(e.target.value)}
          />
          <button
            disabled={!ok || !listName.trim()}
            onClick={() => {
              onSavePlaylist(listName.trim());
              setListName("");
            }}
          >
            Save
          </button>
        </span>
      </div>
      {message && (
        <p role="alert" className="gs-msg">
          {message}
        </p>
      )}
    </div>
  );
}
