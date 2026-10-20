import { PlateExplorer } from "./PlateExplorer";
import { anatomyImages } from "./assetPaths";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import {
  Activity,
  Palette,
  Box,
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Bookmark,
  Brain,
  ChevronDown,
  ChevronRight,
  Check,
  CheckCircle2,
  Compass,
  Droplets,
  Eye,
  EyeOff,
  FlaskConical,
  Flower2,
  GraduationCap,
  Heart,
  Layers,
  Leaf,
  Lightbulb,
  Maximize2,
  Menu,
  Microscope,
  Minus,
  Move,
  Plus,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  Undo2,
  Wind,
  X,
  ZoomIn,
  ChartNoAxesCombined,
  Bone,
  Info,
  Scissors,
  SlidersHorizontal,
} from "lucide-react";
import {
  structures,
  systems,
  regions,
  tissues,
  directions,
  type Tissue,
} from "./content";
import { Atlas, atlasAreas } from "./atlas";
import {
  AppearanceSettings,
  applyAppearance,
  defaultAppearance,
  type Appearance,
} from "./Appearance";
import { LicenseSummary } from "./LicenseSummary";
import { AtlasHub } from "./AtlasHub";
import { TissueBridge, HistologyFigure } from "./Histology";
import { PTLearning } from "./PTLearning";
import { StudyGames } from "./StudyGames";
import { Tutorial } from "./Tutorial";
import { readAtlasState } from "./workspaceStorage";
import type { StudyCollection } from "./studyCollections";
import "./learning.css";
import {
  modelParts,
  getModelStudy,
  getRegion,
  resolveStructure,
} from "./modelCatalog";
import { TissueDiagram } from "./TissueDiagram";
import { Quizzes, defaultScope } from "./Quizzes";
const Course = lazy(() =>
  import("./Course").then((m) => ({ default: m.Course })),
);
import { useStored } from "./storage";
import {
  createQuestions,
  isCorrect,
  type CourseCard,
  type QuizScope,
  type Result,
} from "./quiz";
type Tab =
  | "explorer"
  | "tissues"
  | "quizzes"
  | "progress"
  | "course"
  | "pt"
  | "games";
const systemIcons = [
  Leaf,
  Bone,
  Activity,
  Brain,
  FlaskConical,
  Heart,
  ShieldCheck,
  Wind,
  BookOpen,
  Droplets,
  Flower2,
];
export default function App() {
  const [tab, setTab] = useState<Tab>("explorer");
  const [ligamentsVisible, setLigamentsVisible] = useState(false);
  useEffect(() => {
    const f = (e: Event) => setLigamentsVisible(!!(e as CustomEvent).detail);
    window.addEventListener("forma-ligament-state", f);
    return () => window.removeEventListener("forma-ligament-state", f);
  }, []);
  const [system, setSystem] = useState("muscular");
  const [visible, setVisible] = useState(
    () => readAtlasState("main")?.visible || ["skeletal"],
  );
  const [bridge, setBridge] = useState<{
    id: string;
    alveoli?: boolean;
  } | null>(null);
  const [ptRegion, setPtRegion] = useState("");
  const [gameCollection, setGameCollection] = useState("");
  const [tour, setTour] = useState(false);
  const [tourSeen, setTourSeen] = useStored("forma-tour-seen", false);
  const [collections] = useStored<StudyCollection[]>(
    "forma-collections-v1",
    [],
  );
  const [highlightedSystems, setHighlightedSystems] = useState<string[]>([]);
  const [explorerMode, setExplorerMode] = useStored<"3d" | "2d">(
    "forma-explorer-view",
    "3d",
  );
  const [appearance, setAppearance] = useStored<Appearance>(
    "forma-appearance",
    defaultAppearance,
  );
  const [showAppearance, setShowAppearance] = useState(false);
  const [focusVersion, setFocusVersion] = useState(0);
  useEffect(() => applyAppearance(appearance), [appearance]);
  const [region, setRegion] = useState("");
  const [navMode, setNavMode] = useState("Systems");
  const [selected, setSelected] = useState("pectoralis-major");
  const [view, setView] = useState("front");
  const [hidden, setHidden] = useState<string[]>([]);
  const [history, setHistory] = useState<string[][]>([]);
  const [plateMode, setPlateMode] = useState("reference");
  const [labels, setLabels] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [transparent, setTransparent] = useState(false);
  const [search, setSearch] = useState("");
  const [infoTab, setInfoTab] = useState("Overview");
  const [modal, setModal] = useState("");
  const [toast, setToast] = useState("");
  const [menu, setMenu] = useState(false);
  const [quizScope, setQuizScope] = useState<Partial<QuizScope>>({});
  const [quizKey, setQuizKey] = useState(0);
  const [bookmarks, setBookmarks] = useStored<string[]>("forma-bookmarks", []);
  const [results, setResults] = useStored<Result[]>("forma-results", []);
  const [missed, setMissed] = useStored<string[]>("forma-missed", []);
  const [saved, setSaved] = useStored<string[]>("forma-saved-questions", []);
  const [cards, setCards] = useStored<CourseCard[]>("forma-cards", []);
  const inputRef = useRef<HTMLInputElement>(null);
  const s = resolveStructure(selected) || structures[0];
  const sys = systems.find((s) => s.id === system)!;
  const layer = system === "skeletal" ? "skeletal" : "muscular";
  const mapped = atlasAreas(layer, view).some((a) => a.id === selected);
  const mappedCount = atlasAreas(layer, view).length;
  const matches = search
    ? [
        ...structures,
        ...modelParts
          .filter((m) => m.name.toLowerCase().includes(search.toLowerCase()))
          .slice(0, 10)
          .map(getModelStudy),
      ]
        .filter((s) =>
          `${s.name} ${s.aliases.join(" ")} ${s.system}`
            .toLowerCase()
            .includes(search.toLowerCase()),
        )
        .slice(0, 10)
    : [];
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 4200);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape") {
        setModal("");
        setSearch("");
        setMenu(false);
      }
    };
    const storage = () =>
      setToast(
        "Browser storage is full. This change is available for this session but could not be saved.",
      );
    window.addEventListener("keydown", key);
    window.addEventListener("forma-storage-error", storage);
    return () => {
      window.removeEventListener("keydown", key);
      window.removeEventListener("forma-storage-error", storage);
    };
  }, []);
  useEffect(() => {
    if (!modal) return;
    const previous = document.activeElement as HTMLElement | null;
    const dialog = document.querySelector<HTMLElement>(".modal");
    const nodes = () =>
      Array.from(
        dialog?.querySelectorAll<HTMLElement>(
          'button, a[href], input, select, summary, [tabindex="0"]',
        ) || [],
      );
    nodes()[0]?.focus();
    const trap = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const all = nodes();
      const first = all[0],
        last = all[all.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", trap);
    return () => {
      document.removeEventListener("keydown", trap);
      previous?.focus();
    };
  }, [modal]);
  function openQuiz(scope: Partial<QuizScope> = {}) {
    setQuizScope(scope);
    setQuizKey((k) => k + 1);
    setTab("quizzes");
    setMenu(false);
  }
  function select(id: string) {
    const item = resolveStructure(id);
    if (!item) return;
    setFocusVersion((v) => v + 1);
    setSelected(id);
    setInfoTab("Overview");
    setSystem(item.system);
    setVisible((v) => (v.includes(item.system) ? v : [...v, item.system]));
    setHidden((h) => h.filter((x) => x !== id));
    if (item.system === "muscular") {
      if (!atlasAreas("muscular", view).some((x) => x.id === id))
        setView(
          atlasAreas("muscular", "front").some((x) => x.id === id)
            ? "front"
            : "back",
        );
    }
    setSearch("");
    setTab("explorer");
    setMenu(false);
  }
  function selectSystem(id: string) {
    setSystem(id);
    setVisible([id]);
    setRegion("");
    const first = structures.find((s) => s.system === id);
    if (first) setSelected(first.id);
    setInfoTab("Overview");
    setMenu(false);
  }
  function toggleVisible(id: string) {
    if (visible.includes(id))
      setHighlightedSystems((h) => h.filter((x) => x !== id));
    setVisible((v) =>
      v.includes(id) ? v.filter((x) => x !== id) : [...v, id],
    );
  }
  function mask(ids: string[]) {
    setHistory([...history, hidden]);
    setHidden(ids);
  }
  function reset() {
    setHidden([]);
    setHistory([]);
    setZoom(1);
    setTransparent(false);
    setView("front");
    setToast("Atlas view restored.");
  }
  const average = results.length
    ? Math.round(results.reduce((n, r) => n + r.score, 0) / results.length)
    : 0;
  return (
    <div
      className={`app-shell ${tab === "explorer" && explorerMode === "3d" ? "anatomy-workspace" : ""}`}
    >
      <header className="topbar">
        <button
          className="mobile-menu icon-button"
          aria-label="Open navigation"
          onClick={() => setMenu(!menu)}
        >
          <Menu size={22} />
        </button>
        <button className="brand" onClick={() => setTab("explorer")}>
          <span className="brand-mark">
            <Flower2 size={29} />
          </span>
          forma<span className="brand-dot">.</span>
        </button>
        <span className="brand-tagline">ANATOMY, UNDERSTOOD.</span>
        <nav className="main-nav" aria-label="Main navigation">
          {[
            { id: "explorer", name: "Body Explorer", icon: Compass },
            { id: "tissues", name: "Tissues", icon: Microscope },
            { id: "quizzes", name: "Quizzes", icon: GraduationCap },
            { id: "pt", name: "PT / AT", icon: Activity },
            { id: "games", name: "Games", icon: Brain },
            { id: "progress", name: "My Progress", icon: ChartNoAxesCombined },
          ].map((n) => (
            <button
              key={n.id}
              className={tab === n.id ? "active" : ""}
              onClick={() => {
                setTab(n.id as Tab);
                setMenu(false);
              }}
            >
              <n.icon size={17} />
              {n.name}
            </button>
          ))}
        </nav>
        <button
          className="appearance-trigger secondary"
          onClick={() => setShowAppearance(true)}
        >
          <Palette size={16} />
          <span>Customize</span>
        </button>
        <button
          className={`course-link ${tab === "course" ? "active" : ""}`}
          onClick={() => setTab("course")}
        >
          <BookOpen size={16} />
          <span>My materials</span>
        </button>
        <button
          className="help-trigger"
          onClick={() => {
            setTour(true);
            setTourSeen(true);
          }}
        >
          Help
        </button>
        <div className="avatar" title="Local study profile">
          S
        </div>
      </header>
      <div className="app-layout">
        <aside className={`sidebar ${menu ? "open" : ""}`}>
          <div className="sidebar-title">
            <span className="eyebrow">YOUR ANATOMY ATLAS</span>
            <h2>Explore the body</h2>
            <p>Show layers. Highlight systems.</p>
          </div>
          <div className="segmented nav-mode">
            {["Systems", "Regions"].map((v) => (
              <button
                key={v}
                className={navMode === v ? "active" : ""}
                onClick={() => {
                  setNavMode(v);
                  setTab("explorer");
                }}
              >
                {v}
              </button>
            ))}
          </div>
          {navMode === "Systems" ? (
            <div className="system-list">
              {systems.map((x, i) => {
                const Icon = systemIcons[i];
                return (
                  <div
                    className={`system-row ${tab === "explorer" && (explorerMode === "3d" ? visible.includes(x.id) : x.id === system) ? "active" : ""} ${highlightedSystems.includes(x.id) && explorerMode === "3d" ? "system-highlighted" : ""}`}
                    key={x.id}
                  >
                    <button
                      className="system-name"
                      aria-label={
                        explorerMode === "3d"
                          ? `${visible.includes(x.id) ? "Hide" : "Show"} ${x.name} system`
                          : undefined
                      }
                      aria-pressed={
                        explorerMode === "3d"
                          ? visible.includes(x.id)
                          : undefined
                      }
                      onClick={() => {
                        if (explorerMode === "3d") {
                          toggleVisible(x.id);
                          setSystem(x.id);
                          setMenu(false);
                        } else selectSystem(x.id);
                        setTab("explorer");
                      }}
                    >
                      <span
                        className="system-symbol"
                        style={{ color: x.color }}
                      >
                        <Icon size={18} />
                      </span>
                      <span>{x.name}</span>
                      {explorerMode === "3d" && (
                        <span className="system-eye">
                          {visible.includes(x.id) ? (
                            <Eye size={13} />
                          ) : (
                            <EyeOff size={13} />
                          )}
                        </span>
                      )}
                    </button>
                    {explorerMode === "3d" ? (
                      <button
                        className={`system-highlight-button ${highlightedSystems.includes(x.id) ? "active" : ""}`}
                        aria-pressed={highlightedSystems.includes(x.id)}
                        aria-label={`${highlightedSystems.includes(x.id) ? "Unhighlight" : "Highlight"} ${x.name} system`}
                        title="Highlight this system without removing the body"
                        onClick={() => {
                          setHighlightedSystems((h) =>
                            h.includes(x.id)
                              ? h.filter((id) => id !== x.id)
                              : [...h, x.id],
                          );
                          if (!visible.includes(x.id))
                            setVisible((v) => [...v, x.id]);
                        }}
                      >
                        <Target size={14} />
                      </button>
                    ) : (
                      <button
                        className="visibility-button"
                        aria-label={`${visible.includes(x.id) ? "Hide" : "Show"} ${x.name} system`}
                        onClick={() => toggleVisible(x.id)}
                      >
                        {visible.includes(x.id) ? (
                          <Eye size={14} />
                        ) : (
                          <Plus size={13} />
                        )}
                      </button>
                    )}
                  </div>
                );
              })}
              {explorerMode === "3d" && (
                <label className="sidebar-ligaments">
                  <input
                    type="checkbox"
                    checked={ligamentsVisible}
                    onChange={(e) => {
                      setLigamentsVisible(e.target.checked);
                      setTab("explorer");
                      window.dispatchEvent(
                        new CustomEvent("forma-ligaments", {
                          detail: e.target.checked,
                        }),
                      );
                    }}
                  />
                  <span>Ligaments</span>
                  <small>Show / hide all modeled ligaments</small>
                </label>
              )}
              {explorerMode === "3d" && (
                <p className="system-help">
                  <Eye size={12} /> Show / hide <Target size={12} /> Highlight
                </p>
              )}
            </div>
          ) : (
            <div className="region-list">
              <button
                className={!region ? "active" : ""}
                onClick={() => {
                  setRegion("");
                  setTab("explorer");
                }}
              >
                <Compass size={17} />
                Whole body
                <ChevronRight size={15} />
              </button>
              {regions.map((r) => (
                <button
                  className={region === r ? "active" : ""}
                  key={r}
                  onClick={() => {
                    setRegion(r);
                    setTab("explorer");
                    setMenu(false);
                  }}
                >
                  <Move size={17} />
                  {r}
                  <ChevronRight size={15} />
                </button>
              ))}
              <p className="small muted">
                Select a region to browse its structures below the atlas.
              </p>
            </div>
          )}
          <button className="anatomy-basics" onClick={() => setModal("basics")}>
            <Compass size={16} />
            <span>Anatomy essentials</span>
            <ArrowUpRight size={14} />
          </button>
          <div className="sidebar-bottom">
            <div className="study-card">
              <span className="little-spark">
                <Sparkles size={19} />
              </span>
              <h3>
                A little practice.
                <br />A lot more confidence.
              </h3>
              <p>Turn what you explore into what you remember.</p>
              <button onClick={() => openQuiz({ system })}>
                Create a quiz <ArrowRight size={15} />
              </button>
            </div>
            <button className="source-link" onClick={() => setModal("sources")}>
              <ShieldCheck size={14} />
              Sources & atlas coverage
              <ArrowUpRight size={12} />
            </button>
            <p className="local-note">
              <span />
              {modelParts.length.toLocaleString()} source parts ·{" "}
              {tissues.length} tissues
            </p>
          </div>
        </aside>
        <main className={`main-content ${tab}`}>
          <div className="workspace-bar">
            <span>
              My workspace <ChevronRight size={12} />{" "}
              <strong>
                {tab === "explorer"
                  ? "Body Explorer"
                  : tab === "tissues"
                    ? "Tissue Library"
                    : tab === "quizzes"
                      ? "Quizzes"
                      : tab === "progress"
                        ? "My Progress"
                        : tab === "pt"
                          ? "PT / AT"
                          : tab === "games"
                            ? "Games"
                            : "My Materials"}
              </strong>
            </span>
            <span className="device-status">
              <span />
              Saved on this device
            </span>
          </div>
          <div hidden={tab !== "explorer"}>
            <div className="page-heading">
              <div>
                <span className="eyebrow">LOOK CLOSER. CONNECT THE DOTS.</span>
                <h1>Explore anatomy.</h1>
                <p>One body. Choose the layers you want to study.</p>
              </div>
              <div className="search-container">
                <Search size={17} />
                <input
                  ref={inputRef}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  aria-label="Search anatomy structures"
                  placeholder="Find a structure…"
                />
                <kbd>⌘ K</kbd>
                {search && (
                  <div className="search-results">
                    {matches.length ? (
                      matches.map((x) => (
                        <button key={x.id} onClick={() => select(x.id)}>
                          <Search size={14} />
                          <span>
                            {x.name}
                            <small>
                              {systems.find((a) => a.id === x.system)?.name} ·{" "}
                              {x.region}
                            </small>
                          </span>
                          <ArrowUpRight size={13} />
                        </button>
                      ))
                    ) : (
                      <p>No matching structures in this collection.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="explorer-modebar">
              <div className="segmented">
                <button
                  className={explorerMode === "3d" ? "active" : ""}
                  onClick={() => setExplorerMode("3d")}
                >
                  <Box size={15} />
                  3D explorer
                </button>
                <button
                  className={explorerMode === "2d" ? "active" : ""}
                  onClick={() => setExplorerMode("2d")}
                >
                  <BookOpen size={15} />
                  2D reference
                </button>
              </div>
              <span>Click to select · click again to clear</span>
            </div>
            {explorerMode === "3d" ? (
              <AtlasHub
                onTissue={(id, alveoli) => setBridge({ id, alveoli })}
                onPT={(r) => {
                  setPtRegion(r);
                  setTab("pt");
                }}
                onCollectionQuiz={(c) =>
                  openQuiz({
                    modelIds: c.ids,
                    scopeLabel: c.name,
                    system: "",
                    anatomy: true,
                    structure: "",
                    format: "mixed",
                  })
                }
                onCollectionGame={(c) => {
                  setGameCollection(c.id);
                  setTab("games");
                }}
                visible={visible}
                onVisibleChange={setVisible}
                onRegionChange={setRegion}
                onReference={() => setExplorerMode("2d")}
                highlightedSystems={highlightedSystems}
                onClearHighlights={() => setHighlightedSystems([])}
                region={region}
                request={{ id: selected, version: focusVersion }}
                appearance={appearance}
                onSelect={(id) => setSelected(id)}
                onBookmark={(id) => {
                  setBookmarks(
                    bookmarks.includes(id)
                      ? bookmarks.filter((x) => x !== id)
                      : [...bookmarks, id],
                  );
                  setToast(
                    bookmarks.includes(id)
                      ? "Bookmark removed."
                      : "Saved to My Progress.",
                  );
                }}
                bookmarks={bookmarks}
                onQuiz={(id) =>
                  openQuiz({
                    anatomy: true,
                    system: id.startsWith("model:")
                      ? resolveStructure(id)?.system || "skeletal"
                      : "skeletal",
                    anatomyTopic: id === "3d:spine" ? "spine" : "",
                    structure: id.startsWith("3d:") ? "" : id,
                  })
                }
              />
            ) : (
              <>
                <div className="segmented plate-mode">
                  <button
                    aria-pressed={plateMode === "reference"}
                    onClick={() => setPlateMode("reference")}
                  >
                    Reference atlas
                  </button>
                  <button
                    aria-pressed={plateMode === "overview"}
                    onClick={() => setPlateMode("overview")}
                  >
                    Interactive overview
                  </button>
                </div>
                {plateMode === "reference" ? (
                  <PlateExplorer
                    initial={system === "skeletal" ? "Skeleton" : "Muscles"}
                    on3D={(id) => {
                      setExplorerMode("3d");
                      if (id) {
                        setSelected("model:" + id);
                        setFocusVersion((v) => v + 1);
                      }
                    }}
                    onTissue={() => setTab("tissues")}
                  />
                ) : (
                  <div className="explorer-grid">
                    <section className="viewer panel">
                      <div className="viewer-header">
                        <div>
                          <span
                            className="system-color"
                            style={{ background: sys.color }}
                          />
                          <h2>{sys.name} system</h2>
                          <span className="atlas-badge">2D ATLAS</span>
                        </div>
                        <button
                          className="icon-button"
                          aria-label="Atlas view information"
                          onClick={() => setModal("coverage")}
                        >
                          <Info size={17} />
                        </button>
                      </div>
                      <div className="viewer-subbar">
                        <span>
                          {region || "Whole body"}
                          <ChevronDown size={12} />
                        </span>
                        <span>
                          {system === "muscular" || system === "skeletal"
                            ? `${mappedCount} selectable regions in this view`
                            : "Introductory system overview"}
                        </span>
                      </div>
                      {system === "muscular" || system === "skeletal" ? (
                        <div
                          className={`anatomy-stage ${visible.includes("muscular") && visible.includes("skeletal") ? "compare-atlas" : ""}`}
                        >
                          <span className="stage-direction">
                            {view === "front"
                              ? "ANTERIOR VIEW"
                              : "POSTERIOR VIEW"}
                            <small>
                              {system === "muscular"
                                ? "Superficial + selected deep anatomy"
                                : "Axial + appendicular skeleton"}
                            </small>
                          </span>
                          <div className="stage-actions">
                            <button
                              className="icon-button"
                              aria-label="Undo last removal"
                              disabled={!history.length}
                              onClick={() => {
                                setHidden(history.at(-1)!);
                                setHistory(history.slice(0, -1));
                              }}
                            >
                              <Undo2 size={17} />
                            </button>
                            <button
                              className="icon-button"
                              aria-label="Reset atlas"
                              onClick={reset}
                            >
                              <RotateCcw size={17} />
                            </button>
                            <button
                              className="icon-button"
                              aria-label="Expand source plate"
                              onClick={() =>
                                setModal(
                                  system === "skeletal"
                                    ? "bone-plate"
                                    : "muscle-plate",
                                )
                              }
                            >
                              <Maximize2 size={17} />
                            </button>
                          </div>
                          <div
                            className={`atlas-wrapper ${!visible.includes(system) ? "plate-hidden" : ""} ${transparent ? "faded" : ""}`}
                            style={{ transform: `scale(${zoom})` }}
                          >
                            <Atlas
                              region={region}
                              layer={layer}
                              view={view}
                              selected={selected}
                              hidden={hidden}
                              labels={labels}
                              onSelect={select}
                            />
                          </div>
                          {visible.includes("muscular") &&
                            visible.includes("skeletal") && (
                              <div className="comparison-mini">
                                <span>
                                  {layer === "muscular"
                                    ? "Skeletal"
                                    : "Muscular"}{" "}
                                  reference
                                </span>
                                <Atlas
                                  layer={
                                    layer === "muscular"
                                      ? "skeletal"
                                      : "muscular"
                                  }
                                  view={view}
                                  labels={false}
                                  mini
                                  onSelect={select}
                                />
                                <small>Separate plate · not registered</small>
                              </div>
                            )}
                          {!visible.includes(system) && (
                            <div className="plate-hidden-message">
                              <EyeOff size={24} />
                              <strong>{sys.name} plate hidden</strong>
                              <button
                                className="secondary"
                                onClick={() => toggleVisible(system)}
                              >
                                Restore plate
                              </button>
                            </div>
                          )}
                          <span className="orientation">
                            <span>S</span>
                            <div>
                              <span>{view === "front" ? "R" : "L"}</span>
                              <span>+</span>
                              <span>{view === "front" ? "L" : "R"}</span>
                            </div>
                            <span>I</span>
                          </span>
                          <div className="viewer-toolbar">
                            <div className="segmented view-switch">
                              <button
                                className={view === "front" ? "active" : ""}
                                onClick={() => setView("front")}
                              >
                                Front
                              </button>
                              <button
                                className={view === "back" ? "active" : ""}
                                onClick={() => setView("back")}
                              >
                                Back
                              </button>
                            </div>
                            <span className="toolbar-divider" />
                            <button
                              className={`toolbar-button ${labels ? "active" : ""}`}
                              disabled={system === "skeletal"}
                              title={
                                system === "skeletal"
                                  ? "Labels are embedded in the skeleton source plate"
                                  : "Toggle muscle labels"
                              }
                              onClick={() => setLabels(!labels)}
                              aria-pressed={labels}
                            >
                              <span className="label-icon">Aa</span>
                              {system === "skeletal"
                                ? "Source labels"
                                : "Labels"}
                            </button>
                            <span className="toolbar-divider" />
                            <button
                              className="icon-button"
                              aria-label="Zoom out"
                              disabled={zoom <= 0.7}
                              onClick={() =>
                                setZoom((z) => Math.max(0.7, z - 0.15))
                              }
                            >
                              <Minus size={17} />
                            </button>
                            <span className="zoom-value">
                              {Math.round(zoom * 100)}%
                            </span>
                            <button
                              className="icon-button"
                              aria-label="Zoom in"
                              disabled={zoom >= 1.75}
                              onClick={() =>
                                setZoom((z) => Math.min(1.75, z + 0.15))
                              }
                            >
                              <Plus size={17} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="system-overview-stage">
                          <div
                            className="large-system-icon"
                            style={{ color: sys.color }}
                          >
                            {(() => {
                              const Icon =
                                systemIcons[
                                  systems.findIndex((x) => x.id === system)
                                ];
                              return <Icon size={58} strokeWidth={1.2} />;
                            })()}
                          </div>
                          <span className="eyebrow">
                            ONE BODY. MANY CONNECTIONS.
                          </span>
                          <h2>{sys.name} system</h2>
                          <p>{sys.overview}</p>
                          <div className="overview-detail">
                            <strong>Major structures</strong>
                            <p>{sys.structures}</p>
                            <strong>Working together</strong>
                            <p>{sys.connections}</p>
                          </div>
                          <div className="overview-structures">
                            {structures
                              .filter((x) => x.system === system)
                              .map((x) => (
                                <button
                                  key={x.id}
                                  className={selected === x.id ? "active" : ""}
                                  onClick={() => select(x.id)}
                                >
                                  {x.name}
                                  <ArrowUpRight size={13} />
                                </button>
                              ))}
                          </div>
                          <p className="small muted">
                            Study entries available below. Selectable atlas
                            artwork for this system is planned.
                          </p>
                        </div>
                      )}
                      <div className="layer-controls">
                        <span>
                          <Layers size={16} />
                          Atlas plates
                        </span>
                        <button
                          className={system === "muscular" ? "active" : ""}
                          onClick={() => selectSystem("muscular")}
                        >
                          <span className="dot muscle" />
                          Muscles
                        </button>
                        <button
                          className={system === "skeletal" ? "active" : ""}
                          onClick={() => selectSystem("skeletal")}
                        >
                          <span className="dot skeleton" />
                          Bones
                        </button>
                        <button
                          className={transparent ? "active" : ""}
                          onClick={() => setTransparent(!transparent)}
                          aria-pressed={transparent}
                        >
                          <Eye size={13} />
                          Fade
                        </button>
                        {hidden.length > 0 && (
                          <button onClick={() => mask([])}>
                            {hidden.length} hidden · restore
                          </button>
                        )}
                      </div>
                      <p className="atlas-footnote">
                        <Info size={12} />
                        OpenStax educational plates. Regional masks hide
                        artwork; they do not reveal deeper layers.
                      </p>
                    </section>
                    <aside className="structure-panel panel">
                      <div className="structure-topline">
                        <span className="badge">
                          {s.origin
                            ? "SKELETAL MUSCLE"
                            : s.system === "skeletal"
                              ? "BONE"
                              : "STUDY STRUCTURE"}
                        </span>
                        <button
                          className={`icon-button ${bookmarks.includes(s.id) ? "bookmarked" : ""}`}
                          aria-label={
                            bookmarks.includes(s.id)
                              ? "Remove structure bookmark"
                              : "Bookmark structure"
                          }
                          onClick={() => {
                            setBookmarks(
                              bookmarks.includes(s.id)
                                ? bookmarks.filter((x) => x !== s.id)
                                : [...bookmarks, s.id],
                            );
                            setToast(
                              bookmarks.includes(s.id)
                                ? "Bookmark removed."
                                : "Saved to My Progress.",
                            );
                          }}
                        >
                          <Bookmark size={19} />
                        </button>
                      </div>
                      <h2>{s.name}</h2>
                      <span className="structure-subtitle">
                        {s.aliases.length ? s.aliases.join(" · ") : s.region}
                      </span>
                      <div className="structure-tools">
                        <button
                          disabled={!mapped}
                          onClick={() =>
                            mask(
                              hidden.includes(selected)
                                ? hidden.filter((x) => x !== selected)
                                : [...hidden, selected],
                            )
                          }
                        >
                          {hidden.includes(selected) ? (
                            <Eye size={15} />
                          ) : (
                            <EyeOff size={15} />
                          )}{" "}
                          {hidden.includes(selected) ? "Restore" : "Hide"}
                        </button>
                        <button
                          disabled={!mapped}
                          onClick={() =>
                            mask(
                              atlasAreas(layer, view)
                                .filter((a) => a.id !== selected)
                                .map((a) => a.id),
                            )
                          }
                        >
                          <Scissors size={15} />
                          Isolate
                        </button>
                        <button
                          onClick={() =>
                            openQuiz({ system: s.system, structure: s.id })
                          }
                        >
                          <GraduationCap size={15} />
                          Quiz
                        </button>
                      </div>
                      {!mapped && (
                        <p className="unmapped-note">
                          Study content available. This structure has no
                          selectable region in the current plate.
                        </p>
                      )}
                      <div className="detail-tabs">
                        {[
                          "Overview",
                          s.origin
                            ? "Attachments"
                            : s.landmarks
                              ? "Landmarks"
                              : "Details",
                        ].map((t) => (
                          <button
                            key={t}
                            className={infoTab === t ? "active" : ""}
                            onClick={() => setInfoTab(t)}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                      <div className="structure-details">
                        {infoTab === "Overview" ? (
                          <>
                            <p className="lead-description">{s.features}</p>
                            <div className="detail-block">
                              <span>
                                <Target size={14} />
                                PRIMARY FUNCTION
                              </span>
                              <p>{s.function}</p>
                            </div>
                            <div className="detail-block">
                              <span>
                                <Compass size={14} />
                                LOCATION
                              </span>
                              <p>{s.location}</p>
                            </div>
                            {s.tip && (
                              <div className="memory-tip">
                                <Lightbulb size={19} />
                                <div>
                                  <strong>A way to remember</strong>
                                  <p>{s.tip}</p>
                                </div>
                              </div>
                            )}
                            <details>
                              <summary>
                                Connections & identifying features
                                <Plus size={13} />
                              </summary>
                              <p>{s.description}</p>
                              <p>
                                {
                                  systems.find((x) => x.id === s.system)
                                    ?.connections
                                }
                              </p>
                            </details>
                          </>
                        ) : (
                          <>
                            {(s.origin
                              ? [
                                  ["Origin", s.origin],
                                  ["Insertion", s.insertion],
                                  ["Actions", s.actions],
                                  ["Innervation", s.innervation],
                                ]
                              : s.landmarks
                                ? [
                                    ["Major landmarks", s.landmarks],
                                    ["Articulations", s.articulations],
                                    ["Attachment sites", s.attachments],
                                  ]
                                : [
                                    ["Major parts", s.parts],
                                    ["Associated tissues", s.tissues],
                                    ["Course", s.route],
                                    ["Supply / drainage", s.supply],
                                  ]
                            )
                              .filter(([, value]) => value)
                              .map(([label, value]) => (
                                <div className="detail-block" key={label}>
                                  <span>{label}</span>
                                  <p>{value}</p>
                                </div>
                              ))}
                          </>
                        )}
                      </div>
                      <div className="structure-source">
                        <BookOpen size={12} />
                        <span>{s.source}</span>
                        <button
                          aria-label="View sources"
                          onClick={() => setModal("sources")}
                        >
                          <ArrowUpRight size={12} />
                        </button>
                      </div>
                    </aside>
                  </div>
                )}
              </>
            )}
            {explorerMode === "2d" && (
              <div className="explorer-bottom">
                <button
                  className="feature-card quiz-feature"
                  onClick={() => openQuiz({ system })}
                >
                  <span className="feature-icon">
                    <GraduationCap size={23} />
                  </span>
                  <div>
                    <span className="eyebrow">
                      FROM EXPLORING TO REMEMBERING
                    </span>
                    <h3>Put your knowledge to work.</h3>
                    <p>Build a quiz on what you’re studying.</p>
                  </div>
                  <ArrowUpRight size={21} />
                </button>
                <button
                  className="feature-card tissue-feature"
                  onClick={() => setTab("tissues")}
                >
                  <span className="feature-icon">
                    <Microscope size={22} />
                  </span>
                  <div>
                    <span className="eyebrow">
                      THE BIG PICTURE STARTS SMALL
                    </span>
                    <h3>Go beneath the surface.</h3>
                    <p>Get to know the tissues that make us.</p>
                  </div>
                  <ArrowUpRight size={21} />
                </button>
              </div>
            )}
            <details className="study-collection" open={explorerMode === "2d"}>
              <summary>
                Study notes & quick selection <ChevronDown size={15} />
              </summary>
              <section className="browse-section">
                <div className="section-heading">
                  <h3>{region || sys.name} study collection</h3>
                  <span>
                    {
                      structures.filter((x) =>
                        !region ? x.system === system : x.region === region,
                      ).length
                    }{" "}
                    structures
                  </span>
                </div>
                <p className="small muted">{sys.overview}</p>
                <div className="structure-chips">
                  {structures
                    .filter((x) =>
                      !region ? x.system === system : x.region === region,
                    )
                    .map((x) => (
                      <button
                        key={x.id}
                        className={selected === x.id ? "active" : ""}
                        onClick={() => select(x.id)}
                      >
                        {x.name}
                        <ArrowUpRight size={12} />
                      </button>
                    ))}
                </div>
                {visible
                  .filter(
                    (v) => v !== system && v !== "muscular" && v !== "skeletal",
                  )
                  .map((v) => {
                    const x = systems.find((s) => s.id === v)!;
                    return (
                      <div className="additional-system" key={v}>
                        <h4>
                          <span
                            className="system-color"
                            style={{ background: x.color }}
                          />
                          {x.name} system
                        </h4>
                        <p>{x.overview}</p>
                        <div className="structure-chips">
                          {structures
                            .filter((s) => s.system === v)
                            .map((s) => (
                              <button key={s.id} onClick={() => select(s.id)}>
                                {s.name}
                              </button>
                            ))}
                        </div>
                      </div>
                    );
                  })}
              </section>
            </details>
          </div>

          {tab === "pt" && (
            <PTLearning
              key={ptRegion}
              initialRegion={ptRegion}
              onStructure={(id) => {
                setTab("explorer");
                setExplorerMode("3d");
                setSelected("model:" + id);
                setFocusVersion((v) => v + 1);
              }}
              onExplore={(r) => {
                setTab("explorer");
                setExplorerMode("3d");
                window.dispatchEvent(
                  new CustomEvent("forma-region", { detail: r }),
                );
              }}
            />
          )}
          {tab === "games" && (
            <StudyGames
              key={gameCollection}
              initialCollection={gameCollection}
              collections={readCollections(collections)}
            />
          )}
          {tab === "tissues" && (
            <Tissues
              onQuiz={(id) => openQuiz({ system: "", tissue: id })}
              onSource={() => setModal("epithelial-plate")}
            />
          )}
          {tab === "quizzes" && (
            <Quizzes
              key={quizKey}
              initialScope={quizScope}
              cards={cards}
              missed={missed}
              setMissed={setMissed}
              onSave={(r) => setResults([r, ...results])}
              saved={saved}
              setSaved={setSaved}
            />
          )}
          {tab === "course" && (
            <Suspense
              fallback={<p className="muted">Opening your course workspace…</p>}
            >
              <Course
                cards={cards}
                setCards={setCards}
                onQuiz={() =>
                  openQuiz({ system: "", course: true, format: "typed" })
                }
              />
            </Suspense>
          )}
          {tab === "progress" && (
            <Progress
              results={results}
              bookmarks={bookmarks}
              cards={cards}
              missed={missed}
              saved={saved}
              onSelect={select}
              onQuiz={openQuiz}
            />
          )}
          <footer className="app-footer">
            <span>Made for the way you learn.</span>
            <button onClick={() => setModal("sources")}>
              Sources, credits & coverage <ArrowUpRight size={12} />
            </button>
          </footer>
        </main>
      </div>
      {bridge && <TissueBridge {...bridge} onClose={() => setBridge(null)} />}
      {tour && (
        <Tutorial
          navigate={(t) => {
            if (t === "explorer") setExplorerMode("3d");
            setTab(t as Tab);
          }}
          onClose={() => setTour(false)}
        />
      )}
      {!tourSeen && !tour && (
        <aside className="tour-invite">
          <span>New to Forma?</span>
          <button
            onClick={() => {
              setTour(true);
              setTourSeen(true);
            }}
          >
            Take a quick tour
          </button>
          <button
            aria-label="Dismiss tutorial invitation"
            onClick={() => setTourSeen(true)}
          >
            ×
          </button>
        </aside>
      )}
      {toast && (
        <div className="toast" role="status">
          <CheckCircle2 size={17} />
          {toast}
          <button onClick={() => setToast("")} aria-label="Dismiss message">
            <X size={15} />
          </button>
        </div>
      )}
      {showAppearance && (
        <AppearanceSettings
          value={appearance}
          onChange={setAppearance}
          onClose={() => setShowAppearance(false)}
        />
      )}
      {modal && (
        <div className="modal-backdrop" onClick={() => setModal("")}>
          <section
            className={`modal ${modal.includes("plate") ? "plate-modal" : ""}`}
            role="dialog"
            aria-modal="true"
            aria-label="Anatomy reference information"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close icon-button"
              aria-label="Close reference"
              onClick={() => setModal("")}
            >
              <X size={21} />
            </button>
            {modal.includes("plate") ? (
              <>
                <span className="eyebrow">
                  OPENSTAX · ANATOMY AND PHYSIOLOGY 2e
                </span>
                <h2>
                  {modal === "bone-plate"
                    ? "Axial and appendicular skeleton"
                    : modal === "epithelial-plate"
                      ? "Cells of epithelial tissue"
                      : "Overview of the muscular system"}
                </h2>
                <p className="small muted">
                  Original labeled reference plate. Source labels are embedded
                  in this image.
                </p>
                <img
                  src={
                    anatomyImages[
                      modal === "bone-plate"
                        ? "701_Axial_Skeleton-01.jpg"
                        : modal === "epithelial-plate"
                          ? "403_Epithelial_Tissue.jpg"
                          : "1105_Anterior_and_Posterior_Views_of_Muscles.jpg"
                    ]
                  }
                  alt="Original labeled OpenStax anatomy reference plate"
                />
                <p className="small">
                  © OpenStax / Rice University. CC BY-NC-SA 4.0.
                </p>
              </>
            ) : modal === "basics" ? (
              <>
                <span className="eyebrow">START WITH A SHARED LANGUAGE</span>
                <h2>Anatomy essentials</h2>
                <p>
                  Use anatomical position: standing upright, facing forward,
                  arms at the sides with palms facing forward. Right and left
                  refer to the subject’s body.
                </p>
                <div className="basics-grid">
                  {directions.map(([term, meaning]) => (
                    <div key={term}>
                      <h4>{term}</h4>
                      <p>{meaning}</p>
                    </div>
                  ))}
                </div>
                <p className="small muted">
                  OpenStax Anatomy and Physiology 2e, sections 1.6 and 9.5.
                </p>
              </>
            ) : (
              <>
                <span className="eyebrow">BUILT ON OPEN EDUCATION</span>
                <h2>
                  {modal === "coverage"
                    ? "An honest view of the atlas."
                    : "Sources, credits & coverage"}
                </h2>
                <p>
                  Forma is an introductory study collection with{" "}
                  {structures.length} structure entries, {tissues.length} tissue
                  entries, and overviews for all 11 organ systems. It is not a
                  complete anatomical atlas.
                </p>
                <h3>Anatomy illustrations & content</h3>
                <p>
                  <a
                    href="https://openstax.org/details/books/anatomy-and-physiology-2e"
                    target="_blank"
                    rel="noreferrer"
                  >
                    OpenStax, Anatomy and Physiology 2e
                  </a>
                  , Rice University. Muscle plate: section 11.2, figure
                  “Overview of the Muscular System”; skeleton: section 7.1,
                  “Axial and Appendicular Skeleton”; epithelial reference:
                  section 4.2, “Cells of Epithelial Tissue.”
                </p>
                <p>
                  Assets were obtained from the{" "}
                  <a
                    href="https://github.com/openstax/osbooks-anatomy-physiology/tree/5ae32b3f4bc24ed003e91dc38bf47dba80751044"
                    target="_blank"
                    rel="noreferrer"
                  >
                    official OpenStax source repository
                  </a>{" "}
                  at the recorded revision. Its license is{" "}
                  <a
                    href="https://creativecommons.org/licenses/by-nc-sa/4.0/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    CC BY-NC-SA 4.0
                  </a>
                  . Educational content and adapted plates in this app use that
                  same license; noncommercial and share-alike conditions apply.
                </p>
                <LicenseSummary />
                <h3>3D model sources</h3>
                <p>
                  Z-Anatomy — The libre 3D atlas of anatomy — CC BY-SA 4.0.
                  Authors include Gauthier Kervyn, Marcin Zielinski, and Kousaku
                  Okubo. Based on BodyParts3D — The Database Center for Life
                  Science — CC BY-SA 2.1 Japan. Geometry and source annotation
                  endpoints come from the
                  <a
                    href="https://github.com/Z-Anatomy/Models-of-human-anatomy"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {" "}
                    Z-Anatomy source repository
                  </a>
                  , revision 0189e82e4dc5c6a4ebc1d2558b78580665e9b0ef. Source
                  normals, shared coordinates, and bone/joint surfaces are
                  preserved; large neural and vascular meshes are optimized.
                  Colors are illustrative.
                </p>
                <p>
                  Upstream credits also include University of Washington
                  (Brainder/white matter), University of Dundee CAHID (cranial
                  nerves/foramina, CC BY 4.0), Dundee School of Medicine (inner
                  ear, CC BY-NC-SA 4.0), and Lissie Cowley (kidney, CC BY-NC
                  4.0). These asset-specific conditions remain in the included
                  source license; they are not replaced by the atlas-wide
                  license. Source definitions and application code were not
                  imported.
                </p>
                <h3>2D reference plates</h3>
                <p>
                  Front and back muscle and skeleton plates, selected regional
                  hotspots, zoom, labels on the muscle plate, regional masking,
                  undo, and a separate-plate comparison. The source muscle plate
                  intentionally shows superficial and deeper muscles on opposite
                  sides. Bone labels are embedded in the source artwork.
                </p>
                <p>
                  The 3D workspace includes {modelParts.length.toLocaleString()}{" "}
                  source-derived parts, including material surface regions and
                  attachment illustrations. It provides registered bone, muscle,
                  joint, and organ geometry, not photorealistic fiber textures.
                  Selection highlights in place; Focus smoothly moves the
                  camera, and Isolate hides context. Source landmarks are
                  reviewed for a subset of bones. Visual quizzes use only
                  explicitly curated entries. Many catalog parts have
                  identification or general-role notes rather than complete
                  reviewed attachments, innervation, and landmarks.
                </p>
                <h3>Tissues & quizzes</h3>
                <p>
                  Tissue illustrations are original simplified educational
                  schematics based on OpenStax chapter 4; they are not
                  photomicrographs, are not to scale, and do not replace slide
                  practice. Compact-bone features are described in section 6.3.
                  Diagrams and quiz content can be expanded independently of the
                  interface.
                </p>
                <p>
                  Quizzes use the app’s structured facts or your explicitly
                  reviewed course cards. Typed grading accepts recorded synonyms
                  and small spelling errors while rejecting other known
                  structure names.
                </p>
                <h3>Your data</h3>
                <p>
                  Progress and text are stored in this browser’s local storage;
                  original uploads use IndexedDB. No account, cloud
                  synchronization, analytics, or AI service is connected.
                  Clearing browser data removes your study history and uploads.
                  Scanned pages and image uploads require manual transcription
                  and review.
                </p>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
function Tissues({
  onQuiz,
  onSource,
}: {
  onQuiz: (id: string) => void;
  onSource: () => void;
}) {
  const [microscopy, setMicroscopy] = useState(true);
  const [cl, setCl] = useState("Epithelial");
  const [selected, setSelected] = useState("simple-squamous");
  const [compare, setCompare] = useState("");
  const [labels, setLabels] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [search, setSearch] = useState("");
  const tissue = tissues.find((t) => t.id === selected)!;
  const second = tissues.find((t) => t.id === compare);
  function choose(t: Tissue) {
    setSelected(t.id);
    setCl(t.class);
    setZoom(1);
  }
  const detail = (t: Tissue) => (
    <div className="tissue-detail-body">
      <div className="tissue-title">
        <span className="eyebrow">{t.class} TISSUE</span>
        <h2>{t.name}</h2>
      </div>
      <div
        className="tissue-image"
        style={{ overflow: zoom > 1 ? "auto" : "hidden" }}
      >
        <div style={{ width: `${zoom * 100}%` }}>
          {microscopy ? (
            <HistologyFigure tissue={t} />
          ) : (
            <TissueDiagram tissue={t} labels={labels} />
          )}
        </div>
      </div>
      <div className="tissue-image-caption">
        <button onClick={() => setMicroscopy((v) => !v)}>
          {microscopy ? "Return to illustration" : "Open microscopy reference"}
        </button>
        <span>
          {microscopy
            ? "Microscopy plate · original source labels"
            : "Educational illustration · not to scale"}
        </span>
        <span>{t.features.length} key features</span>
      </div>
      <div className="tissue-facts">
        <div>
          <h4>WHERE YOU’LL FIND IT</h4>
          <p>{t.location}</p>
        </div>
        <div>
          <h4>WHAT IT DOES</h4>
          <p>{t.function}</p>
        </div>
        <div>
          <h4>HOW TO RECOGNIZE IT</h4>
          <p>{t.clues}</p>
        </div>
        <div className="compare-tip">
          <h4>DON’T CONFUSE IT WITH…</h4>
          <p>{t.compare}</p>
        </div>
      </div>
      <div className="feature-tags">
        {t.features.map((f) => (
          <span key={f}>{f}</span>
        ))}
      </div>
      <button className="text-button" onClick={() => onQuiz(t.id)}>
        Practice this tissue <ArrowRight size={14} />
      </button>
    </div>
  );
  return (
    <div className="tissues-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">A WORLD WITHIN EVERY STRUCTURE</span>
          <h1>Tissue & microscopy atlas</h1>
          <p>
            Choose a tissue, compare its real reference plate with a labeled
            diagram, and connect microscopic features to body function.
          </p>
        </div>
        <button className="secondary" onClick={() => onQuiz(cl)}>
          <GraduationCap size={16} />
          Quiz this tissue class
        </button>
      </div>
      <div className="tissue-class-tabs">
        {["Epithelial", "Connective", "Muscle", "Nervous"].map((c) => (
          <button
            key={c}
            className={cl === c ? "active" : ""}
            onClick={() => {
              setCl(c);
              setSelected(tissues.find((t) => t.class === c)!.id);
              setCompare("");
            }}
          >
            {c}
            <span>{tissues.filter((t) => t.class === c).length}</span>
          </button>
        ))}
      </div>
      <div className={`tissue-workspace ${second ? "comparison" : ""}`}>
        <aside className="panel tissue-list">
          <div className="tissue-search">
            <Search size={15} />
            <input
              aria-label="Search tissues"
              placeholder="Find a tissue…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {tissues
            .filter((t) =>
              search
                ? t.name.toLowerCase().includes(search.toLowerCase())
                : t.class === cl,
            )
            .map((t) => (
              <button
                key={t.id}
                className={t.id === selected ? "active" : ""}
                onClick={() => choose(t)}
              >
                <span className="tissue-thumb" aria-hidden="true">
                  <TissueDiagram tissue={t} labels={false} />
                </span>
                <span>{t.name}</span>
                <ChevronRight size={14} />
              </button>
            ))}
          <p className="small muted">
            Clearly labeled schematics.
            <br />
            Built for learning visual features.
          </p>
        </aside>
        <section className="panel tissue-panel">
          <div className="tissue-toolbar">
            <button
              className={`toolbar-button ${labels ? "active" : ""}`}
              onClick={() => setLabels(!labels)}
              disabled={microscopy}
              title={
                microscopy
                  ? "Published photo labels are embedded; switch to the illustration for toggleable labels"
                  : "Toggle diagram labels"
              }
              aria-pressed={!microscopy && labels}
            >
              <span className="label-icon">Aa</span>Labels
            </button>
            <button
              className="icon-button"
              aria-label="Zoom tissue illustration out"
              disabled={zoom <= 1}
              onClick={() => setZoom((z) => Math.max(1, z - 0.25))}
            >
              <Minus size={16} />
            </button>
            <span>{Math.round(zoom * 100)}%</span>
            <button
              className="icon-button"
              aria-label="Zoom tissue illustration in"
              disabled={zoom >= 2}
              onClick={() => setZoom((z) => Math.min(2, z + 0.25))}
            >
              <ZoomIn size={16} />
            </button>
            <div className="segmented tissue-view-mode">
              <button
                aria-pressed={microscopy}
                onClick={() => setMicroscopy(true)}
              >
                Microscopy
              </button>
              <button
                aria-pressed={!microscopy}
                onClick={() => setMicroscopy(false)}
              >
                Diagram
              </button>
            </div>
            <label className="compare-select">
              <Layers size={14} />
              <select
                aria-label="Compare tissue"
                value={compare}
                onChange={(e) => setCompare(e.target.value)}
              >
                <option value="">Compare tissues</option>
                {tissues
                  .filter((t) => t.id !== selected)
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
              </select>
            </label>
          </div>
          <div className={`tissue-details ${second ? "side-by-side" : ""}`}>
            {detail(tissue)}
            {second && detail(second)}
          </div>
          <div className="tissue-source">
            OpenStax Anatomy and Physiology 2e · chapter 4
            {tissue.class === "Epithelial" && (
              <button onClick={onSource}>
                Open source plate <ArrowUpRight size={12} />
              </button>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
function Progress({
  results,
  bookmarks,
  cards,
  missed,
  saved,
  onSelect,
  onQuiz,
}: {
  results: Result[];
  bookmarks: string[];
  cards: CourseCard[];
  missed: string[];
  saved: string[];
  onSelect: (id: string) => void;
  onQuiz: (scope: Partial<QuizScope>) => void;
}) {
  const total = results.reduce((n, r) => n + r.questions.length, 0);
  const correct = results.reduce(
    (n, r) =>
      n + r.questions.filter((q) => isCorrect(r.answers[q.id] || "", q)).length,
    0,
  );
  const topics = new Map<string, { total: number; correct: number }>();
  results.forEach((r) =>
    r.questions.forEach((q) => {
      const t = topics.get(q.topic) || { total: 0, correct: 0 };
      t.total++;
      if (isCorrect(r.answers[q.id] || "", q)) t.correct++;
      topics.set(q.topic, t);
    }),
  );
  const savedQs = [
    ...new Map(
      [
        ...createQuestions({
          ...defaultScope,
          system: "",
          difficulty: "Detailed",
          count: 1000,
        }),
        ...createQuestions(
          { ...defaultScope, course: true, count: 1000 },
          cards,
        ),
        ...results.flatMap((r) => r.questions),
      ]
        .filter((q) => saved.includes(q.id))
        .map((q) => [q.id, q]),
    ).values(),
  ];
  return (
    <div className="progress-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">PROGRESS IS A PRACTICE</span>
          <h1>See how far you’re coming.</h1>
          <p>Your effort, your understanding, one session at a time.</p>
        </div>
        <button
          className="primary"
          onClick={() =>
            onQuiz({ system: "", missedOnly: true, difficulty: "Detailed" })
          }
          disabled={!missed.length}
        >
          Review {missed.length} missed items <ArrowRight size={16} />
        </button>
      </div>
      <div className="stat-grid">
        {[
          {
            icon: GraduationCap,
            n: results.length,
            label: "Sessions completed",
          },
          {
            icon: Target,
            n: `${total ? Math.round((correct / total) * 100) : 0}%`,
            label: "Overall answer accuracy",
          },
          { icon: CheckCircle2, n: total, label: "Questions practiced" },
          {
            icon: Bookmark,
            n: bookmarks.length,
            label: "Bookmarked structures",
          },
        ].map((x) => (
          <div className="panel stat-card" key={x.label}>
            <x.icon size={20} />
            <strong>{x.n}</strong>
            <span>{x.label}</span>
          </div>
        ))}
      </div>
      <div className="progress-grid">
        <section className="panel topic-progress">
          <h2>Know your strengths.</h2>
          <p className="muted">Accuracy based on your submitted answers.</p>
          {!topics.size ? (
            <div className="empty-state">
              <ChartNoAxesCombined size={38} />
              <h3>Your story starts with one session.</h3>
              <p>
                Complete a quiz to discover your strengths and the topics worth
                another look.
              </p>
              <button className="primary" onClick={() => onQuiz({})}>
                Take your first quiz <ArrowRight size={16} />
              </button>
            </div>
          ) : (
            [...topics]
              .sort(
                (a, b) => a[1].correct / a[1].total - b[1].correct / b[1].total,
              )
              .map(([key, t]) => (
                <div className="topic-row" key={key}>
                  <div>
                    <strong>
                      {systems.find((s) => s.id === key)?.name || key}
                    </strong>
                    <span>
                      {Math.round((t.correct / t.total) * 100)}% · {t.total}{" "}
                      questions
                    </span>
                  </div>
                  <div className="topic-bar">
                    <span
                      style={{ width: `${(t.correct / t.total) * 100}%` }}
                    />
                  </div>
                  {t.correct / t.total < 0.8 && (
                    <button
                      className="text-button"
                      onClick={() =>
                        onQuiz(
                          systems.some((s) => s.id === key)
                            ? { system: key }
                            : { system: "", tissue: key },
                        )
                      }
                    >
                      Suggested review <ArrowRight size={12} />
                    </button>
                  )}
                </div>
              ))
          )}
        </section>
        <section className="panel saved-structures">
          <h2>Keep these close.</h2>
          <p className="muted">Your bookmarked structures.</p>
          {bookmarks.length ? (
            bookmarks.map((id) => {
              const s = resolveStructure(id);
              return (
                s && (
                  <button key={id} onClick={() => onSelect(id)}>
                    <Bookmark size={16} />
                    <span>
                      {s.name}
                      <small>{s.region}</small>
                    </span>
                    <ArrowUpRight size={15} />
                  </button>
                )
              );
            })
          ) : (
            <p className="empty-note">
              Tap the bookmark on a structure to save it here.
            </p>
          )}
        </section>
      </div>
      <section className="panel recent-results">
        <h2>Your recent sessions</h2>
        {results.length ? (
          <div className="results-table">
            {results.slice(0, 15).map((r) => (
              <details key={r.id}>
                <summary>
                  <span className="result-score">{r.score}%</span>
                  <div>
                    <strong>
                      {[
                        ...new Set(
                          r.questions.map(
                            (q) =>
                              systems.find((s) => s.id === q.topic)?.name ||
                              q.topic,
                          ),
                        ),
                      ].join(", ")}
                    </strong>
                    <small>
                      {new Date(r.date).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}{" "}
                      · {r.mode} · {r.questions.length} questions
                    </small>
                  </div>
                  <ChevronDown size={16} />
                </summary>
                <div className="history-review">
                  {r.questions.map((q) => (
                    <div key={q.id}>
                      <strong
                        className={
                          isCorrect(r.answers[q.id] || "", q)
                            ? "correct-text"
                            : "incorrect-text"
                        }
                      >
                        {isCorrect(r.answers[q.id] || "", q) ? "✓" : "×"}{" "}
                        {q.prompt}
                      </strong>
                      <p>
                        Your answer: {r.answers[q.id] || "Unanswered"} ·
                        Correct: {q.answer}
                      </p>
                      <p>{q.explanation}</p>
                      <small>{q.source}</small>
                    </div>
                  ))}
                </div>
              </details>
            ))}
          </div>
        ) : (
          <p className="empty-note">
            Your completed quizzes will be saved here.
          </p>
        )}
      </section>
      {savedQs.length > 0 && (
        <section className="panel saved-review">
          <h2>Saved for a second look</h2>
          {savedQs.map((q) => (
            <details key={q.id}>
              <summary>
                {q.prompt}
                <ChevronDown size={15} />
              </summary>
              <p>
                <strong>{q.answer}</strong> · {q.explanation}
              </p>
              <small>{q.source}</small>
            </details>
          ))}
        </section>
      )}
    </div>
  );
}

function readCollections(fallback: StudyCollection[]) {
  try {
    const value = JSON.parse(
      localStorage.getItem("forma-collections-v1") || "null",
    );
    return Array.isArray(value) ? value : fallback;
  } catch {
    return fallback;
  }
}
