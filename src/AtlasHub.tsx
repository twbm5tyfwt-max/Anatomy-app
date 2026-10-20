import { useEffect, useMemo, useState, type ComponentProps } from "react";
import { Explorer3D } from "./Explorer3D";
import { useStored, getFile, deleteFile } from "./storage";
import { modelParts } from "./modelCatalog";
import {
  matchNotes,
  type StudyCollection,
  type Reference,
} from "./studyCollections";
import { readAtlasState } from "./workspaceStorage";
type Props = ComponentProps<typeof Explorer3D> & {
  onCollectionQuiz: (c: StudyCollection) => void;
  onCollectionGame: (c: StudyCollection) => void;
};
export function AtlasHub(props: Props) {
  const [collections, setCollections] = useStored<StudyCollection[]>(
    "forma-collections-v1",
    [],
  );
  const [active, setActive] = useState("main");
  useEffect(()=>{setActive("main")},[props.visible,props.region,props.request.version]);
  useEffect(() => {
    const f = () => setActive("main");
    window.addEventListener("forma-region", f);
    return () => window.removeEventListener("forma-region", f);
  }, []);
  const [editing, setEditing] = useState<StudyCollection | null | undefined>();
  const [draft, setDraft] = useState("");
  const [name, setName] = useState("");
  const [refs, setRefs] = useState<Reference[]>([]);
  const [confirmed, setConfirmed] = useState<string[]>([]);
  const [manual, setManual] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const review = useMemo(
    () =>
      matchNotes([
        ...refs,
        ...(draft.trim()
          ? [
              {
                file: "Pasted notes",
                page: 1,
                text: draft,
                kind: "note" as const,
              },
            ]
          : []),
      ]),
    [refs, draft],
  );
  function edit(c: StudyCollection | null) {
    setEditing(c);
    setName(c?.name || "My study model");
    setRefs(c?.references || []);
    setConfirmed(c?.ids || []);
    setDraft("");
    setManual("");
    setError("");
  }
  function toggle(id: string) {
    setConfirmed((v) =>
      v.includes(id) ? v.filter((x) => x !== id) : [...v, id],
    );
  }
  async function upload(files: FileList | null) {
    if (!files) return;
    setBusy(true);
    setError("");
    try {
      const { importReferences } = await import("./documentImport");
      let additions: Reference[] = [];
      for (const file of Array.from(files))
        additions.push(...(await importReferences(file)));
      setRefs((v) => [...v, ...additions]);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }
  async function open(ref: Reference) {
    try {
      if (!ref.fileId) return;
      const f = await getFile(ref.fileId);
      if (!f) throw new Error("Original file is no longer in browser storage.");
      const url = URL.createObjectURL(f);
      window.open(url, "_blank", "noopener");
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (e) {
      setError(String(e));
    }
  }
  function save() {
    if (!name.trim() || !confirmed.length) {
      setError(
        "Name the workspace and confirm at least one available structure.",
      );
      return;
    }
    const c: StudyCollection = {
      id: editing?.id || crypto.randomUUID(),
      name: name.trim(),
      ids: [...new Set(confirmed)].filter((id) =>
        modelParts.some((m) => m.id === id),
      ),
      references: [
        ...refs,
        ...(draft.trim()
          ? [
              {
                file: "Pasted notes",
                page: 1,
                text: draft,
                kind: "note" as const,
              },
            ]
          : []),
      ],
      created: editing?.created || new Date().toISOString(),
    };
    setCollections((old) => [...old.filter((x) => x.id !== c.id), c]);
    setActive(c.id);
    setEditing(undefined);
  }
  return (
    <>
      <div
        className="study-workspaces"
        role="tablist"
        aria-label="Study models"
      >
        <button
          role="tab"
          aria-selected={active === "main"}
          onClick={() => setActive("main")}
        >
          Full body
        </button>
        {collections.map((c) => (
          <button
            key={c.id}
            role="tab"
            aria-selected={active === c.id}
            onClick={() => setActive(c.id)}
          >
            {c.name}
          </button>
        ))}
        <button aria-label="Add study model" onClick={() => edit(null)}>
          + Study model
        </button>
      </div>
      <div hidden={active !== "main"}>
        <Explorer3D
          {...props}
          workspaceId="main"
          onNewStudy={() => edit(null)}
        />
      </div>
      {collections.map((c) => (
        <div key={c.id} hidden={active !== c.id}>
          {active === c.id && (
            <>
              <div className="collection-actions">
                <strong>{c.name}</strong>
                <span>
                  {c.ids.length} confirmed structures · independent viewer
                </span>
                <button onClick={() => edit(c)}>Edit collection</button>
                <button onClick={() => props.onCollectionQuiz(c)}>
                  Quiz collection
                </button>
                <button onClick={() => props.onCollectionGame(c)}>
                  Play collection
                </button>
                <button
                  onClick={() => {
                    if (
                      !window.confirm(
                        `Delete “${c.name}”? Main body and progress are kept.`,
                      )
                    )
                      return;
                    setCollections((old) => old.filter((x) => x.id !== c.id));
                    setActive("main");
                    const remaining = collections.filter((x) => x.id !== c.id);
                    for (const r of c.references)
                      if (
                        r.fileId &&
                        !remaining.some((other) =>
                          other.references.some((x) => x.fileId === r.fileId),
                        )
                      )
                        void deleteFile(r.fileId);
                    localStorage.removeItem("forma-atlas-v2-" + c.id);
                  }}
                >
                  Delete workspace
                </button>
              </div>
              <CollectionViewer
                key={c.ids.join(",")}
                {...props}
                collection={c}
                onNewStudy={() => edit(null)}
              />
            </>
          )}
        </div>
      ))}
      {editing !== undefined && (
        <div className="modal-backdrop">
          <section
            className="modal study-editor"
            role="dialog"
            aria-modal="true"
            aria-labelledby="study-editor-title"
          >
            <button
              className="modal-close icon-button"
              aria-label="Close study editor"
              onClick={() => setEditing(undefined)}
            >
              ×
            </button>
            <h2 id="study-editor-title">
              Create a study model from your notes
            </h2>
            <p>
              Files stay in this browser: originals in IndexedDB, reviewed text
              and collections in localStorage. No external service, AI, or OCR
              receives your material. Clearing browser data removes it.
            </p>
            <label>
              Workspace name
              <input
                aria-label="Workspace name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <label>
              Upload materials
              <input
                aria-label="Study workspace files"
                type="file"
                multiple
                accept=".pdf,.pptx,.txt,.md,.csv,image/*"
                disabled={busy}
                onChange={(e) => void upload(e.target.files)}
              />
            </label>
            {busy && <p role="status">Extracting locally…</p>}
            <label>
              Paste notes
              <textarea
                aria-label="Study workspace notes"
                rows={4}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="For example: right masseter, left temporal bone, rectus abdominis"
              />
            </label>
            {refs.map((r, i) => (
              <details key={i}>
                <summary>
                  {r.file} · {r.kind} {r.page}{" "}
                  {r.text.trim() ? "" : "— transcription required"}
                </summary>
                <button onClick={() => void open(r)}>Open original</button>
                <button
                  onClick={() =>
                    setRefs((old) => old.filter((_, j) => j !== i))
                  }
                >
                  Remove reference
                </button>
                <textarea
                  aria-label={`Transcription ${r.file} ${r.page}`}
                  value={r.text}
                  onChange={(e) =>
                    setRefs((old) =>
                      old.map((v, j) =>
                        j === i ? { ...v, text: e.target.value } : v,
                      ),
                    )
                  }
                />
              </details>
            ))}
            <h3>Review matches before creating the model</h3>
            <p>
              Nothing is confirmed automatically. Unsided or shortened terms can
              match several structures: choose the exact side and component. A
              matching name does not verify the rest of your notes.
            </p>
            <div className="match-review">
              {review.matches.map((row) => (
                <details key={row.term} open={review.matches.length < 10}>
                  <summary>
                    {row.term} ·{" "}
                    {row.exact ? "exact name" : "resolve side / component"} (
                    {row.ids.length})
                  </summary>
                  <small>
                    {row.references
                      .map((r) => `${r.file}, ${r.kind} ${r.page}`)
                      .join("; ")}
                  </small>
                  {row.ids.map((id) => (
                    <label key={id}>
                      <input
                        type="checkbox"
                        checked={confirmed.includes(id)}
                        onChange={() => toggle(id)}
                      />
                      {modelParts.find((m) => m.id === id)?.name}
                    </label>
                  ))}
                </details>
              ))}
            </div>
            {!!review.unmatched.length && (
              <details>
                <summary>
                  {review.unmatched.length} unmatched / unsupported passages —
                  review manually
                </summary>
                {review.unmatched.map((r, i) => (
                  <p key={i}>
                    {r.file} {r.kind} {r.page}:{" "}
                    {r.text ||
                      "Image or scanned page: enter a transcription. No 3D geometry can be extracted from an image."}
                  </p>
                ))}
                <p>
                  Alveoli/bronchioles have a teaching diagram only;
                  female-specific organs are not in the bundled 3D source.
                  Unmatched text is never converted into invented anatomy.
                </p>
              </details>
            )}
            <label>
              Manually find a source structure
              <input
                aria-label="Add structure manually"
                value={manual}
                onChange={(e) => setManual(e.target.value)}
              />
            </label>
            {manual.length > 1 && (
              <div className="manual-matches">
                {modelParts
                  .filter(
                    (m) =>
                      !m.parentId &&
                      m.layer !== "attachment" &&
                      m.name.toLowerCase().includes(manual.toLowerCase()),
                  )
                  .slice(0, 30)
                  .map((m) => (
                    <label key={m.id}>
                      <input
                        type="checkbox"
                        checked={confirmed.includes(m.id)}
                        onChange={() => toggle(m.id)}
                      />
                      {m.name}
                    </label>
                  ))}
              </div>
            )}
            <details>
              <summary>
                {confirmed.length} confirmed structures (remove any)
              </summary>
              {confirmed.map((id) => (
                <button key={id} onClick={() => toggle(id)}>
                  Remove {modelParts.find((m) => m.id === id)?.name}
                </button>
              ))}
            </details>
            {error && <p role="alert">{error}</p>}
            <button className="primary" disabled={busy} onClick={save}>
              Save study workspace
            </button>
          </section>
        </div>
      )}
    </>
  );
}
function CollectionViewer({
  collection,
  ...props
}: Props & { collection: StudyCollection }) {
  const ids = [
    ...collection.ids,
    ...modelParts
      .filter((m) => m.parentId && collection.ids.includes(m.parentId))
      .map((m) => m.id),
  ];
  const [visible, setVisible] = useState(
    () =>
      readAtlasState(collection.id)?.visible || [
        ...new Set(
          modelParts.filter((m) => ids.includes(m.id)).map((m) => m.system),
        ),
      ],
  );
  return (
    <Explorer3D
      {...props}
      workspaceId={collection.id}
      highlightedSystems={[]}
      onClearHighlights={() => {}}
      onSelect={() => {}}
      allowedIds={ids}
      visible={visible}
      onVisibleChange={setVisible}
      region=""
      onRegionChange={() => {}}
      request={{ id: "", version: 0 }}
      onQuiz={() => props.onCollectionQuiz(collection)}
    />
  );
}
