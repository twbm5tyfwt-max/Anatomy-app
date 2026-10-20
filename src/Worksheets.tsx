import { useRef, useState } from "react";
import { AnatomyScene, defaultLayers, type SceneApi } from "./AnatomyScene";
import { defaultAppearance } from "./Appearance";
import { pointerView } from "./collectionQuestions";
import { regionNames, regionParts } from "./atlasDomain";
import { getModelStudy, modelParts, type ModelPart } from "./modelCatalog";
import { shuffle } from "./quiz";
import type { StudyCollection } from "./studyCollections";
import "./study.css";

const byId = new Map(modelParts.map((m) => [m.id, m]));
const frames = (n: number) =>
  new Promise<void>((resolve) => {
    const step = (left: number) =>
      left <= 0 ? resolve() : requestAnimationFrame(() => step(left - 1));
    step(n);
  });
/** How much of the highlight colour is visible in a captured picture. */
async function pinkPixels(dataUrl: string) {
  const img = new Image();
  img.src = dataUrl;
  await img.decode();
  const c = document.createElement("canvas");
  c.width = 380;
  c.height = Math.round((380 * img.height) / img.width);
  const ctx = c.getContext("2d")!;
  ctx.drawImage(img, 0, 0, c.width, c.height);
  const d = ctx.getImageData(0, 0, c.width, c.height).data;
  let n = 0;
  for (let i = 0; i < d.length; i += 4)
    if (d[i] > 190 && d[i + 1] < 110 && d[i + 2] > 70 && d[i + 2] < 190) n++;
  return n;
}
const opposite = { front: "back", back: "front", left: "right", right: "left" } as const;
const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

type Item = { m: ModelPart; image: string };

function sheetHtml(title: string, items: Item[], wordBank: boolean) {
  const names = shuffle(items.map((i) => i.m.name));
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(title)}</title>
<style>
body{font-family:system-ui,Segoe UI,Arial,sans-serif;color:#111;margin:0;padding:24px;max-width:860px;margin-inline:auto}
h1{font-size:22px;margin:0 0 4px}.meta{display:flex;gap:24px;margin:10px 0 18px;font-size:14px}
.meta span{flex:1;border-bottom:1px solid #444;padding-bottom:2px}
.bank{border:1px solid #888;border-radius:8px;padding:10px 14px;margin:0 0 16px;font-size:14px}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:18px}
figure{margin:0;break-inside:avoid;border:1px solid #bbb;border-radius:8px;padding:8px}
img{width:100%;border-radius:6px;display:block}
.line{margin-top:8px;font-size:15px}.line b{margin-right:6px}.line i{display:inline-block;border-bottom:1px solid #222;width:70%}
.key{page-break-before:always}.key li{margin:4px 0;font-size:14px}
.print{position:fixed;right:16px;top:16px;padding:8px 14px;font-size:14px}
small{color:#555}
@media print{.print{display:none}body{padding:0}}
</style></head><body>
<button class="print" onclick="print()">Print / save as PDF</button>
<h1>${esc(title)}</h1>
<p><small>Name the structure shown in pink. Burdett’s Anatomy · source model: Z-Anatomy (CC BY-SA 4.0).</small></p>
<div class="meta"><span>Name:</span><span>Date:</span><span>Score: &nbsp;&nbsp;/ ${items.length}</span></div>
${wordBank ? `<div class="bank"><b>Word bank:</b> ${names.map(esc).join(" · ")}</div>` : ""}
<div class="grid">${items
    .map(
      (it, i) =>
        `<figure><img alt="Diagram ${i + 1}" src="${it.image}"><div class="line"><b>${i + 1}.</b><i></i></div></figure>`,
    )
    .join("")}</div>
<div class="key"><h1>Answer key</h1><ol>${items
    .map((it) => {
      const s = getModelStudy(it.m);
      return `<li><b>${esc(it.m.name)}</b>${s.function ? ` <small>— ${esc(s.function)}</small>` : ""}</li>`;
    })
    .join("")}</ol></div></body></html>`;
}

/** Printable "name the highlighted structure" sheets with an answer key. */
export function Worksheets({ collections }: { collections: StudyCollection[] }) {
  const [source, setSource] = useState(collections[0] ? "c:" + collections[0].id : "r:Knee");
  const [count, setCount] = useState(8);
  const [bank, setBank] = useState(true);
  const [busy, setBusy] = useState("");
  const [html, setHtml] = useState("");
  const [msg, setMsg] = useState("");
  const [target, setTarget] = useState<ModelPart | null>(null);
  // The viewer only loads the structures it is given at start, so it is mounted per job.
  const [job, setJob] = useState<{ ids: string[] } | null>(null);
  const api = useRef<SceneApi | null>(null);
  const ready = useRef(false);

  const candidates = (): ModelPart[] => {
    if (source.startsWith("c:")) {
      const c = collections.find((x) => "c:" + x.id === source);
      return (c?.ids || []).map((id) => byId.get(id)).filter(Boolean) as ModelPart[];
    }
    return regionParts(source.slice(2)).filter(
      (m) => !m.parentId && ["bones", "muscles", "ligaments", "cartilage", "tendons"].includes(m.layer || ""),
    );
  };
  const title = source.startsWith("c:")
    ? collections.find((x) => "c:" + x.id === source)?.name || "Study tab"
    : source.slice(2);

  async function build() {
    const picks = shuffle(candidates()).slice(0, count);
    if (picks.length < 2) {
      setMsg("Choose a source with at least two structures.");
      return;
    }
    setMsg("");
    setHtml("");
    setBusy("Loading the 3D model…");
    api.current = null;
    ready.current = false;
    setJob({ ids: [...new Set(picks.flatMap((m) => pointerView(m).ids))] });
    for (let i = 0; i < 300 && !ready.current; i++) await new Promise((r) => setTimeout(r, 100));
    const viewer = api.current as SceneApi | null;
    if (!viewer) {
      setBusy("");
      setJob(null);
      setMsg("The 3D viewer isn't available, so pictures can't be captured here.");
      return;
    }
    const items: Item[] = [];
    for (const [i, m] of picks.entries()) {
      setBusy(`Drawing diagram ${i + 1} of ${picks.length}…`);
      setTarget(m);
      await new Promise((r) => setTimeout(r, 220));
      const v = pointerView(m);
      // Inner structures can be hidden from one side: try other views until the target shows.
      let best = { image: "", n: -1 };
      for (const angle of [v.view, opposite[v.view as keyof typeof opposite], "left", "right"] as const) {
        viewer.frame(v.frameIds || v.ids, angle, 0);
        await frames(4);
        const image = viewer.capture();
        const n = await pinkPixels(image);
        if (n > best.n) best = { image, n };
        if (n >= 220) break;
      }
      items.push({ m, image: best.image });
    }
    setHtml(sheetHtml(`Label the diagram: ${title}`, items, bank));
    setTarget(null);
    setJob(null);
    setBusy("");
  }

  const view = target ? pointerView(target) : null;
  const url = html ? URL.createObjectURL(new Blob([html], { type: "text/html" })) : "";
  return (
    <div className="sh-grid">
      <article className="sh-card">
        <h2>Label-the-diagram worksheet</h2>
        <p>
          Pictures with one structure coloured pink; you write its name. The last
          page is an answer key. Print it or save it as a PDF.
        </p>
        <label className="field">
          Source
          <select value={source} onChange={(e) => setSource(e.target.value)}>
            {collections.length > 0 && (
              <optgroup label="My study tabs">
                {collections.map((c) => (
                  <option key={c.id} value={"c:" + c.id}>
                    {c.name} ({c.ids.length})
                  </option>
                ))}
              </optgroup>
            )}
            <optgroup label="Body regions">
              {regionNames.map((r) => (
                <option key={r} value={"r:" + r}>
                  {r}
                </option>
              ))}
            </optgroup>
          </select>
        </label>
        <div className="sh-row">
          <label>
            Diagrams{" "}
            <select value={count} onChange={(e) => setCount(+e.target.value)}>
              {[4, 6, 8, 10, 12].map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
          </label>
          <label>
            <input type="checkbox" checked={bank} onChange={(e) => setBank(e.target.checked)} /> Word bank
          </label>
          <button className="primary" disabled={!!busy} onClick={() => void build()}>
            Create worksheet
          </button>
        </div>
        {busy && <p role="status">{busy}</p>}
        {msg && <p role="alert">{msg}</p>}
        {html && (
          <div className="sh-row">
            <a className="sh-link" href={url} target="_blank" rel="noreferrer">
              Open to print ↗
            </a>
            <a className="sh-link" href={url} download={`worksheet-${title.replace(/[^a-z0-9]+/gi, "-")}.html`}>
              Download
            </a>
          </div>
        )}
        <p className="sh-note">
          Each sheet picks different structures at random. Pictures are drawn from
          the 3D model in this browser; nothing is uploaded.
        </p>
      </article>
      <div className="ws-capture" aria-hidden="true">
        {job && (
          <AnatomyScene
            key={job.ids.length + ":" + job.ids[0]}
            quiz
            visible={[]}
            selected={[]}
            hidden={[]}
            isolated={view?.ids ?? null}
            layers={defaultLayers}
            appearance={defaultAppearance}
            quality={false}
            labels={false}
            onlyIds={job.ids}
            colorOverrides={Object.fromEntries((view?.highlightIds || []).map((id) => [id, "#ff2d78"]))}
            onReady={(a) => {
              api.current = a;
              ready.current = true;
            }}
          />
        )}
      </div>
    </div>
  );
}
