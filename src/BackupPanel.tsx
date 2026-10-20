import { useState } from "react";
import "./study.css";

const FORMAT = "burdetts-anatomy-backup";
type Backup = {
  format: string;
  version: 1;
  exportedAt: string;
  storage: Record<string, string>;
  files?: { id: string; name: string; type: string; data: string }[];
};

const appKeys = () =>
  Object.keys(localStorage).filter((k) => k.startsWith("forma-"));

function openFiles(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    const req = indexedDB.open("forma-files", 1);
    req.onupgradeneeded = () => req.result.createObjectStore("files");
    req.onerror = () => resolve(null);
    req.onsuccess = () => resolve(req.result);
  });
}
const toBase64 = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",")[1] || "");
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });

async function readFiles() {
  const db = await openFiles();
  if (!db) return [];
  const out: NonNullable<Backup["files"]> = [];
  await new Promise<void>((resolve) => {
    const tx = db.transaction("files", "readonly");
    const store = tx.objectStore("files");
    const cursor = store.openCursor();
    const pending: Promise<void>[] = [];
    cursor.onsuccess = () => {
      const c = cursor.result;
      if (!c) {
        Promise.all(pending).then(() => resolve());
        return;
      }
      const blob = c.value as File;
      pending.push(
        toBase64(blob).then((data) => {
          out.push({
            id: String(c.key),
            name: blob.name || String(c.key),
            type: blob.type,
            data,
          });
        }),
      );
      c.continue();
    };
    cursor.onerror = () => resolve();
  });
  db.close();
  return out;
}
async function writeFiles(files: NonNullable<Backup["files"]>) {
  const db = await openFiles();
  if (!db) return 0;
  await new Promise<void>((resolve) => {
    const tx = db.transaction("files", "readwrite");
    for (const f of files) {
      const bytes = Uint8Array.from(atob(f.data), (c) => c.charCodeAt(0));
      tx.objectStore("files").put(new File([bytes], f.name, { type: f.type }), f.id);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
  db.close();
  return files.length;
}

function describe(storage: Record<string, string>) {
  const count = (key: string) => {
    try {
      const v = JSON.parse(storage[key] || "null");
      return Array.isArray(v) ? v.length : v && typeof v === "object" ? Object.keys(v).length : 0;
    } catch {
      return 0;
    }
  };
  const notes = Object.keys(storage)
    .filter((k) => k.startsWith("forma-notes-"))
    .reduce((n, k) => n + count(k), 0);
  return [
    ["Study tabs", count("forma-collections-v1")],
    ["Sticky notes", notes],
    ["Quiz sessions", count("forma-results")],
    ["Review cards", count("forma-srs-v1")],
    ["Practice exams", count("forma-exams-v1")],
    ["Game sessions", count("forma-game-results")],
  ] as [string, number][];
}

/** Save everything this app keeps in your browser to one file, and bring it back. */
export function BackupPanel() {
  const [withFiles, setWithFiles] = useState(true);
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");
  const [loaded, setLoaded] = useState<Backup | null>(null);
  const [mode, setMode] = useState<"replace" | "missing">("missing");

  const local = Object.fromEntries(appKeys().map((k) => [k, localStorage.getItem(k) || ""]));

  async function exportAll() {
    setBusy("Preparing your backup…");
    setMsg("");
    try {
      const backup: Backup = {
        format: FORMAT,
        version: 1,
        exportedAt: new Date().toISOString(),
        storage: local,
        files: withFiles ? await readFiles() : [],
      };
      const blob = new Blob([JSON.stringify(backup)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `burdetts-anatomy-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      setMsg(
        `Saved ${Object.keys(backup.storage).length} items and ${backup.files?.length || 0} original files. Keep the file somewhere safe (cloud drive or email to yourself).`,
      );
    } catch (e) {
      setMsg("Could not create the backup: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setBusy("");
    }
  }
  async function choose(file: File | undefined) {
    setMsg("");
    setLoaded(null);
    if (!file) return;
    try {
      const data = JSON.parse(await file.text()) as Backup;
      if (data.format !== FORMAT || typeof data.storage !== "object" || !data.storage)
        throw new Error("This is not a Burdett’s Anatomy backup file.");
      for (const [k, v] of Object.entries(data.storage))
        if (!k.startsWith("forma-") || typeof v !== "string")
          throw new Error("The backup contains unexpected data and was not loaded.");
      setLoaded(data);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e));
    }
  }
  async function restore() {
    if (!loaded) return;
    setBusy("Restoring…");
    let written = 0;
    for (const [k, v] of Object.entries(loaded.storage)) {
      if (mode === "missing" && localStorage.getItem(k) !== null) continue;
      try {
        localStorage.setItem(k, v);
        written++;
      } catch {
        setMsg("Your browser ran out of storage space while restoring.");
        break;
      }
    }
    const files = loaded.files?.length ? await writeFiles(loaded.files) : 0;
    setBusy("");
    setMsg(`Restored ${written} items and ${files} original files. Reloading…`);
    setTimeout(() => location.reload(), 900);
  }

  return (
    <div className="sh-grid">
      <article className="sh-card">
        <h2>Back up your work</h2>
        <p>
          Everything you create here (study tabs, notes, review deck, practice
          exams, quiz and game history, goals) lives only in this browser.
          Clearing site data or switching browsers loses it. A backup file
          protects it.
        </p>
        <ul className="sh-list">
          {describe(local).map(([l, n]) => (
            <li key={l}>
              <span>{l}</span>
              <b>{n}</b>
            </li>
          ))}
        </ul>
        <label className="sh-row">
          <input
            type="checkbox"
            checked={withFiles}
            onChange={(e) => setWithFiles(e.target.checked)}
          />
          Include my uploaded pictures and documents (larger file)
        </label>
        <button className="primary" disabled={!!busy} onClick={() => void exportAll()}>
          Download backup
        </button>
        <p className="sh-note">
          The file stays on your device. Nothing is sent to a server.
        </p>
      </article>
      <article className="sh-card">
        <h2>Restore from a backup</h2>
        <label className="field">
          Backup file
          <input
            type="file"
            accept="application/json,.json"
            aria-label="Backup file"
            disabled={!!busy}
            onChange={(e) => void choose(e.target.files?.[0])}
          />
        </label>
        {loaded && (
          <>
            <p>
              Backup from {new Date(loaded.exportedAt).toLocaleString()}:
            </p>
            <ul className="sh-list">
              {describe(loaded.storage).map(([l, n]) => (
                <li key={l}>
                  <span>{l}</span>
                  <b>{n}</b>
                </li>
              ))}
              <li>
                <span>Original files</span>
                <b>{loaded.files?.length || 0}</b>
              </li>
            </ul>
            <div className="sh-row" role="radiogroup" aria-label="Restore mode">
              <label>
                <input
                  type="radio"
                  checked={mode === "missing"}
                  onChange={() => setMode("missing")}
                />{" "}
                Add only what this browser doesn’t have
              </label>
              <label>
                <input
                  type="radio"
                  checked={mode === "replace"}
                  onChange={() => setMode("replace")}
                />{" "}
                Replace with the backup
              </label>
            </div>
            {mode === "replace" && (
              <p className="sh-warn">
                Replacing overwrites matching items here with the versions in
                the backup. Download a backup of the current state first if
                unsure.
              </p>
            )}
            <button className="primary" disabled={!!busy} onClick={() => void restore()}>
              Restore
            </button>
          </>
        )}
        {busy && <p role="status">{busy}</p>}
        {msg && <p role="status">{msg}</p>}
      </article>
    </div>
  );
}
