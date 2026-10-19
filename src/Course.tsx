import { useState } from "react";
import {
  Upload,
  FileText,
  ShieldCheck,
  ArrowRight,
  Check,
  Trash2,
  BookOpen,
  ExternalLink,
} from "lucide-react";
import JSZip from "jszip";
import * as pdfjs from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { useStored, storeFile, getFile, deleteFile } from "./storage";
import type { CourseCard } from "./quiz";
pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
type Material = {
  id: string;
  name: string;
  pages: string[];
  type: string;
  status: string;
};
export function Course({
  cards,
  setCards,
  onQuiz,
}: {
  cards: CourseCard[];
  setCards: (v: CourseCard[]) => void;
  onQuiz: () => void;
}) {
  const [materials, setMaterials] = useStored<Material[]>(
    "forma-materials",
    [],
  );
  const [selected, setSelected] = useState("");
  const [page, setPage] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [term, setTerm] = useState("");
  const [definition, setDefinition] = useState("");
  const [ack, setAck] = useState(false);
  const m = materials.find((m) => m.id === selected) || materials[0];
  async function upload(file?: File) {
    if (!file) return;
    setError("");
    if (file.size > 25 * 1024 * 1024) {
      setError("Choose a file smaller than 25 MB.");
      return;
    }
    setBusy(true);
    try {
      const pages: string[] = [];
      let status = "Review extracted text before creating cards.";
      if (file.name.toLowerCase().endsWith(".pdf")) {
        const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() })
          .promise;
        for (let i = 1; i <= pdf.numPages; i++) {
          const text = await (await pdf.getPage(i)).getTextContent();
          pages.push(
            text.items.map((item) => ("str" in item ? item.str : "")).join(" "),
          );
        }
        await pdf.destroy();
        if (pages.every((p) => p.trim().length < 20))
          status =
            "Little or no readable text. This may be a scanned PDF. Open the original and transcribe the source before creating cards.";
      } else if (file.name.toLowerCase().endsWith(".pptx")) {
        const zip = await JSZip.loadAsync(file);
        const files = Object.keys(zip.files)
          .filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n))
          .sort(
            (a, b) =>
              Number(a.match(/slide(\d+)/)?.[1]) -
              Number(b.match(/slide(\d+)/)?.[1]),
          );
        for (const name of files) {
          const xml = new DOMParser().parseFromString(
            await zip.file(name)!.async("text"),
            "application/xml",
          );
          pages.push(
            Array.from(xml.getElementsByTagName("a:t"))
              .map((e) => e.textContent)
              .join("\n"),
          );
        }
        if (!pages.length)
          throw new Error("No slides were found in this PowerPoint.");
      } else if (file.type.startsWith("image/")) {
        pages.push("");
        status =
          "Image needs transcription. Open the original image and enter only information you can read confidently. No automatic OCR is used in this version.";
      } else
        throw new Error(
          "Use a PDF, .pptx PowerPoint, or an image. Legacy .ppt files must be exported to .pptx or PDF.",
        );
      if (pages.join("").length > 900000)
        throw new Error(
          "This document is too large to store as extracted text. Upload a smaller section.",
        );
      const id = crypto.randomUUID();
      await storeFile(file, id);
      setMaterials([
        ...materials,
        { id, name: file.name, pages, type: file.type, status },
      ]);
      setSelected(id);
      setPage(0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "The file could not be read.");
    } finally {
      setBusy(false);
    }
  }
  async function openOriginal() {
    if (!m) return;
    const file = await getFile(m.id);
    if (file) {
      const url = URL.createObjectURL(file);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } else setError("The original is unavailable. Please upload it again.");
  }
  async function remove() {
    if (!m) return;
    await deleteFile(m.id);
    setMaterials(materials.filter((x) => x.id !== m.id));
    setCards(cards.filter((c) => c.id.split(":")[0] !== m.id));
    setSelected("");
    setPage(0);
  }
  function add() {
    if (!m || !term.trim() || !definition.trim() || !ack) return;
    setCards([
      ...cards,
      {
        id: `${m.id}:${crypto.randomUUID()}`,
        term: term.trim(),
        definition: definition.trim(),
        file: m.name,
        page: page + 1,
      },
    ]);
    setTerm("");
    setDefinition("");
    setAck(false);
  }
  return (
    <div className="course-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">YOUR SYLLABUS, YOUR STUDY SPACE</span>
          <h1>Bring your course along.</h1>
          <p>Turn your own materials into a focused study collection.</p>
        </div>
        <button className="primary" disabled={!cards.length} onClick={onQuiz}>
          Practice {cards.length} reviewed cards <ArrowRight size={16} />
        </button>
      </div>
      <div className="privacy-note">
        <ShieldCheck size={20} />
        <div>
          <strong>Your materials stay in this browser.</strong>
          <p>
            PDFs and PowerPoint text are extracted on your device. Files and
            reviewed cards are saved locally. Nothing is sent to an AI service.
          </p>
        </div>
      </div>
      <label className="upload-zone">
        <Upload size={28} />
        <strong>
          {busy ? "Reading your document…" : "Drop a little knowledge here"}
        </strong>
        <span>
          Choose a PDF, PowerPoint (.pptx), or study-guide image · up to 25 MB
        </span>
        <input
          type="file"
          disabled={busy}
          accept=".pdf,.pptx,image/*"
          onChange={(e) => {
            upload(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        <span className="secondary">Browse files</span>
      </label>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {materials.length > 0 && (
        <div className="course-workspace">
          <aside className="panel material-list">
            <h3>
              Your materials <span className="count">{materials.length}</span>
            </h3>
            {materials.map((x) => (
              <button
                className={x.id === m?.id ? "active" : ""}
                key={x.id}
                onClick={() => {
                  setSelected(x.id);
                  setPage(0);
                }}
              >
                <FileText size={18} />
                <span>
                  {x.name}
                  <small>{x.pages.length} pages / slides</small>
                </span>
              </button>
            ))}
          </aside>
          {m && (
            <section className="panel material-detail">
              <div className="panel-head">
                <h3>{m.name}</h3>
                <button
                  className="icon-button"
                  aria-label="Remove material and associated cards"
                  onClick={remove}
                >
                  <Trash2 size={17} />
                </button>
              </div>
              <div className="source-toolbar">
                <label>
                  Page / slide{" "}
                  <select
                    value={page}
                    onChange={(e) => setPage(Number(e.target.value))}
                  >
                    {m.pages.map((_, i) => (
                      <option key={i} value={i}>
                        {i + 1}
                      </option>
                    ))}
                  </select>
                </label>
                <button className="text-button" onClick={openOriginal}>
                  Open original <ExternalLink size={14} />
                </button>
              </div>
              <p className="review-note">{m.status}</p>
              <pre className="source-text">
                {m.pages[page] ||
                  "No readable text on this page. Review the original and transcribe below."}
              </pre>
              <h3>Create a source-linked study card</h3>
              <p className="muted small">
                Keep your instructor’s wording. Flag conflicts by leaving the
                card unapproved until you resolve them. A reviewed card can be
                quizzed even when it has no atlas hotspot.
              </p>
              <div className="form-grid">
                <label>
                  Answer / structure name
                  <input
                    value={term}
                    onChange={(e) => setTerm(e.target.value)}
                    placeholder="e.g. Pectoralis major"
                    maxLength={200}
                  />
                </label>
                <label>
                  Definition or identification clue
                  <textarea
                    value={definition}
                    onChange={(e) => setDefinition(e.target.value)}
                    placeholder="Copy a clear clue from this page…"
                    maxLength={1500}
                  />
                </label>
              </div>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={ack}
                  onChange={(e) => setAck(e.target.checked)}
                />
                I checked this answer and clue against page / slide {page + 1}.
              </label>
              <button
                className="primary"
                disabled={!ack || !term.trim() || !definition.trim()}
                onClick={add}
              >
                <Check size={16} />
                Save reviewed card
              </button>
            </section>
          )}
        </div>
      )}
      <section className="panel course-cards">
        <h3>
          <BookOpen size={19} /> Reviewed study cards{" "}
          <span className="count">{cards.length}</span>
        </h3>
        {!cards.length ? (
          <p className="muted">
            Upload a document, review a page, and save your first card. Quizzes
            use only cards you have checked.
          </p>
        ) : (
          cards.map((c) => (
            <div className="course-card" key={c.id}>
              <div>
                <strong>{c.term}</strong>
                <p>{c.definition}</p>
                <small>
                  {c.file} · page / slide {c.page}
                </small>
              </div>
              <button
                className="icon-button"
                aria-label={`Delete card ${c.term}`}
                onClick={() => setCards(cards.filter((x) => x.id !== c.id))}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
