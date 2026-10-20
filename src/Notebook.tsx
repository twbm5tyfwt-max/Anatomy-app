import { useMemo, useState } from "react";
import { StickyNote, X, Trash2, Crosshair } from "lucide-react";
import { useStored } from "./storage";
import "./notebook.css";

type Sticky = {
  id: string;
  text: string;
  color: string;
  structureId?: string;
  structureName?: string;
  created: string;
};
const colors = ["#fff3a3", "#ffd0dc", "#cfe8ff", "#d2f5d0", "#e6d8ff"];

/** Sticky-note notebook for one workspace (the full-body model or a study tab). */
export function Notebook({
  workspaceId,
  selectedId,
  selectedName,
  onJump,
}: {
  workspaceId: string;
  selectedId?: string;
  selectedName?: string;
  onJump: (id: string) => void;
}) {
  const [notes, setNotes] = useStored<Sticky[]>(
    "forma-notes-" + workspaceId,
    [],
  );
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [color, setColor] = useState(colors[0]);
  const [attach, setAttach] = useState(true);
  const [filter, setFilter] = useState<"all" | "here">("all");
  const shown = useMemo(
    () =>
      notes.filter(
        (n) => filter === "all" || (selectedId && n.structureId === selectedId),
      ),
    [notes, filter, selectedId],
  );
  const here = selectedId
    ? notes.filter((n) => n.structureId === selectedId).length
    : 0;

  function add() {
    const text = draft.trim();
    if (!text) return;
    setNotes((old) => [
      {
        id: crypto.randomUUID(),
        text,
        color,
        structureId: attach && selectedId ? selectedId : undefined,
        structureName: attach && selectedId ? selectedName : undefined,
        created: new Date().toISOString(),
      },
      ...old,
    ]);
    setDraft("");
  }

  return (
    <>
      <button
        className="pro-reference nb-toggle"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <StickyNote size={14} />
        <span>Notes{notes.length ? ` (${notes.length})` : ""}</span>
        {here > 0 && <i className="nb-dot" title="Notes on the selected structure" />}
      </button>
      {open && (
        <aside className="nb-panel" role="dialog" aria-label="Notebook">
          <header>
            <strong>Notebook</strong>
            <span>{workspaceId === "main" ? "Full body" : "This study tab"}</span>
            <button aria-label="Close notebook" onClick={() => setOpen(false)}>
              <X size={16} />
            </button>
          </header>
          <div className="nb-compose">
            <textarea
              aria-label="New note"
              rows={3}
              value={draft}
              placeholder={
                selectedName
                  ? `Jot something about the ${selectedName.toLowerCase()}…`
                  : "Jot a note, mnemonic or question…"
              }
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === "Enter") add();
              }}
            />
            <div className="nb-row">
              <div className="nb-colors" role="group" aria-label="Note colour">
                {colors.map((c) => (
                  <button
                    key={c}
                    aria-label={`Colour ${c}`}
                    aria-pressed={color === c}
                    style={{ background: c }}
                    onClick={() => setColor(c)}
                  />
                ))}
              </div>
              <button className="primary" disabled={!draft.trim()} onClick={add}>
                Add note
              </button>
            </div>
            {selectedId && (
              <label className="nb-attach">
                <input
                  type="checkbox"
                  checked={attach}
                  onChange={(e) => setAttach(e.target.checked)}
                />
                Attach to {selectedName}
              </label>
            )}
          </div>
          <div className="nb-filter" role="group" aria-label="Show notes">
            <button aria-pressed={filter === "all"} onClick={() => setFilter("all")}>
              All ({notes.length})
            </button>
            <button
              aria-pressed={filter === "here"}
              disabled={!selectedId}
              onClick={() => setFilter("here")}
            >
              This structure ({here})
            </button>
          </div>
          <ul className="nb-list">
            {shown.map((n) => (
              <li key={n.id} style={{ background: n.color }}>
                <textarea
                  aria-label="Edit note"
                  value={n.text}
                  rows={Math.min(6, Math.max(2, n.text.split("\n").length))}
                  onChange={(e) =>
                    setNotes((old) =>
                      old.map((x) =>
                        x.id === n.id ? { ...x, text: e.target.value } : x,
                      ),
                    )
                  }
                />
                <footer>
                  {n.structureId ? (
                    <button
                      className="nb-jump"
                      title="Show this structure in the model"
                      onClick={() => onJump(n.structureId!)}
                    >
                      <Crosshair size={12} />
                      {n.structureName}
                    </button>
                  ) : (
                    <span>General note</span>
                  )}
                  <button
                    aria-label="Delete note"
                    onClick={() =>
                      setNotes((old) => old.filter((x) => x.id !== n.id))
                    }
                  >
                    <Trash2 size={13} />
                  </button>
                </footer>
              </li>
            ))}
            {!shown.length && (
              <li className="nb-empty">
                {filter === "here"
                  ? "No notes on this structure yet."
                  : "No notes yet. Select a structure, then jot down what you want to remember."}
              </li>
            )}
          </ul>
          <small className="nb-foot">
            Saved in this browser only. Ctrl/⌘ + Enter adds the note.
          </small>
        </aside>
      )}
    </>
  );
}
