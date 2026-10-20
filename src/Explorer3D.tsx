import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import {
  ArrowLeft,
  Bookmark,
  Box,
  Check,
  ChevronDown,
  Expand,
  Eye,
  EyeOff,
  Focus,
  Info,
  Layers,
  LoaderCircle,
  Maximize,
  RotateCcw,
  Search,
  Undo2,
  X,
} from "lucide-react";
import {
  getModelStudy,
  getRegion,
  modelMatchesStudy,
  modelParts,
  type ModelPart,
} from "./modelCatalog";
import { systems } from "./content";
import type { Appearance } from "./Appearance";
export type CameraView = "front" | "back" | "left" | "right";
type SceneProps = {
  selected: string | null;
  inspect: boolean;
  visible: string[];
  hidden: string[];
  region: string;
  fade: boolean;
  appearance: Appearance;
  onSelect: (id: string) => void;
  onReady: (api: SceneApi) => void;
  onError: (message: string) => void;
  onProgress: (n: number) => void;
};
type SceneApi = {
  view: (view: CameraView) => void;
  zoom: (factor: number) => void;
  reset: () => void;
};
let assetPromise: Promise<THREE.Group> | null = null;
function loadModel(progress: (n: number) => void) {
  if (!assetPromise)
    assetPromise = (async () => {
      const response = await fetch("/models/bodyparts.glb");
      if (!response.ok)
        throw new Error(
          "The 3D model could not be loaded. Check that the complete app files are present.",
        );
      const bytes = await response.arrayBuffer();
      progress(70);
      const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
      const gltf = await loader.parseAsync(bytes, "");
      return gltf.scene;
    })();
  return assetPromise;
}
function Scene(props: SceneProps) {
  const host = useRef<HTMLDivElement>(null);
  const live = useRef(props);
  live.current = props;
  useEffect(() => {
    const target = host.current!;
    let disposed = false,
      raf = 0;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
    } catch {
      props.onError(
        "3D needs WebGL in your browser. Enable hardware acceleration or use the 2D reference view.",
      );
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    target.appendChild(renderer.domElement);
    renderer.domElement.setAttribute(
      "aria-label",
      "Interactive 3D human anatomy. Drag to rotate, scroll to zoom, click a structure to inspect.",
    );
    renderer.domElement.setAttribute("role", "img");
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, 1, 0.001, 100);
    camera.position.set(0, 0, 3.25);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.09;
    controls.minDistance = 0.7;
    controls.maxDistance = 7;
    controls.enablePan = true;
    controls.target.set(0, 0, 0);
    scene.add(new THREE.HemisphereLight(0xe8f2ff, 0x41506d, 2.3));
    const key = new THREE.DirectionalLight(0xfff3e4, 3.1);
    key.position.set(-3, 4, 5);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x94bbff, 2.4);
    rim.position.set(3, 1, -4);
    scene.add(rim);
    const fill = new THREE.DirectionalLight(0xe6ebff, 0.8);
    fill.position.set(3, -2, 4);
    scene.add(fill);
    const root = new THREE.Group();
    scene.add(root);
    const records = new Map<
      string,
      {
        mesh: THREE.Mesh;
        model: ModelPart;
        material: THREE.MeshStandardMaterial;
      }
    >();
    const modelsById = new Map(modelParts.map((m) => [m.id, m]));
    const bodyBox = new THREE.Box3();
    modelParts
      .filter((m) => m.id !== "FMA7163")
      .forEach((m) => {
        bodyBox.expandByPoint(new THREE.Vector3(...m.bounds[0]));
        bodyBox.expandByPoint(new THREE.Vector3(...m.bounds[1]));
      });
    const bodyCenter = bodyBox.getCenter(new THREE.Vector3());
    const targetPosition = bodyCenter.clone().negate();
    let targetScale = 1;
    root.position.copy(targetPosition);
    let lastSignature = "";
    let lastColor = "";
    let needsRender = true;
    controls.addEventListener("change", () => {
      needsRender = true;
    });
    const resize = new ResizeObserver(() => {
      const w = target.clientWidth,
        h = target.clientHeight;
      if (w && h) {
        needsRender = true;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      }
    });
    resize.observe(target);
    let down: [number, number] = [0, 0];
    const pointerDown = (e: PointerEvent) => {
      down = [e.clientX, e.clientY];
    };
    const pointerUp = (e: PointerEvent) => {
      if (Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 6) return;
      const rect = renderer.domElement.getBoundingClientRect();
      const pointer = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        (-(e.clientY - rect.top) / rect.height) * 2 + 1,
      );
      const ray = new THREE.Raycaster();
      ray.setFromCamera(pointer, camera);
      const hit = ray.intersectObjects(
        [...records.values()].filter((r) => r.mesh.visible).map((r) => r.mesh),
        false,
      )[0];
      if (hit) live.current.onSelect(hit.object.userData.modelId);
    };
    renderer.domElement.addEventListener("pointerdown", pointerDown);
    renderer.domElement.addEventListener("pointerup", pointerUp);
    const api: SceneApi = {
      view(v) {
        const distance = camera.position.distanceTo(controls.target);
        const directions = {
          front: new THREE.Vector3(0, 0.025, 1),
          back: new THREE.Vector3(0, 0.025, -1),
          left: new THREE.Vector3(1, 0.025, 0),
          right: new THREE.Vector3(-1, 0.025, 0),
        };
        camera.position
          .copy(controls.target)
          .add(directions[v].normalize().multiplyScalar(distance));
        controls.update();
      },
      zoom(factor) {
        const dir = camera.position
          .clone()
          .sub(controls.target)
          .multiplyScalar(factor);
        dir.clampLength(0.7, 7);
        camera.position.copy(controls.target).add(dir);
        controls.update();
      },
      reset() {
        camera.position.set(0, 0, 3.25);
        controls.target.set(0, 0, 0);
        controls.update();
      },
    };
    loadModel(live.current.onProgress)
      .then((asset) => {
        if (disposed) return;
        const copy = asset.clone(true);
        copy.traverse((obj) => {
          if (!(obj instanceof THREE.Mesh)) return;
          const id = obj.name.replace(/_\d+$/, "");
          const model =
            modelsById.get(id) || modelsById.get(obj.parent?.name || "");
          if (!model) return;
          const material = (obj.material as THREE.MeshStandardMaterial).clone();
          material.roughness = 0.55;
          material.metalness = 0.06;
          obj.material = material;
          obj.userData.modelId = model.id;
          records.set(model.id, { mesh: obj, material, model });
        });
        root.add(copy);
        lastSignature = "";
        lastColor = "";
        needsRender = true;
        target.dataset.modelCount = String(records.size);
        live.current.onProgress(100);
        live.current.onReady(api);
      })
      .catch((error) => {
        if (!disposed)
          live.current.onError(
            error instanceof Error ? error.message : "3D loading failed.",
          );
      });
    let lastTime = 0;
    const animate = (time: number) => {
      if (disposed) return;
      const p = live.current;
      const signature = [
        p.selected,
        p.inspect,
        p.visible.join(","),
        p.hidden.join(","),
        p.region,
        p.fade,
      ].join("|");
      if (signature !== lastSignature) {
        needsRender = true;
        lastSignature = signature;
        for (const [id, r] of records) {
          r.mesh.visible = p.inspect
            ? id === p.selected
            : !p.hidden.includes(id) &&
              p.visible.includes(r.model.system) &&
              (!p.region || getRegion(r.model) === p.region);
          r.material.transparent =
            !p.inspect && p.fade && r.model.system === "muscular";
          r.material.opacity = r.material.transparent ? 0.18 : 1;
          r.material.depthWrite = !r.material.transparent;
          r.material.emissive.set(
            id === p.selected ? p.appearance.accent : "#000000",
          );
          r.material.emissiveIntensity = id === p.selected ? 0.18 : 0;
        }
        const model = p.inspect ? modelsById.get(p.selected || "") : undefined;
        if (model) {
          const box = new THREE.Box3(
            new THREE.Vector3(...model.bounds[0]),
            new THREE.Vector3(...model.bounds[1]),
          );
          targetScale =
            1.25 / Math.max(...box.getSize(new THREE.Vector3()).toArray());
          targetPosition
            .copy(box.getCenter(new THREE.Vector3()))
            .multiplyScalar(-targetScale);
        } else {
          targetScale = 1;
          targetPosition.copy(bodyCenter).negate();
        }
        target.dataset.inspecting = String(p.inspect);
        target.dataset.focusedModel = p.selected || "";
        target.dataset.visibleMeshes = String(
          [...records.values()].filter((r) => r.mesh.visible).length,
        );
      }
      const colorSignature = [
        p.appearance.bone,
        p.appearance.muscle,
        p.appearance.accent,
      ].join("|");
      if (colorSignature !== lastColor) {
        needsRender = true;
        lastColor = colorSignature;
        for (const [id, r] of records) {
          if (r.model.system === "skeletal")
            r.material.color.set(p.appearance.bone);
          if (r.model.system === "muscular")
            r.material.color.set(p.appearance.muscle);
          if (r.model.system === "cardiovascular")
            r.material.color.set(
              /vein|vena/.test(r.model.name.toLowerCase())
                ? "#597cc1"
                : "#be485a",
            );
          if (id === p.selected) r.material.emissive.set(p.appearance.accent);
        }
      }
      const dt = Math.min(0.06, (time - lastTime) / 1000 || 0.016);
      lastTime = time;
      const lerp = 1 - Math.exp(-7 * dt);
      const moving =
        root.position.distanceToSquared(targetPosition) > 1e-8 ||
        Math.abs(root.scale.x - targetScale) > 1e-5;
      if (moving) {
        root.position.lerp(targetPosition, lerp);
        root.scale.lerp(
          new THREE.Vector3(targetScale, targetScale, targetScale),
          lerp,
        );
      }
      const changed = controls.update();
      if (needsRender || moving || changed) {
        renderer.render(scene, camera);
        needsRender = false;
      }
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      resize.disconnect();
      controls.dispose();
      renderer.domElement.removeEventListener("pointerdown", pointerDown);
      renderer.domElement.removeEventListener("pointerup", pointerUp);
      for (const r of records.values()) r.material.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);
  return <div className="three-canvas" ref={host} />;
}
export function Explorer3D({
  activeSystem,
  visible,
  region,
  request,
  appearance,
  onSelect,
  onBookmark,
  bookmarks,
  onQuiz,
}: {
  activeSystem: string;
  visible: string[];
  region: string;
  request: { id: string; version: number };
  appearance: Appearance;
  onSelect: (id: string) => void;
  onBookmark: (id: string) => void;
  bookmarks: string[];
  onQuiz: (id: string) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [inspect, setInspect] = useState(false);
  const [hidden, setHidden] = useState<string[]>([]);
  const [history, setHistory] = useState<string[][]>([]);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [browse, setBrowse] = useState(false);
  const [fade, setFade] = useState(false);
  const [infoTab, setInfoTab] = useState("Overview");
  const [view, setView] = useState<CameraView>("front");
  const api = useRef<SceneApi | null>(null);
  const prevSystem = useRef(activeSystem);
  const model = modelParts.find((m) => m.id === selected);
  const study = model ? getModelStudy(model) : null;
  function pick(id: string) {
    setSelected(id);
    setInspect(true);
    setInfoTab("Overview");
    onSelect("model:" + id);
  }
  useEffect(() => {
    if (request.version === 0) return;
    const target = request.id.startsWith("model:")
      ? modelParts.find((m) => m.id === request.id.slice(6))
      : modelParts.find((m) => modelMatchesStudy(m, request.id));
    if (target) {
      setSelected(target.id);
      setInspect(true);
      setInfoTab("Overview");
    }
  }, [request.version]);
  useEffect(() => {
    if (prevSystem.current !== activeSystem) {
      prevSystem.current = activeSystem;
      setInspect(false);
      setSelected(null);
      setSearch("");
      api.current?.reset();
    }
  }, [activeSystem]);
  function cameraView(v: CameraView) {
    setView(v);
    api.current?.view(v);
  }
  function back() {
    setInspect(false);
    api.current?.reset();
  }
  function hide() {
    if (!selected) return;
    setHistory([...history, hidden]);
    setHidden([...hidden, selected]);
    setInspect(false);
    setSelected(null);
  }
  const filtered = modelParts.filter(
    (m) =>
      (search
        ? `${m.name} ${m.system}`.toLowerCase().includes(search.toLowerCase())
        : m.system === activeSystem) &&
      (!region || getRegion(m) === region),
  );
  const sceneProps = {
    selected,
    inspect,
    visible,
    hidden,
    region,
    fade,
    appearance,
    onSelect: pick,
    onReady: (value: SceneApi) => {
      api.current = value;
    },
    onError: setError,
    onProgress: setProgress,
  };
  return (
    <div className="explorer3d-grid">
      <section className="scene-card panel">
        <div className="scene-heading">
          <div>
            <span className="scene-logo">
              <Box size={18} />
            </span>
            <h2>{inspect ? "Structure studio" : "Human anatomy"}</h2>
            <span className="live-3d">
              <span />
              LIVE 3D
            </span>
          </div>
          <button
            className={`secondary browse-toggle ${browse ? "active" : ""}`}
            onClick={() => setBrowse(!browse)}
          >
            <Search size={14} />
            Find a part
          </button>
        </div>
        <div
          className={`scene-stage ${appearance.studio === "adaptive" ? "adaptive-studio" : ""}`}
        >
          <Scene {...sceneProps} />
          <div className="scene-top-label">
            <span>
              {inspect
                ? study?.kind.toUpperCase()
                : "BODYParts3D · ADULT MALE REFERENCE"}
            </span>
            <strong>{inspect ? study?.name : region || "Whole body"}</strong>
          </div>
          {progress < 100 && !error && (
            <div className="scene-loading">
              <LoaderCircle size={30} />
              <strong>Preparing your 3D atlas</strong>
              <span>Loading 924 named anatomical parts…</span>
            </div>
          )}
          {error && (
            <div className="scene-error">
              <Info size={26} />
              <strong>3D viewer unavailable</strong>
              <p>{error}</p>
              <p>Use the 2D reference tab above to keep studying.</p>
            </div>
          )}
          {browse && (
            <div className="model-browser">
              <div>
                <Search size={16} />
                <input
                  autoFocus
                  placeholder="Search 924 model parts…"
                  aria-label="Search 3D model parts"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <button
                  className="icon-button"
                  aria-label="Close model browser"
                  onClick={() => setBrowse(false)}
                >
                  <X size={15} />
                </button>
              </div>
              <span>
                {filtered.length} matching parts
                {filtered.length > 60
                  ? " · showing first 60; narrow your search"
                  : ""}
              </span>
              <div>
                {filtered.slice(0, 60).map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      pick(m.id);
                      setBrowse(false);
                    }}
                  >
                    <span>
                      {m.name}
                      <small>
                        {systems.find((s) => s.id === m.system)?.name}
                      </small>
                    </span>
                    <Focus size={14} />
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="scene-side-tools">
            <button
              aria-label="Reset 3D view"
              onClick={() => api.current?.reset()}
            >
              <RotateCcw size={17} />
            </button>
            <button
              aria-label="Zoom 3D in"
              onClick={() => api.current?.zoom(0.85)}
            >
              <Expand size={17} />
            </button>
            <button
              aria-label="Undo 3D removal"
              disabled={!history.length}
              onClick={() => {
                setHidden(history.at(-1)!);
                setHistory(history.slice(0, -1));
              }}
            >
              <Undo2 size={17} />
            </button>
          </div>
          {inspect && (
            <button className="back-body" onClick={back}>
              <ArrowLeft size={15} />
              Back to body
            </button>
          )}
          <div className="scene-bottom">
            <div className="scene-gesture">
              <span className="gesture-dot" />
              <span>
                {inspect
                  ? "Drag to rotate this structure · scroll to zoom"
                  : "Drag to orbit · scroll to zoom · click to inspect"}
              </span>
            </div>
            <div className="camera-presets">
              {(["front", "back", "left", "right"] as CameraView[]).map((v) => (
                <button
                  key={v}
                  className={view === v ? "active" : ""}
                  aria-label={`3D ${v} view`}
                  onClick={() => cameraView(v)}
                >
                  {v[0].toUpperCase() + v.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="scene-footer">
          <span>
            <Layers size={15} />
            {inspect
              ? "1 isolated model part"
              : `${
                  visible
                    .map((v) => systems.find((s) => s.id === v)?.name)
                    .filter(Boolean)
                    .join(" + ") || "All systems hidden"
                }`}
          </span>
          <div>
            <button aria-pressed={fade} onClick={() => setFade(!fade)}>
              <Eye size={14} />
              {fade ? "Solid muscles" : "Transparent muscles"}
            </button>
            {hidden.length > 0 && (
              <button
                onClick={() => {
                  setHidden([]);
                  setHistory([]);
                }}
              >
                {hidden.length} hidden · restore
              </button>
            )}
            <span className="scene-source">BodyParts3D · CC BY-SA 2.1 JP</span>
          </div>
        </div>
      </section>
      <aside className="inspection-card panel">
        {study && model ? (
          <>
            <div className="inspection-kicker">
              <span className="badge">{study.kind}</span>
              <button
                className={`icon-button ${bookmarks.includes(study.id) ? "bookmarked" : ""}`}
                aria-label={
                  bookmarks.includes(study.id)
                    ? "Remove structure bookmark"
                    : "Bookmark structure"
                }
                onClick={() => onBookmark(study.id)}
              >
                <Bookmark size={19} />
              </button>
            </div>
            <h2>{study.name}</h2>
            <p className="inspection-system">
              {systems.find((s) => s.id === study.system)?.name} ·{" "}
              {study.region}
            </p>
            <div className="inspection-actions">
              <button
                className="secondary"
                onClick={() => (inspect ? back() : setInspect(true))}
              >
                <Focus size={14} />
                {inspect ? "Show context" : "Inspect alone"}
              </button>
              <button className="secondary" onClick={hide}>
                <EyeOff size={14} />
                Hide
              </button>
            </div>
            <div className="inspection-tabs">
              {[
                "Overview",
                study.kind === "Bone" ? "Landmarks" : "Attachments",
              ].map((tab) => (
                <button
                  className={infoTab === tab ? "active" : ""}
                  key={tab}
                  onClick={() => setInfoTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
            {infoTab === "Overview" ? (
              <div className="inspection-notes">
                <span className={`coverage-label ${study.detailLevel}`}>
                  {study.detailLevel === "detailed"
                    ? "Detailed study entry"
                    : study.detailLevel === "overview"
                      ? "Functional overview"
                      : "Identification + general role"}
                </span>
                {study.family.toLowerCase() !== study.name.toLowerCase() &&
                  study.detailLevel !== "identification" && (
                    <p className="parent-note">
                      Study notes describe {study.family.toLowerCase()}; this
                      mesh is the named side or component.
                    </p>
                  )}
                <h4>WHAT IT DOES</h4>
                <p>{study.function}</p>
                <h4>LOCATION & RELATIONSHIPS</h4>
                <p>{study.location}</p>
                {study.tip && (
                  <div className="inspector-tip">
                    <strong>Make the connection</strong>
                    <p>{study.tip}</p>
                  </div>
                )}
                <details>
                  <summary>
                    Identifying features <ChevronDown size={14} />
                  </summary>
                  <p>{study.features}</p>
                  <p>{study.description}</p>
                </details>
              </div>
            ) : study.kind === "Bone" ? (
              <div className="landmark-guide">
                <p>
                  Rotate the actual bone surface to find these features. View
                  buttons change orientation; they do not place unverified
                  landmark markers.
                </p>
                {study.landmarkGuide.length ? (
                  study.landmarkGuide.map((l) => (
                    <div key={l.name}>
                      <strong>{l.name}</strong>
                      <p>{l.description}</p>
                      <button
                        className="text-button"
                        onClick={() => cameraView(l.view)}
                      >
                        View from{" "}
                        {l.view === "back"
                          ? "posterior"
                          : l.view === "front"
                            ? "anterior"
                            : l.view}
                        <RotateCcw size={12} />
                      </button>
                    </div>
                  ))
                ) : (
                  <>
                    <h4>Major landmarks</h4>
                    <p>
                      {study.landmarks ||
                        "A detailed landmark guide for this model part has not yet been curated. Use rotation to examine its surface and compare it with a labeled course reference."}
                    </p>
                    {study.articulations && (
                      <>
                        <h4>Articulations</h4>
                        <p>{study.articulations}</p>
                      </>
                    )}
                  </>
                )}
              </div>
            ) : (
              <div className="attachment-guide">
                {[
                  ["Origin", study.origin],
                  ["Insertion", study.insertion],
                  ["Actions", study.actions],
                  ["Innervation", study.innervation],
                ]
                  .filter(([, value]) => value)
                  .map(([title, value]) => (
                    <div key={title}>
                      <h4>{title}</h4>
                      <p>{value}</p>
                    </div>
                  ))}
                {!study.origin && (
                  <p>
                    Attachment and innervation details have not yet been curated
                    for this part. Its verified model name remains available for
                    spatial study.
                  </p>
                )}
              </div>
            )}
            <div className="inspection-source">
              <Info size={13} />
              <p>{study.source}</p>
            </div>
          </>
        ) : (
          <div className="inspection-empty">
            <span className="empty-orbit">
              <Box size={36} />
            </span>
            <span className="eyebrow">GO FROM THE WHOLE TO THE DETAILS</span>
            <h2>
              Get closer to
              <br />
              what you’re learning.
            </h2>
            <p>
              Click a bone, muscle, or organ. It comes forward on its own, ready
              to rotate and explore.
            </p>
            <div className="inspection-steps">
              <span>
                <span>1</span>Select any visible structure
              </span>
              <span>
                <span>2</span>Rotate it in every direction
              </span>
              <span>
                <span>3</span>Connect its shape and function
              </span>
            </div>
            <button
              className="primary"
              onClick={() => {
                const sample = modelParts.find(
                  (m) => m.name === "Right humerus",
                )!;
                pick(sample.id);
              }}
            >
              Try the humerus <Focus size={15} />
            </button>
            <div className="coverage-box">
              <strong>924 selectable model parts</strong>
              <p>
                Names are supplied by BodyParts3D. Detailed functions and
                landmarks cover a growing subset; each entry shows its coverage
                level.
              </p>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
