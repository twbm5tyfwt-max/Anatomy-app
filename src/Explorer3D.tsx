import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Bookmark,
  BookOpen,
  Box,
  Check,
  ChevronDown,
  Expand,
  Eye,
  EyeOff,
  Focus,
  Info,
  Layers,
  Maximize,
  Minus,
  MousePointer2,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Split,
  Undo2,
  X,
  GraduationCap,
  MapPin,
} from "lucide-react";
import {
  AnatomyScene,
  defaultLayers,
  type SceneApi,
  type CameraView,
} from "./AnatomyScene";
import {
  getModelStudy,
  getRegion,
  modelMatchesStudy,
  modelParts,
  type ModelPart,
  type AnatomyLayer,
} from "./modelCatalog";
import {
  componentName,
  displayGroup,
  displayGroupKey,
  displayName,
  parentModel,
} from "./modelDisplay";
import {
  landmarksFor,
  spineModels,
  spineCode,
  spineRegion,
  spineRegionNotes,
  type AnatomyLandmark,
} from "./landmarkCatalog";
import { systems } from "./content";
import type { Appearance } from "./Appearance";
import "./atlas-workspace.css";
const byId = new Map(modelParts.map((m) => [m.id, m]));
const layerGroups: [string, AnatomyLayer[]][] = [
  ["Skin", ["skin"]],
  ["Muscles", ["muscles"]],
  [
    "Connective",
    ["tendons", "ligaments", "cartilage", "fascia", "capsules", "bursae"],
  ],
  ["Bones", ["bones"]],
  ["Organs", ["organs"]],
];
const layerNames: Record<string, string> = {
  skin: "Skin surface",
  muscles: "Muscle bodies",
  bones: "Bones",
  tendons: "Tendons",
  ligaments: "Ligaments",
  capsules: "Articular capsules",
  bursae: "Synovial bursae",
  cartilage: "Cartilage & discs",
  fascia: "Fascia & aponeuroses",
  organs: "Organs, nerves & vessels",
};
type Snapshot = {
  hidden: string[];
  isolated: string[] | null;
  layers: Record<string, number>;
  visible: string[];
};
function children(ids: string[]) {
  const set = new Set(ids);
  return modelParts
    .filter((m) => set.has(m.id) || (!!m.parentId && set.has(m.parentId)))
    .map((m) => m.id);
}
function primaryIds(sourceNames: string[]) {
  return modelParts
    .filter((m) => !m.parentId && sourceNames.includes(m.sourceName || ""))
    .map((m) => m.id);
}
function sourceId(name: string) {
  return modelParts.find((m) => m.sourceName === name && !m.parentId)?.id || "";
}
const initialCompare = [sourceId("Vertebra C4"), sourceId("Vertebra L3")];
export function Explorer3D({
  visible,
  onVisibleChange,
  highlightedSystems,
  onClearHighlights,
  region,
  onRegionChange,
  request,
  appearance,
  onSelect,
  onBookmark,
  bookmarks,
  onQuiz,
  onReference,
}: {
  visible: string[];
  onVisibleChange: (v: string[]) => void;
  highlightedSystems: string[];
  onClearHighlights: () => void;
  region: string;
  onRegionChange: (r: string) => void;
  request: { id: string; version: number };
  appearance: Appearance;
  onSelect: (id: string) => void;
  onBookmark: (id: string) => void;
  bookmarks: string[];
  onQuiz: (id: string) => void;
  onReference: () => void;
}) {
  const [workspace, setWorkspace] = useState<"body" | "explore">("body"),
    [selected, setSelected] = useState<string | null>(null),
    [scope, setScope] = useState<"whole" | "component" | "tissue">("whole");
  const [hidden, setHidden] = useState<string[]>([]),
    [isolated, setIsolated] = useState<string[] | null>(null),
    [history, setHistory] = useState<Snapshot[]>([]);
  const [layers, setLayers] = useState<Record<string, number>>({
      ...defaultLayers,
    }),
    [layerMenu, setLayerMenu] = useState<string | null>(null);
  const [selectionMode, setSelectionMode] = useState<
      "structure" | "tissue" | "landmark"
    >("structure"),
    [labels, setLabels] = useState(true),
    [quality, setQuality] = useState(true),
    [autoFocus, setAutoFocus] = useState(false);
  const [view, setView] = useState<CameraView>("front"),
    [search, setSearch] = useState(""),
    [browse, setBrowse] = useState(false),
    [kind, setKind] = useState("All");
  const [hover, setHover] = useState<string | null>(null),
    [infoTab, setInfoTab] = useState("Overview"),
    [landmark, setLandmark] = useState<AnatomyLandmark | null>(null);
  const [attachmentKind, setAttachmentKind] = useState<
      "origin" | "insertion" | null
    >(null),
    [expanded, setExpanded] = useState(false),
    [compare, setCompare] = useState(false),
    [compareIds, setCompareIds] = useState(initialCompare);
  const [compareView, setCompareView] = useState<CameraView>("superior");
  const api = useRef<SceneApi | null>(null),
    compareApis = useRef<(SceneApi | null)[]>([null, null]),
    searchRef = useRef<HTMLInputElement>(null),
    previousVisible = useRef(visible);
  const pendingFrame = useRef<{ ids: string[]; view?: CameraView } | null>(null);
  function requestFrame(ids: string[], view?: CameraView) {
    if (api.current && !compare) api.current.frame(ids, view);
    else pendingFrame.current = { ids, view };
  }
  const model = selected ? byId.get(selected) : undefined,
    base = model ? parentModel(model) : undefined;
  const group = model
    ? scope === "tissue"
      ? [model]
      : scope === "component"
        ? displayGroup(model).filter(
            (m) => m.id === base?.id || m.parentId === base?.id,
          )
        : displayGroup(model)
    : [];
  const selectedIds = group.map((m) => m.id),
    study = model
      ? getModelStudy(scope === "tissue" ? model : base || model)
      : null;
  const title = model
    ? scope === "whole"
      ? displayName(model)
      : model.name
    : "";
  const primaryGroup = group.filter((m) => !m.parentId);
  const localLandmarks = base ? landmarksFor(base.id) : [];
  const attachmentCandidates = modelParts.filter(
    (m) =>
      m.layer === "attachment" &&
      !!m.attachmentFor &&
      selectedIds.includes(m.attachmentFor),
  );
  const overlays = attachmentKind
    ? attachmentCandidates
        .filter((m) => m.attachmentKind === attachmentKind)
        .map((m) => m.id)
    : [];
  function remember() {
    setHistory((h) =>
      [
        ...h,
        {
          hidden: [...hidden],
          isolated: isolated ? [...isolated] : null,
          layers: { ...layers },
          visible: [...visible],
        },
      ].slice(-30),
    );
  }
  function clear() {
    setSelected(null);
    setLandmark(null);
    setAttachmentKind(null);
    setHover(null);
  }
  function restore() {
    remember();
    setHidden([]);
    setIsolated(null);
    setAttachmentKind(null);
  }
  function reset() {
    remember();
    clear();
    setHidden([]);
    setIsolated(null);
    setLayers({ ...defaultLayers });
    onVisibleChange(["skeletal"]);
    onRegionChange("");
    onClearHighlights();
    setView("front");
    setCompare(false);
    requestFrame([], "front");
  }
  function undo() {
    const old = history.at(-1);
    if (!old) return;
    setHistory(history.slice(0, -1));
    setHidden(old.hidden);
    setIsolated(old.isolated);
    setLayers(old.layers);
    onVisibleChange(old.visible);
    setAttachmentKind(null);
  }
  function ensure(ids: string[]) {
    const parts = ids
      .map((id) => byId.get(id))
      .filter((m): m is ModelPart => !!m);
    onVisibleChange([...new Set([...visible, ...parts.map((m) => m.system)])]);
    setLayers((l) => {
      const n = { ...l };
      for (const m of parts)
        if (m.layer && m.layer !== "attachment" && !n[m.layer]) n[m.layer] = 1;
      return n;
    });
    setHidden((h) => h.filter((id) => !ids.includes(id)));
  }
  function pick(id: string, focus = false) {
    if (compare) setCompare(false);
    const raw = byId.get(id);
    if (!raw) {
      clear();
      return;
    }
    const m = selectionMode === "tissue" ? raw : parentModel(raw);
    if (
      !focus &&
      selected &&
      (selectionMode === "tissue"
        ? m.id === selected
        : displayGroupKey(m) === displayGroupKey(model!))
    ) {
      clear();
      return;
    }
    const nextScope = selectionMode === "tissue" ? "tissue" : "whole";
    const ids =
      nextScope === "tissue" ? [m.id] : displayGroup(m).map((m) => m.id);
    setSelected(m.id);
    setScope(nextScope);
    setLandmark(null);
    setAttachmentKind(null);
    setInfoTab("Overview");
    setBrowse(false);
    setHover(null);
    onSelect("model:" + m.id);
    ensure(ids);
    if (focus) {
      remember();
      setIsolated(ids);
      requestFrame(ids, "front");
      setView("front");
    } else if (autoFocus) requestFrame(ids);
  }
  useEffect(() => {
    if (!request.version) return;
    const m = request.id.startsWith("model:")
      ? byId.get(request.id.slice(6))
      : modelParts.find((m) => modelMatchesStudy(m, request.id));
    if (m) pick(m.id, true);
  }, [request.version]);
  useEffect(() => {
    const added = visible.filter((v) => !previousVisible.current.includes(v));
    previousVisible.current = visible;
    if (added.length)
      setLayers((l) => {
        const n = { ...l };
        for (const id of added) {
          const types: AnatomyLayer[] =
            id === "skeletal"
              ? ["bones", "cartilage"]
              : id === "muscular"
                ? ["muscles", "tendons"]
                : id === "integumentary"
                  ? ["skin"]
                  : ["organs"];
          for (const type of types) if (!n[type]) n[type] = 1;
        }
        return n;
      });
  }, [visible.join(",")]);
  useEffect(() => {
    if (region) {
      const ids = modelParts
        .filter((m) => m.layer === "bones" && getRegion(m) === region)
        .map((m) => m.id);
      requestFrame(ids);
    }
  }, [region]);
  useEffect(() => {
    const f = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setExpanded(false);
        setBrowse(false);
        setLayerMenu(null);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setBrowse(true);
        setTimeout(() => searchRef.current?.focus(), 0);
      }
    };
    window.addEventListener("keydown", f);
    return () => window.removeEventListener("keydown", f);
  }, []);
  function changeView(v: CameraView) {
    setView(v);
    api.current?.view(v);
  }
  function toggleLayer(name: string, types: AnatomyLayer[]) {
    remember();
    const enabled = types.every((t) => layers[t] > 0);
    setLayers((l) => {
      const n = { ...l };
      types.forEach((t) => (n[t] = enabled ? 0 : 1));
      return n;
    });
    if (!enabled) {
      const ids = modelParts
        .filter((m) => types.includes(m.layer as AnatomyLayer))
        .map((m) => m.system);
      onVisibleChange([...new Set([...visible, ...ids])]);
    }
    setLayerMenu(null);
  }
  function hideSelected() {
    if (!selectedIds.length) return;
    remember();
    setHidden([...new Set([...hidden, ...selectedIds])]);
    if (isolated)
      setIsolated(isolated.filter((id) => !selectedIds.includes(id)));
    clear();
  }
  function isolateSelected() {
    if (!selectedIds.length) return;
    remember();
    ensure(selectedIds);
    setIsolated(selectedIds);
    setAttachmentKind(null);
    requestFrame(selectedIds);
  }
  function focusLandmark(l: AnatomyLandmark) {
    setLandmark(l);
    setInfoTab("Landmarks");
    setSelectionMode("landmark");
    const ids = children(l.contextIds);
    ensure(ids);
    setIsolated(ids);
    setView(l.view);
    requestFrame(ids, l.view);
  }
  function attachments(kind: "origin" | "insertion") {
    const ids = attachmentCandidates
      .filter((m) => m.attachmentKind === kind)
      .map((m) => m.id);
    if (!ids.length) return;
    remember();
    setAttachmentKind(kind);
    setLandmark(null);
    const nearby = new Set<string>();
    for (const id of ids) {
      const m = byId.get(id)!;
      const c = m.bounds[0].map((v, i) => (v + m.bounds[1][i]) / 2);
      const ranked = modelParts
        .filter((m) => m.layer === "bones")
        .map((m) => ({
          m,
          d: m.bounds[0].reduce(
            (s, min, i) =>
              s + Math.max(min - c[i], 0, c[i] - m.bounds[1][i]) ** 2,
            0,
          ),
        }))
        .sort((a, b) => a.d - b.d);
      ranked.slice(0, 2).forEach((x) => nearby.add(x.m.id));
    }
    const context = children([...nearby]);
    setIsolated([...context, ...ids]);
    ensure(context);
    setView("front");
    requestFrame(context.length ? context : ids, "front");
  }
  function preset(name: string) {
    remember();
    clear();
    setCompare(false);
    setWorkspace("explore");
    setHidden([]);
    onVisibleChange(["skeletal"]);
    setLayers({ ...defaultLayers, ligaments: 1, tendons: 1 });
    let parts: ModelPart[] = [],
      frame: string[] = [];
    if (name === "Spine") {
      parts = modelParts.filter(
        (m) =>
          /vertebr|atlas|axis|sacrum|coccyx/i.test(m.name) &&
          m.system === "skeletal" &&
          m.layer !== "attachment",
      );
      frame = spineModels.map((m) => m.id);
    }
    if (name === "Shoulder") {
      frame = primaryIds(["Humerus.r", "Scapula.r", "Clavicle.r"]);
      parts = modelParts.filter(
        (m) =>
          frame.includes(m.id) ||
          (!!m.parentId && frame.includes(m.parentId)) ||
          (m.ancestry.some((c) =>
            /glenohumeral|shoulder|acromioclavicular|coracoclavicular/i.test(c),
          ) &&
            /\.r$/.test(m.sourceName || "")),
      );
    }
    if (name === "Pelvis") {
      frame = primaryIds(["Hip bone.r", "Hip bone.l", "Sacrum", "Coccyx"]);
      const body = primaryIds(["Femur.r", "Femur.l"]);
      parts = modelParts.filter(
        (m) =>
          [...frame, ...body].includes(m.id) ||
          (!!m.parentId && [...frame, ...body].includes(m.parentId)) ||
          m.ancestry.some((c) => /sacro-iliac|hip joint/i.test(c)),
      );
    }
    if (name === "Knee") {
      const main = primaryIds(["Femur.r", "Tibia.r", "Fibula.r", "Patella.r"]);
      parts = modelParts.filter(
        (m) =>
          main.includes(m.id) ||
          (!!m.parentId && main.includes(m.parentId)) ||
          (m.ancestry.some((c) => /Knee joint/.test(c)) &&
            /\.r$/.test(m.sourceName || "")),
      );
      frame = primaryIds([
        "Patella.r",
        "Anterior cruciate ligament.r",
        "Posterior cruciate ligament.r",
      ]);
    }
    const ids = parts.map((m) => m.id);
    setIsolated(ids);
    setView("front");
    requestFrame(frame.length ? frame : ids, "front");
  }
  const seen = new Set<string>();
  const matches = modelParts.filter((m) => {
    if (m.layer === "attachment" || (m.parentId && selectionMode !== "tissue"))
      return false;
    if (
      (kind === "Bones" && m.layer !== "bones") ||
      (kind === "Muscles" && m.layer !== "muscles") ||
      (kind === "Connective" &&
        ![
          "tendons",
          "ligaments",
          "cartilage",
          "fascia",
          "capsules",
          "bursae",
        ].includes(m.layer || ""))
    )
      return false;
    if (
      search &&
      !`${m.name} ${m.sourceName} ${m.ancestry.join(" ")}`
        .toLowerCase()
        .includes(search.toLowerCase())
    )
      return false;
    const key = selectionMode === "tissue" ? m.id : displayGroupKey(m);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const frameSize = Math.max(
    ...compareIds.map((id) => {
      const b = byId.get(id)!.bounds;
      return Math.max(...b[0].map((v, i) => b[1][i] - v));
    }),
  );
  const sceneProps = {
    visible,
    selected: selectedIds,
    hidden,
    isolated,
    layers,
    highlightedSystems,
    attachments: overlays,
    appearance,
    quality,
    landmarks: selectionMode === "landmark" ? localLandmarks : [],
    activeLandmark: landmark?.id,
    labels,
    selectionMode:
      selectionMode === "landmark"
        ? ("landmark" as const)
        : ("structure" as const),
    onSelect: (id: string) => pick(id),
    onLandmark: (id: string) => {
      const l = localLandmarks.find((l) => l.id === id);
      if (l) focusLandmark(l);
    },
    onHover: setHover,
    onReady: (v: SceneApi) => {
      api.current = v;
      if (pendingFrame.current) {
        v.frame(pendingFrame.current.ids, pendingFrame.current.view);
        pendingFrame.current = null;
      }
    },
  };
  return (
    <div
      className={`pro-atlas ${expanded ? "is-expanded" : ""} ${compare ? "pro-is-comparing" : ""} ${appearance.studio === "adaptive" && appearance.mode === "light" ? "pro-light-studio" : ""}`}
    >
      <header className="pro-header">
        <div
          className="pro-workspace-tabs"
          role="tablist"
          aria-label="Anatomy workspace"
        >
          <button
            role="tab"
            aria-selected={workspace === "body"}
            onClick={() => {
              setWorkspace("body");
              setCompare(false);
              setIsolated(null);
              requestFrame([], "front");
            }}
          >
            <Box size={15} />
            Body
          </button>
          <button
            role="tab"
            aria-selected={workspace === "explore"}
            onClick={() => preset("Spine")}
          >
            <Focus size={15} />
            Explore
          </button>
        </div>
        <div className="pro-search">
          <Search size={15} />
          <input
            ref={searchRef}
            aria-label="Search 3D anatomy"
            placeholder="Search anatomy…"
            value={search}
            onFocus={() => setBrowse(true)}
            onChange={(e) => {
              setSearch(e.target.value);
              setBrowse(true);
            }}
          />
          <kbd>⌘K</kbd>
        </div>
        <button
          className="pro-reference"
          aria-label="2D reference"
          onClick={onReference}
        >
          <BookOpen size={14} />
          <span>2D reference</span>
        </button>
        <button
          className="pro-icon"
          aria-label={expanded ? "Exit expanded atlas" : "Expand atlas"}
          onClick={() => setExpanded(!expanded)}
        >
          <Maximize size={17} />
        </button>
      </header>
      {workspace === "explore" && (
        <div className="pro-presets">
          <span>Explore a region</span>
          {["Spine", "Shoulder", "Pelvis", "Knee"].map((n) => (
            <button key={n} onClick={() => preset(n)}>
              {n}
            </button>
          ))}
          <button
            className={compare ? "active" : ""}
            onClick={() => {
              api.current = null;
              setCompare(!compare);
              setCompareView("superior");
            }}
          >
            <Split size={14} />
            Compare vertebrae
          </button>
        </div>
      )}
      <div className={`pro-workspace ${study ? "has-selection" : ""}`}>
        <section className="pro-viewer">
          <div className="pro-stage">
            {compare ? (
              <div className="pro-comparison">
                {compareIds.map((id, i) => {
                  const m = byId.get(id)!;
                  return (
                    <div className="pro-compare-pane" key={i}>
                      <div className="pro-compare-select">
                        <select
                          aria-label={`Comparison vertebra ${i + 1}`}
                          value={id}
                          onChange={(e) =>
                            setCompareIds(
                              compareIds.map((v, j) =>
                                j === i ? e.target.value : v,
                              ),
                            )
                          }
                        >
                          {spineModels.map((b) => (
                            <option key={b.id} value={b.id}>
                              {spineCode(b.name)} · {spineRegion(b.name)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <AnatomyScene
                        key={id}
                        {...sceneProps}
                        onlyIds={children([id])}
                        selected={[]}
                        isolated={null}
                        landmarks={[]}
                        initialView={compareView}
                        frameSize={frameSize}
                        onReady={(v) => {
                          compareApis.current[i] = v;
                        }}
                      />
                      <div className="pro-compare-caption">
                        <strong>
                          {spineCode(m.name)} · {spineRegion(m.name)}
                        </strong>
                        <p>{spineRegionNotes[spineRegion(m.name)]}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <AnatomyScene {...sceneProps} />
            )}
            <div className="pro-corner-label">
              <span>
                {compare
                  ? "MATCHED SCALE · SOURCE GEOMETRY"
                  : isolated
                    ? "ISOLATED VIEW"
                    : "WHOLE BODY"}
              </span>
              <strong>
                {compare
                  ? "Vertebral morphology"
                  : landmark?.name || title || "Human anatomy"}
              </strong>
              {isolated && !compare && (
                <button
                  onClick={() => {
                    setIsolated(null);
                    setAttachmentKind(null);
                    requestFrame([], "front");
                  }}
                >
                  <ArrowLeft size={12} />
                  Back to body
                </button>
              )}
            </div>
            <div className="pro-camera-tools">
              <button
                aria-label="Zoom anatomy in"
                onClick={() => api.current?.zoom(0.8)}
              >
                <Expand size={16} />
              </button>
              <button
                aria-label="Zoom anatomy out"
                onClick={() => api.current?.zoom(1.25)}
              >
                <Minus size={16} />
              </button>
              <button aria-label="Reset anatomy" onClick={reset}>
                <RotateCcw size={16} />
              </button>
              <button
                aria-label="Undo anatomy change"
                disabled={!history.length}
                onClick={undo}
              >
                <Undo2 size={16} />
              </button>
            </div>
            {hover && !compare && (
              <div className="pro-hover" role="status">
                {hover}
              </div>
            )}
            {!compare && model && (
              <div className="pro-selection-actions">
                <span>{title}</span>
                <button onClick={() => requestFrame(selectedIds)}>
                  <Focus size={14} />
                  Focus
                </button>
                <button onClick={isolateSelected}>
                  <Box size={14} />
                  Isolate
                </button>
                <button onClick={hideSelected}>
                  <EyeOff size={14} />
                  Hide
                </button>
                <button aria-label="Clear anatomy selection" onClick={clear}>
                  <X size={14} />
                </button>
              </div>
            )}
            <div className="pro-view-controls">
              {(
                [
                  "front",
                  "back",
                  "left",
                  "right",
                  "superior",
                  "inferior",
                ] as CameraView[]
              ).map((v) => (
                <button
                  key={v}
                  className={
                    (compare ? compareView : view) === v ? "active" : ""
                  }
                  aria-label={`Anatomy ${v} view`}
                  onClick={() => {
                    if (compare) {
                      setCompareView(v);
                      compareApis.current.forEach((api) => api?.view(v));
                    } else changeView(v);
                  }}
                >
                  {v[0].toUpperCase() + v.slice(1)}
                </button>
              ))}
            </div>
            {browse && (
              <div className="pro-browser">
                <div>
                  <strong>Find a structure</strong>
                  <button
                    aria-label="Close anatomy browser"
                    onClick={() => setBrowse(false)}
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="pro-browser-kinds">
                  {["All", "Bones", "Muscles", "Connective"].map((k) => (
                    <button
                      key={k}
                      aria-pressed={kind === k}
                      onClick={() => setKind(k)}
                    >
                      {k}
                    </button>
                  ))}
                </div>
                <small>
                  {matches.length} results
                  {matches.length > 70 ? " · narrow your search" : ""}
                </small>
                <div className="pro-browser-results">
                  {matches.slice(0, 70).map((m) => (
                    <button key={m.id} onClick={() => pick(m.id, true)}>
                      <span>
                        {selectionMode === "tissue" ? m.name : displayName(m)}
                        <small>
                          {m.layer?.replace(/_/g, " ")} · {getRegion(m)}
                        </small>
                      </span>
                      <Focus size={14} />
                    </button>
                  ))}
                  {!matches.length && <p>No structures match this search.</p>}
                </div>
              </div>
            )}
          </div>
          <div className="pro-layer-dock">
            <span>
              <Layers size={15} />
              Layers
            </span>
            {layerGroups.map(([name, types]) => (
              <div key={name} className="pro-layer-group">
                <button
                  aria-pressed={
                    types.every((t) => layers[t] > 0)
                      ? true
                      : types.some((t) => layers[t] > 0)
                        ? "mixed"
                        : false
                  }
                  onClick={() => toggleLayer(name, types)}
                >
                  <span className={`layer-dot ${name.toLowerCase()}`} />
                  {name}
                </button>
                <button
                  aria-label={`${name} transparency controls`}
                  className="layer-settings"
                  onClick={() => setLayerMenu(layerMenu === name ? null : name)}
                >
                  <ChevronDown size={12} />
                </button>
              </div>
            ))}
            <button className="pro-restore" onClick={restore}>
              Restore{hidden.length ? ` (${hidden.length})` : ""}
            </button>
            {layerMenu && (
              <div className="pro-layer-popover">
                <div>
                  <strong>{layerMenu}</strong>
                  <button
                    aria-label="Close transparency controls"
                    onClick={() => setLayerMenu(null)}
                  >
                    <X size={15} />
                  </button>
                </div>
                {layerGroups
                  .find(([n]) => n === layerMenu)![1]
                  .map((l) => (
                    <label key={l}>
                      <span>
                        {layerNames[l]}
                        <output>{Math.round((layers[l] || 0) * 100)}%</output>
                      </span>
                      <input
                        aria-label={`${layerNames[l]} opacity`}
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={(layers[l] || 0) * 100}
                        onChange={(e) => {
                          const value = +e.target.value / 100;
                          setLayers((v) => ({ ...v, [l]: value }));
                          if (value)
                            onVisibleChange([
                              ...new Set([
                                ...visible,
                                ...modelParts
                                  .filter((m) => m.layer === l)
                                  .map((m) => m.system),
                              ]),
                            ]);
                        }}
                      />
                    </label>
                  ))}
                <small>
                  0% hides a layer. Lower opacity reveals structures beneath it.
                </small>
              </div>
            )}
          </div>
          <div className="pro-selection-strip">
            <label>
              <MousePointer2 size={13} />
              <select
                aria-label="Anatomy selection mode"
                value={selectionMode}
                onChange={(e) => {
                  const v = e.target.value as typeof selectionMode;
                  setSelectionMode(v);
                  if (v === "landmark") setInfoTab("Landmarks");
                }}
              >
                <option value="structure">Whole structures</option>
                <option value="tissue">Tissue regions</option>
                <option value="landmark">Landmarks</option>
              </select>
            </label>
            <label>
              <input
                type="checkbox"
                checked={labels}
                onChange={(e) => setLabels(e.target.checked)}
              />
              Labels
            </label>
            <label>
              <input
                type="checkbox"
                checked={quality}
                onChange={(e) => setQuality(e.target.checked)}
              />
              Close-up shading
            </label>
            <span>Drag to rotate · scroll to zoom</span>
          </div>
        </section>
        <aside className="pro-inspector">
          {compare ? (
            <>
              <span className="pro-eyebrow">COMPARE ANATOMY</span>
              <h2>Same scale. Different structure.</h2>
              <p>
                Compare the ring of C1, the dens of C2, cervical transverse
                foramina, thoracic rib facets, and larger lumbar bodies.
              </p>
              <div className="pro-compare-quick">
                {["Vertebra C4", "Vertebra T8", "Vertebra L3"].map((n) => (
                  <button
                    key={n}
                    onClick={() => setCompareIds([sourceId(n), compareIds[1]])}
                  >
                    {n.replace("Vertebra ", "")}
                  </button>
                ))}
              </div>
              <button
                className="pro-study-button"
                onClick={() => onQuiz("3d:spine")}
              >
                <GraduationCap size={15} />
                Practice spine anatomy
              </button>
            </>
          ) : study && model ? (
            <>
              <div className="pro-inspector-heading">
                <span className="pro-eyebrow">
                  {model.layer === "attachment"
                    ? "ILLUSTRATED ATTACHMENT"
                    : study.kind}
                </span>
                <button
                  aria-label={
                    bookmarks.includes(study.id)
                      ? "Remove structure bookmark"
                      : "Bookmark structure"
                  }
                  onClick={() => onBookmark(study.id)}
                >
                  <Bookmark size={17} />
                </button>
              </div>
              <h2>{title}</h2>
              <p className="pro-structure-meta">
                {systems.find((s) => s.id === study.system)?.name} ·{" "}
                {getRegion(model)}
              </p>
              {model.surfaceRegion && (
                <p className="pro-source-note">
                  Source-classified {model.layer} surface region of {base?.name}
                  . It is not a separately segmented tissue volume.
                </p>
              )}
              {spineModels.some((m) => m.id === base?.id) && (
                <div className="pro-spine-picker">
                  <select
                    aria-label="Choose a vertebra"
                    value={base!.id}
                    onChange={(e) => pick(e.target.value, true)}
                  >
                    {spineModels.map((b) => (
                      <option key={b.id} value={b.id}>
                        {spineCode(b.name)} · {spineRegion(b.name)}
                      </option>
                    ))}
                  </select>
                  <p>{spineRegionNotes[spineRegion(base!.name)]}</p>
                </div>
              )}
              {primaryGroup.length > 1 && (
                <details className="pro-components">
                  <summary>
                    Muscle regions <span>{primaryGroup.length}</span>
                  </summary>
                  {primaryGroup.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => {
                        setSelected(m.id);
                        setScope("component");
                      }}
                    >
                      {componentName(m)}
                    </button>
                  ))}
                  {scope !== "whole" && (
                    <button onClick={() => setScope("whole")}>
                      Select whole muscle
                    </button>
                  )}
                </details>
              )}
              <div className="pro-info-tabs">
                {["Overview", "Landmarks", "Attachments"].map((t) => (
                  <button
                    key={t}
                    className={infoTab === t ? "active" : ""}
                    onClick={() => {
                      setInfoTab(t);
                      if (t === "Landmarks") setSelectionMode("landmark");
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
              {infoTab === "Overview" ? (
                <div className="pro-notes">
                  <h4>Function</h4>
                  <p>{study.function}</p>
                  <h4>Location & relationships</h4>
                  <p>{study.location}</p>
                  {study.actions && (
                    <>
                      <h4>Actions</h4>
                      <p>{study.actions}</p>
                    </>
                  )}
                  <p className="pro-coverage">
                    {study.detailLevel === "detailed"
                      ? "Detailed parent study notes"
                      : study.detailLevel === "overview"
                        ? "Functional overview"
                        : "Identification and general role"}
                  </p>
                </div>
              ) : infoTab === "Landmarks" ? (
                <div className="pro-landmarks">
                  {landmark ? (
                    <div className="pro-landmark-detail">
                      <button
                        className="pro-text-button"
                        onClick={() => setLandmark(null)}
                      >
                        <ArrowLeft size={12} />
                        All landmarks
                      </button>
                      <h3>{landmark.name}</h3>
                      <h4>Location</h4>
                      <p>{landmark.location}</p>
                      <h4>Function</h4>
                      <p>{landmark.function}</p>
                      <h4>Distinguishing features</h4>
                      <p>{landmark.features}</p>
                      {landmark.contents && (
                        <>
                          <h4>What passes through</h4>
                          <p>{landmark.contents}</p>
                        </>
                      )}
                      <button
                        className="pro-study-button"
                        onClick={() => focusLandmark(landmark)}
                      >
                        <Focus size={14} />
                        View in context
                      </button>
                      <small>
                        Source-anchored annotation ·{" "}
                        {landmark.contextIds.length > 1
                          ? "articulated bones and disc"
                          : "not a separately segmented landmark volume"}
                      </small>
                    </div>
                  ) : localLandmarks.length ? (
                    <>
                      <p>
                        Select a source-anchored landmark. Labels follow the
                        anatomy as you rotate.
                      </p>
                      {localLandmarks.map((l) => (
                        <button key={l.id} onClick={() => focusLandmark(l)}>
                          <span>{l.name}</span>
                          <MapPin size={13} />
                        </button>
                      ))}
                    </>
                  ) : (
                    <>
                      <p>
                        No reviewed source-anchor map is available for this
                        structure yet. Detailed points are available on
                        representative C1, C2, C4, T8, and L3 vertebrae and
                        selected limb/pelvic bones.
                      </p>
                      {[
                        "Atlas (C1)",
                        "Axis (C2)",
                        "Vertebra C4",
                        "Vertebra T8",
                        "Vertebra L3",
                      ].map((n) => (
                        <button key={n} onClick={() => pick(sourceId(n), true)}>
                          {n}
                        </button>
                      ))}
                    </>
                  )}
                </div>
              ) : (
                <div className="pro-notes">
                  {base?.layer === "muscles" && /head|part of|belly of/i.test(base.name) && <p>Study notes may describe the parent muscle; individual head attachments can differ. Source patches apply only to the selected component where available.</p>}
                  {base?.layer === "muscles" && <div className="pro-attachment-buttons">
                    {(["origin", "insertion"] as const).map((k) => (
                      <button
                        key={k}
                        disabled={
                          !attachmentCandidates.some(
                            (m) => m.attachmentKind === k,
                          )
                        }
                        onClick={() => attachments(k)}
                      >
                        <span className={k} />
                        {k === "origin" ? "Show origin" : "Show insertion"}
                      </button>
                    ))}
                  </div>}
                  {overlays.length > 0 && (
                    <div className="pro-attachment-key">
                      <strong>Illustrated {attachmentKind} region</strong>
                      <p>
                        These source-authored patches mark bone attachment
                        areas. Actual tendon surfaces are controlled separately
                        under Connective.
                      </p>
                    </div>
                  )}
                  {(
                    ["origin", "insertion", "actions", "innervation"] as const
                  ).map((k) =>
                    study[k] ? (
                      <div key={k}>
                        <h4>{base?.layer === "ligaments" && (k === "origin" || k === "insertion") ? (k === "origin" ? "Attachment 1" : "Attachment 2") : k[0].toUpperCase() + k.slice(1)}</h4>
                        <p>{study[k]}</p>
                      </div>
                    ) : null,
                  )}
                  {!study.origin && (
                    <p>
                      Detailed attachment/innervation notes are not yet reviewed
                      for this structure. Source overlays are available only
                      where the atlas provides them.
                    </p>
                  )}
                </div>
              )}
              <button
                className="pro-study-button"
                onClick={() => onQuiz("model:" + (base?.id || model.id))}
              >
                <GraduationCap size={15} />
                Study this anatomy
              </button>
              <details className="pro-source-details">
                <summary>Sources & coverage</summary>
                <p>{study.source}</p>
                <p>
                  Geometry and annotation anchors: Z-Anatomy. Source surface
                  regions and attachment illustrations are labeled separately
                  from tissue volumes.
                </p>
              </details>
            </>
          ) : (
            <>
              <span className="pro-eyebrow">ANATOMY AT YOUR FINGERTIPS</span>
              <h2>Select. Explore. Understand.</h2>
              <p>
                Click a structure on the body to highlight it in place. Use
                Focus for a slow close-up, or Isolate to study it on its own.
              </p>
              <div className="pro-start-actions">
                <button onClick={() => pick(sourceId("Vertebra L3"), true)}>
                  Explore a lumbar vertebra <Focus size={14} />
                </button>
                <button onClick={() => pick(sourceId("Atlas (C1)"), true)}>
                  Atlas & axis <Focus size={14} />
                </button>
                <button onClick={() => preset("Shoulder")}>
                  Shoulder relationships <Focus size={14} />
                </button>
              </div>
              <div className="pro-display-options">
                <h4>Display</h4>
                <label>
                  <input
                    type="checkbox"
                    checked={autoFocus}
                    onChange={(e) => setAutoFocus(e.target.checked)}
                  />
                  Focus after selecting
                </label>
                <p>
                  Focus moves the camera smoothly; anatomy stays in its
                  registered position.
                </p>
              </div>
              <div className="pro-atlas-source">
                <strong>Z-Anatomy atlas</strong>
                <p>
                  {modelParts
                    .filter((m) => m.layer !== "attachment")
                    .length.toLocaleString()}{" "}
                  tissue/structure parts ·{" "}
                  {
                    modelParts.filter((m) => m.layer === "attachment").length
                  }{" "}
                  illustrated attachment regions
                </p>
                <p>
                  Open atlas geometry. Skin retains regional seams. Fine fiber textures and photoreal skin
                  are not included.
                </p>
              </div>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
