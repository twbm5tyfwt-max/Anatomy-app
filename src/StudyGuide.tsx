import { AnatomyReading, readingFor } from "./AnatomyReading";
import { useEffect, useState } from "react";
import { getFile, useStored } from "./storage";
import {
  collectionFacts,
  type StudyCollection,
  type Reference,
} from "./studyCollections";
import { ReferenceDefinition } from "./ReferenceDefinition";
export function SourceImage({ reference }: { reference: Reference }) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    let disposed = false,
      objectUrl = "";
    if (reference.fileId)
      void getFile(reference.fileId).then((file) => {
        if (file && !disposed) {
          objectUrl = URL.createObjectURL(file);
          setUrl(objectUrl);
        }
      });
    return () => {
      disposed = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [reference.fileId]);
  return url ? (
    <img
      className="study-source-image"
      src={url}
      alt={`Uploaded reference: ${reference.file}`}
    />
  ) : (
    <p>Original image is not available in this browser.</p>
  );
}
const escape = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
export function StudyGuide({
  collection,
  onStudy,
}: {
  collection: StudyCollection;
  onStudy: (id: string) => void;
}) {
  const facts = collectionFacts(collection.ids);
  const [notes, setNotes] = useStored<Record<string, string>>(
    "forma-guide-notes-" + collection.id,
    {},
  );
  const [known, setKnown] = useStored<string[]>(
    "forma-guide-known-" + collection.id,
    [],
  );
  const [filter, setFilter] = useState("");
  const [group, setGroup] = useState<
    "all" | "bones" | "muscles" | "connective" | "other" | "todo"
  >("all");
  const [openIds, setOpenIds] = useState<string[]>([]);
  const learnedCount = known.filter((id) => collection.ids.includes(id)).length;
  const [error, setError] = useState("");
  async function download() {
    try {
      const images = await Promise.all(
        collection.references
          .filter((r) => r.kind === "image" && r.fileId)
          .map(async (r) => {
            const file = await getFile(r.fileId!);
            if (!file) return "";
            const data = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(String(reader.result));
              reader.onerror = reject;
              reader.readAsDataURL(file);
            });
            return `<figure><img src="${escape(data)}" alt="${escape(r.file)}"><figcaption>${escape(r.file)}</figcaption></figure>`;
          }),
      );
      const html = `<!doctype html><html><meta charset="utf-8"><title>${escape(collection.name)}</title><style>body{font:16px/1.7 system-ui;max-width:960px;margin:40px auto;padding:20px;color:#18283b}article{border-top:1px solid #ccd4de;padding:20px 0}img{max-width:100%;max-height:700px}h1,h2{line-height:1.2}pre{white-space:pre-wrap;font:inherit}small{color:#536174}@media print{body{margin:0}}</style><h1>${escape(collection.name)}</h1><p>Personal anatomy study guide · ${facts.length} confirmed structures</p><h2>My uploaded references</h2>${images.join("")}${collection.references.map((r) => `<h3>${escape(r.file)} · ${r.kind} ${r.page}</h3><pre>${escape(r.text)}</pre>`).join("")}<h2>Structure study notes</h2>${facts
        .map(
          ({ model: m, study: s }) =>
            `<article><h2>${escape(m.name)}</h2>${[
              ["Function", s.function],
              ["Location", s.location],
              ["Landmarks", s.landmarks],
              ["Articulations", s.articulations],
              ["Attachments", s.attachments],
              ["Origin", s.origin],
              ["Insertion", s.insertion],
              ["Actions", s.actions],
              ["Innervation", s.innervation],
              ["My notes", notes[m.id]],
            ]
              .filter(([, v]) => v)
              .map(([k, v]) => `<h3>${k}</h3><p>${escape(v!)}</p>`)
              .join("")}<small>${escape(s.source)}</small>${
              readingFor(m.id)
                ? `<h3>Archived anatomy reference</h3>${readingFor(m.id)!
                    .sections.map(
                      (section) =>
                        `<h4>${escape(section.heading)}</h4><pre>${escape(section.text)}</pre>`,
                    )
                    .join(
                      "",
                    )}<p>Wikipedia contributors, as archived/adapted by Z-Anatomy; CC BY-SA 4.0. <a href="${escape(readingFor(m.id)!.url)}">Article</a> · <a href="${escape(readingFor(m.id)!.history)}">Contributor history</a>. Anatomical sections selected; clinical/animal/variation sections omitted.</p>`
                : ""
            }</article>`,
        )
        .join(
          "",
        )}<p>Educational anatomy adaptations: OpenStax / Rice University, CC BY-NC-SA 4.0. Geometry references: Z-Anatomy / BodyParts3D. Uploaded files retain their original ownership. Only share uploaded materials when you have permission. Archived anatomy readings retain Wikipedia/Z-Anatomy attribution and CC BY-SA terms: https://creativecommons.org/licenses/by-sa/4.0/. Printed notes do not contain a reconstructed 3D model.</p></html>`;
      const url = URL.createObjectURL(new Blob([html], { type: "text/html" }));
      const a = document.createElement("a");
      a.href = url;
      a.download =
        collection.name.replace(/[^a-z0-9 -]/gi, "") + "-study-guide.html";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      setError(String(e));
    }
  }
  return (
    <section className="personal-study-guide">
      <div className="guide-heading">
        <div>
          <p className="eyebrow">FROM YOUR MATERIALS TO UNDERSTANDING</p>
          <h2>{collection.name}</h2>
          <p>
            {facts.length} confirmed structures ·{" "}
            {known.filter((id) => collection.ids.includes(id)).length} marked
            learned
          </p>
        </div>
        <button onClick={() => void download()}>
          Download / print study guide
        </button>
      </div>
      <p className="guide-description">
        Read your source, identify each structure, explain its function, then
        locate its landmarks and relationships. Notes below come from the cited
        anatomy references; your uploaded text stays separate for review.
      </p>
      <details open className="guide-sources">
        <summary>
          My images, pages & notes ({collection.references.length})
        </summary>
        {collection.references.map((r, i) => (
          <article key={i}>
            <h3>
              {r.file} · {r.kind} {r.page}
            </h3>
            {r.kind === "image" && <SourceImage reference={r} />}
            <p className="small muted">
              {r.extraction}
              {r.confidence !== undefined
                ? ` · OCR confidence ${Math.round(r.confidence)}%; this is not anatomical accuracy.`
                : ""}
            </p>
            <pre>
              {r.text ||
                "No readable labels detected. Add a topic or transcription using Edit collection; unlabeled anatomy needs manual identification."}
            </pre>
          </article>
        ))}
      </details>
      {!!facts.length && (
        <div className="guide-toolbar">
          <div
            className="guide-progress"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={facts.length}
            aria-valuenow={learnedCount}
            aria-label="Structures learned"
          >
            <span style={{ width: (learnedCount / facts.length) * 100 + "%" }} />
            <b>
              {learnedCount} of {facts.length} learned
            </b>
          </div>
          <div className="guide-filters" role="group" aria-label="Show">
            {(
              [
                ["all", "All"],
                ["bones", "Bones"],
                ["muscles", "Muscles"],
                ["connective", "Ligaments & connective"],
                ["other", "Other"],
                ["todo", "Not learned yet"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                aria-pressed={group === id}
                onClick={() => setGroup(id)}
              >
                {label}
              </button>
            ))}
            <button onClick={() => setOpenIds(facts.map((f) => f.model.id))}>
              Expand all
            </button>
            <button onClick={() => setOpenIds([])}>Collapse all</button>
          </div>
        </div>
      )}
      <label>
        Find a structure in this guide{" "}
        <input
          aria-label="Search study guide"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </label>
      <div className="guide-structure-list">
        {facts
          .filter(({ model: m }) => {
            if (!m.name.toLowerCase().includes(filter.toLowerCase()))
              return false;
            const l = m.layer || "";
            if (group === "bones") return l === "bones";
            if (group === "muscles") return l === "muscles";
            if (group === "connective")
              return ["ligaments", "tendons", "cartilage", "fascia", "capsules", "bursae"].includes(l);
            if (group === "other")
              return !["bones", "muscles", "ligaments", "tendons", "cartilage", "fascia", "capsules", "bursae"].includes(l);
            if (group === "todo") return !known.includes(m.id);
            return true;
          })
          .map(({ model: m, study: s }) => (
            <details
              key={m.id}
              className="guide-structure"
              open={openIds.includes(m.id)}
              onToggle={(e) => {
                const isOpen = (e.currentTarget as HTMLDetailsElement).open;
                setOpenIds((v) =>
                  isOpen
                    ? v.includes(m.id)
                      ? v
                      : [...v, m.id]
                    : v.filter((x) => x !== m.id),
                );
              }}
            >
              <summary className="guide-structure-heading">
                <h3>{m.name}</h3>
                <span className="guide-kind">{m.layer}</span>
                <label onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={known.includes(m.id)}
                    onChange={(e) =>
                      setKnown((v) =>
                        e.target.checked
                          ? [...v, m.id]
                          : v.filter((id) => id !== m.id),
                      )
                    }
                  />
                  Learned
                </label>
              </summary>
              <button className="guide-find" onClick={() => onStudy(m.id)}>
                Find in my 3D model
              </button>
              <p>
                <strong>Function:</strong> {s.function}
              </p>
              <p>
                <strong>Location:</strong> {s.location}
              </p>
              <ReferenceDefinition id={m.id} />
              <AnatomyReading id={m.id} />
              <details>
                <summary>Landmarks, attachments & relationships</summary>
                {[
                  ["Landmarks", s.landmarks],
                  ["Articulations", s.articulations],
                  ["Muscle / ligament attachments", s.attachments],
                  ["Origin", s.origin],
                  ["Insertion", s.insertion],
                  ["Actions", s.actions],
                  ["Innervation", s.innervation],
                ]
                  .filter(([, v]) => v)
                  .map(([k, v]) => (
                    <p key={k}>
                      <strong>{k}:</strong> {v}
                    </p>
                  ))}
                {!s.origin && !s.landmarks && (
                  <p>
                    A detailed attachment/landmark entry is not available for
                    this structure. Use the definition, original position and
                    source reference; do not infer attachment sites from color.
                  </p>
                )}
              </details>
              <details>
                <summary>Practice without looking</summary>
                <ol>
                  <li>
                    Locate and name this structure on the image or 3D model.
                  </li>
                  <li>
                    Explain its function and an adjacent anatomical
                    relationship.
                  </li>
                  <li>
                    Identify the documented landmarks or attachments above, then
                    check your answer.
                  </li>
                </ol>
              </details>
              <label>
                My explanation / course notes
                <textarea
                  value={notes[m.id] || ""}
                  onChange={(e) =>
                    setNotes((v) => ({ ...v, [m.id]: e.target.value }))
                  }
                />
              </label>
              <small>{s.source}</small>
            </details>
          ))}
      </div>
      {!facts.length && (
        <p>
          Your image/notes guide is saved. Use Edit collection to confirm
          available structures and add a linked 3D study model.
        </p>
      )}
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
