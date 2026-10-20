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
import {
  componentName,
  displayGroup,
  displayGroupKey,
  displayName,
  isSurfaceMuscle,
  muscleColor,
  muscleFamily,
} from "./modelDisplay";
import type { Appearance } from "./Appearance";
export type CameraView = "front" | "back" | "left" | "right";
type SceneProps = {
  selected: string | null;
  selectedParts: string[];
  highlightedSystems: string[];
  depth: "surface" | "all";
  distinct: boolean;
  surfaceGuide: boolean;
  onHover: (name: string | null) => void;
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
    renderer.toneMappingExposure = 1;
    renderer.localClippingEnabled = true;
    target.appendChild(renderer.domElement);
    renderer.domElement.setAttribute(
      "aria-label",
      "Interactive 3D human anatomy. Drag to rotate, scroll to zoom, click to highlight and enlarge; click again to clear.",
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
    scene.add(new THREE.HemisphereLight(0xfff5ec, 0x626b78, 2.0));
    const key = new THREE.DirectionalLight(0xfff6ec, 2.4);
    key.position.set(-3, 4, 5);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xd7e5ff, 1.3);
    rim.position.set(3, 1, -4);
    scene.add(rim);
    const fill = new THREE.DirectionalLight(0xffffff, 0.7);
    fill.position.set(3, -2, 4);
    scene.add(fill);
    const root = new THREE.Group();
    scene.add(root);
    type Record3D = {
      mesh: THREE.Mesh;
      pivot: THREE.Group;
      model: ModelPart;
      material: THREE.MeshStandardMaterial;
      baseColor: THREE.Color;
      from: THREE.Vector3;
      to: THREE.Vector3;
      fromScale: number;
      toScale: number;
      start: number;
    };
    const records = new Map<string, Record3D>();
    const modelsById = new Map(modelParts.map((m) => [m.id, m]));
    const bodyBox = new THREE.Box3();
    modelParts
      .filter((m) => m.id !== "FMA7163")
      .forEach((m) => {
        bodyBox.expandByPoint(new THREE.Vector3(...m.bounds[0]));
        bodyBox.expandByPoint(new THREE.Vector3(...m.bounds[1]));
      });
    const bodyCenter = bodyBox.getCenter(new THREE.Vector3());
    // Keep the complete source face: clip the guide below the lowest jaw point.
    const headCut =
      (modelParts.find((m) => m.name === "Mandible")?.bounds[0][1] ?? 1.435) -
      0.015;
    root.position.copy(bodyCenter).negate();
    let headGuide: THREE.Mesh | null = null;
    let headMaterial: THREE.MeshStandardMaterial | null = null;
    let lastSignature = "",
      lastColors = "",
      lastMotion = "";
    let needsRender = true,
      focusBlend = 0,
      blendFrom = 0,
      blendStart = 0;
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const duration = reducedMotion ? 0 : 1600;
    const targetFrom = new THREE.Vector3(),
      targetTo = new THREE.Vector3();
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
    let down: [number, number] = [0, 0],
      lastHover = 0;
    const hitAt = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const pointer = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1,
      );
      const ray = new THREE.Raycaster();
      ray.setFromCamera(pointer, camera);
      const hits = ray.intersectObjects(
        [...records.values()].filter((r) => r.mesh.visible).map((r) => r.mesh),
        false,
      );
      return (
        hits.find(
          (h) =>
            (records.get(h.object.userData.modelId)?.material.opacity ?? 1) >
            0.5,
        ) || hits[0]
      );
    };
    const pointerDown = (e: PointerEvent) => {
      down = [e.clientX, e.clientY];
      live.current.onHover(null);
    };
    const pointerUp = (e: PointerEvent) => {
      if (Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 6) return;
      const hit = hitAt(e);
      if (hit) live.current.onSelect(hit.object.userData.modelId);
      else live.current.onSelect("");
    };
    const pointerMove = (e: PointerEvent) => {
      if (e.buttons || performance.now() - lastHover < 90) return;
      lastHover = performance.now();
      const hit = hitAt(e);
      const m = hit && modelsById.get(hit.object.userData.modelId);
      live.current.onHover(m ? displayName(m) : null);
      renderer.domElement.style.cursor = m ? "pointer" : "grab";
    };
    const pointerLeave = () => live.current.onHover(null);
    renderer.domElement.addEventListener("pointerdown", pointerDown);
    renderer.domElement.addEventListener("pointerup", pointerUp);
    renderer.domElement.addEventListener("pointermove", pointerMove);
    renderer.domElement.addEventListener("pointerleave", pointerLeave);
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
        copy.updateMatrixWorld(true);
        const meshes: THREE.Mesh[] = [];
        copy.traverse((obj) => {
          if (obj instanceof THREE.Mesh) meshes.push(obj);
        });
        meshes.forEach((obj) => {
          if (!(obj instanceof THREE.Mesh)) return;
          const id = obj.name.replace(/_\d+$/, "");
          const model =
            modelsById.get(id) || modelsById.get(obj.parent?.name || "");
          if (!model) return;
          const material = (obj.material as THREE.MeshStandardMaterial).clone();
          material.roughness = 0.85;
          material.metalness = 0;
          obj.material = material;
          obj.userData.modelId = model.id;
          // Animate a wrapper, preserving glTF's per-mesh dequantization transform.
          const pivot = new THREE.Group();
          copy.add(pivot);
          pivot.attach(obj);
          material.forceSinglePass = true;
          records.set(model.id, {
            mesh: obj,
            pivot,
            material,
            baseColor: material.color.clone(),
            model,
            from: new THREE.Vector3(),
            to: new THREE.Vector3(),
            fromScale: 1,
            toScale: 1,
            start: 0,
          });
          if (model.id === "FMA7163") {
            headMaterial = new THREE.MeshStandardMaterial({
              color: "#c8b6a7",
              roughness: 0.93,
              metalness: 0,
              side: THREE.DoubleSide,
            });
            headMaterial.clippingPlanes = [
              new THREE.Plane(
                new THREE.Vector3(0, 1, 0),
                bodyCenter.y - headCut,
              ),
            ];
            headGuide = new THREE.Mesh(obj.geometry, headMaterial);
            headGuide.applyMatrix4(obj.matrixWorld);
            headMaterial.forceSinglePass = true;
            headGuide.name = "Natural head surface guide";
          }
        });
        root.add(copy);
        if (headGuide) root.add(headGuide);
        lastSignature = "";
        lastColors = "";
        lastMotion = "";
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
    const ease = (t: number) => {
      const x = Math.max(0, Math.min(1, t));
      return x * x * (3 - 2 * x);
    };
    const animate = (time: number) => {
      if (disposed) return;
      const p = live.current;
      const chosen = new Set(p.selectedParts);
      const signature = [
        p.selectedParts.join(","),
        p.inspect,
        p.visible.join(","),
        p.highlightedSystems.join(","),
        p.hidden.join(","),
        p.region,
        p.fade,
        p.depth,
        p.surfaceGuide,
      ].join("|");
      const motionKey = [p.inspect, p.selectedParts.join(",")].join("|");
      if (motionKey !== lastMotion) {
        lastMotion = motionKey;
        const box = new THREE.Box3();
        for (const id of chosen) {
          const m = modelsById.get(id);
          if (m) {
            box.expandByPoint(new THREE.Vector3(...m.bounds[0]));
            box.expandByPoint(new THREE.Vector3(...m.bounds[1]));
          }
        }
        const center = box.isEmpty()
          ? bodyCenter.clone()
          : box.getCenter(new THREE.Vector3());
        const scale = box.isEmpty()
          ? 1
          : Math.min(
              25,
              1.05 / Math.max(...box.getSize(new THREE.Vector3()).toArray()),
            );
        for (const [id, r] of records) {
          const lifting = p.inspect && chosen.has(id);
          r.from.copy(r.pivot.position);
          r.fromScale = r.pivot.scale.x;
          r.toScale = lifting ? scale : 1;
          r.to.set(0, 0, 0);
          if (lifting)
            r.to
              .copy(center)
              .multiplyScalar(1 - scale)
              .add(
                bodyCenter
                  .clone()
                  .add(new THREE.Vector3(0, 0.08, 0.55))
                  .sub(center),
              );
          r.start =
            time + (lifting && r.fromScale === 1 && !reducedMotion ? 320 : 0);
        }
        targetFrom.copy(controls.target);
        targetTo.set(0, p.inspect ? 0.08 : 0, p.inspect ? 0.55 : 0);
        blendFrom = focusBlend;
        blendStart = time + (p.inspect && !reducedMotion ? 320 : 0);
        needsRender = true;
      }
      const blendProgress = duration ? ease((time - blendStart) / duration) : 1;
      const previousBlend = focusBlend;
      focusBlend = THREE.MathUtils.lerp(
        blendFrom,
        p.inspect ? 1 : 0,
        blendProgress,
      );
      let moving = blendProgress < 1;
      if (moving || previousBlend !== focusBlend)
        controls.target.lerpVectors(targetFrom, targetTo, blendProgress);
      if (
        signature !== lastSignature ||
        moving ||
        previousBlend !== focusBlend
      ) {
        lastSignature = signature;
        needsRender = true;
        const selectedHead = p.selectedParts.some(
          (id) => (modelsById.get(id)?.bounds[0][1] ?? 0) > headCut,
        );
        const guideVisible =
          p.surfaceGuide &&
          p.depth === "surface" &&
          p.visible.includes("muscular") &&
          !p.visible.includes("integumentary") &&
          !p.highlightedSystems.includes("skeletal") &&
          !selectedHead &&
          (!p.region || p.region === "Head & neck");
        for (const [id, r] of records) {
          const selected = chosen.has(id);
          const normal =
            !p.hidden.includes(id) &&
            p.visible.includes(r.model.system) &&
            (!p.region || getRegion(r.model) === p.region) &&
            (p.depth === "all" || isSurfaceMuscle(r.model));
          const returning =
            r.mesh.visible &&
            (r.fromScale !== 1 || r.from.lengthSq() > 0) &&
            time < r.start + duration;
          const coveredHead =
            guideVisible &&
            r.model.system === "skeletal" &&
            r.model.bounds[1][1] > headCut;
          r.mesh.visible = (normal && !coveredHead) || selected || returning;
          // Darken the intact body instead of piling up translucent back faces.
          r.material.color
            .copy(r.baseColor)
            .multiplyScalar(selected ? 1 : 1 - focusBlend * 0.78);
          let opacity = chosen.size && !selected && !p.inspect ? 0.22 : 1;
          if (
            p.highlightedSystems.length &&
            !p.highlightedSystems.includes(r.model.system) &&
            !selected
          )
            opacity *= 0.22;
          if (p.fade && r.model.system === "muscular" && !selected)
            opacity *= 0.12;
          r.material.transparent = opacity < 0.99;
          r.material.opacity = opacity;
          r.material.depthWrite = opacity >= 0.99;
          r.mesh.renderOrder = selected ? 2 : 0;
          r.material.emissive.set(
            selected || p.highlightedSystems.includes(r.model.system)
              ? p.appearance.accent
              : "#000000",
          );
          r.material.emissiveIntensity = selected
            ? 0.14
            : p.highlightedSystems.includes(r.model.system)
              ? 0.08
              : 0;
        }
        if (headGuide && headMaterial) {
          headGuide.visible = guideVisible;
          headMaterial.color
            .set("#c8b6a7")
            .multiplyScalar(1 - focusBlend * 0.78);
        }
        target.dataset.inspecting = String(p.inspect);
        target.dataset.focusedModel = p.selected || "";
        target.dataset.highlightedParts = String(chosen.size);
        target.dataset.highlightedSystems = p.highlightedSystems.join(",");
        target.dataset.visibleMeshes = String(
          [...records.values()].filter((r) => r.mesh.visible).length,
        );
        target.dataset.depth = p.depth;
      }
      const colors = [
        p.appearance.bone,
        p.appearance.muscle,
        p.appearance.accent,
        p.distinct,
      ].join("|");
      if (colors !== lastColors) {
        lastColors = colors;
        needsRender = true;
        for (const [id, r] of records) {
          if (chosen.has(id) || p.highlightedSystems.includes(r.model.system))
            r.material.emissive.set(p.appearance.accent);
          if (r.model.system === "skeletal") r.baseColor.set(p.appearance.bone);
          if (r.model.system === "muscular")
            r.baseColor.copy(
              muscleColor(r.model, p.appearance.muscle, p.distinct),
            );
          if (r.model.system === "cardiovascular")
            r.baseColor.set(
              /vein|vena/.test(r.model.name.toLowerCase())
                ? "#597cc1"
                : "#be485a",
            );
          r.material.color
            .copy(r.baseColor)
            .multiplyScalar(chosen.has(id) ? 1 : 1 - focusBlend * 0.78);
        }
      }
      let maxProgress = 1;
      for (const r of records.values()) {
        const progress = duration ? ease((time - r.start) / duration) : 1;
        if (
          r.pivot.position.distanceToSquared(r.to) > 1e-10 ||
          Math.abs(r.pivot.scale.x - r.toScale) > 1e-6
        ) {
          r.pivot.position.lerpVectors(r.from, r.to, progress);
          r.pivot.scale.setScalar(
            THREE.MathUtils.lerp(r.fromScale, r.toScale, progress),
          );
          moving = true;
        }
        if (chosen.has(r.model.id))
          maxProgress = Math.min(maxProgress, progress);
      }
      target.dataset.motionProgress = maxProgress.toFixed(3);
      target.dataset.focusScale = (
        records.get(p.selected || "")?.pivot.scale.x ?? 1
      ).toFixed(3);
      target.dataset.animating = String(moving);
      target.dataset.liftedParts = String(
        [...records.values()].filter(
          (r) =>
            Math.abs(r.pivot.scale.x - 1) > 0.001 ||
            r.pivot.position.lengthSq() > 1e-6,
        ).length,
      );
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
      renderer.domElement.removeEventListener("pointermove", pointerMove);
      renderer.domElement.removeEventListener("pointerleave", pointerLeave);
      for (const r of records.values()) r.material.dispose();
      headMaterial?.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);
  return <div className="three-canvas" ref={host} />;
}
export function Explorer3D({
  visible,
  highlightedSystems,
  onClearHighlights,
  region,
  request,
  appearance,
  onSelect,
  onBookmark,
  bookmarks,
  onQuiz,
}: {
  visible: string[];
  highlightedSystems: string[];
  onClearHighlights: () => void;
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
  const [scope, setScope] = useState<"group" | "part">("group");
  const [hidden, setHidden] = useState<string[]>([]);
  const [history, setHistory] = useState<string[][]>([]);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [browse, setBrowse] = useState(false);
  const [fade, setFade] = useState(false);
  const [depth, setDepth] = useState<"surface" | "all">("surface");
  const [distinct, setDistinct] = useState(true);
  const [surfaceGuide, setSurfaceGuide] = useState(true);
  const [lift, setLift] = useState(true);
  const [hover, setHover] = useState<string | null>(null);
  const [infoTab, setInfoTab] = useState("Overview");
  const [view, setView] = useState<CameraView>("front");
  const api = useRef<SceneApi | null>(null);
  const model = modelParts.find((m) => m.id === selected);
  const group = model ? displayGroup(model) : [];
  const selectedParts = model
    ? scope === "group"
      ? group.map((m) => m.id)
      : [model.id]
    : [];
  const study = model ? getModelStudy(model) : null;
  const title = model
    ? scope === "group"
      ? displayName(model)
      : model.name
    : "";
  function clear() {
    setInspect(false);
    setSelected(null);
    setHover(null);
  }
  function pick(id: string) {
    const next = modelParts.find((m) => m.id === id);
    if (
      !next ||
      (model &&
        (next.id === selected ||
          (displayGroupKey(next) === displayGroupKey(model) &&
            scope === "group")))
    ) {
      clear();
      return;
    }
    setSelected(id);
    setScope("group");
    setInspect(lift);
    setInfoTab("Overview");
    setHover(null);
    setHidden((h) =>
      h.filter((part) => !displayGroup(next).some((m) => m.id === part)),
    );
    onSelect("model:" + id);
  }
  useEffect(() => {
    if (request.version === 0) return;
    const target = request.id.startsWith("model:")
      ? modelParts.find((m) => m.id === request.id.slice(6))
      : modelParts.find((m) => modelMatchesStudy(m, request.id));
    if (target) {
      setSelected(target.id);
      setScope("group");
      setInspect(lift);
      setInfoTab("Overview");
      setHidden((h) =>
        h.filter((part) => !displayGroup(target).some((m) => m.id === part)),
      );
    }
  }, [request.version]);
  useEffect(() => {
    if (model && !visible.includes(model.system)) clear();
  }, [visible.join(",")]);
  function cameraView(v: CameraView) {
    setView(v);
    api.current?.view(v);
  }
  function back() {
    setInspect(false);
  }
  function hide() {
    if (!selected) return;
    setHistory([...history, hidden]);
    setHidden([...new Set([...hidden, ...selectedParts])]);
    clear();
  }
  const matches = modelParts.filter(
    (m) =>
      (search
        ? `${m.name} ${m.system}`.toLowerCase().includes(search.toLowerCase())
        : visible.includes(m.system)) &&
      (!region || getRegion(m) === region),
  );
  const filtered = matches.filter(
    (m, i) =>
      matches.findIndex(
        (other) => displayGroupKey(other) === displayGroupKey(m),
      ) === i,
  );
  const sceneProps = {
    selected,
    selectedParts,
    inspect,
    visible,
    highlightedSystems,
    hidden,
    region,
    fade,
    depth,
    distinct,
    surfaceGuide,
    appearance,
    onSelect: pick,
    onHover: setHover,
    onReady: (value: SceneApi) => {
      api.current = value;
    },
    onError: setError,
    onProgress: setProgress,
  };
  const displayControls = (
    <div className="display-controls">
      <div className="control-label">
        <Layers size={14} />
        <strong>Muscle layers</strong>
      </div>
      <div className="segmented depth-switch" aria-label="Muscle layer detail">
        <button
          aria-pressed={depth === "surface"}
          className={depth === "surface" ? "active" : ""}
          onClick={() => setDepth("surface")}
        >
          Superficial
        </button>
        <button
          aria-pressed={depth === "all"}
          className={depth === "all" ? "active" : ""}
          onClick={() => setDepth("all")}
        >
          All layers
        </button>
      </div>
      <p>
        Start with the major surface muscles. Add deeper structures when you
        need them.
      </p>
      <label className="display-toggle">
        <span>Distinct muscle colors</span>
        <input
          type="checkbox"
          checked={distinct}
          onChange={(e) => setDistinct(e.target.checked)}
        />
      </label>
      <label className="display-toggle">
        <span>Lift selection slowly</span>
        <input
          type="checkbox"
          checked={lift}
          onChange={(e) => {
            setLift(e.target.checked);
            if (!e.target.checked) setInspect(false);
          }}
        />
      </label>
      <details className="display-advanced">
        <summary>
          More display options <ChevronDown size={13} />
        </summary>
        <label className="display-toggle">
          <span>Natural head surface</span>
          <input
            type="checkbox"
            checked={surfaceGuide}
            onChange={(e) => setSurfaceGuide(e.target.checked)}
          />
        </label>
        <label className="display-toggle">
          <span>See through muscles</span>
          <input
            type="checkbox"
            checked={fade}
            onChange={(e) => setFade(e.target.checked)}
          />
        </label>
      </details>
    </div>
  );
  return (
    <div className="explorer3d-grid">
      <section className="scene-card panel">
        <div className="scene-heading">
          <div>
            <span className="scene-logo">
              <Box size={18} />
            </span>
            <h2>Human anatomy</h2>
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
                : depth === "surface"
                  ? "SUPERFICIAL MUSCLE OVERVIEW"
                  : "ALL ANATOMICAL LAYERS"}
            </span>
            <strong>{model ? title : region || "Whole body"}</strong>
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
                  placeholder="Search muscles, bones, organs…"
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
                {filtered.length} matching structures
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
                      {displayName(m)}
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
              onClick={() => {
                setView("front");
                api.current?.reset();
              }}
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
          {hover && (
            <div className="model-hover-label" role="status">
              {hover}
            </div>
          )}
          {inspect && (
            <button className="back-body" onClick={back}>
              <ArrowLeft size={15} />
              Return to body
            </button>
          )}
          <div className="scene-bottom">
            <div className="scene-gesture">
              <span className="gesture-dot" />
              <span>
                {inspect
                  ? "Click again to clear · drag to rotate"
                  : "Drag to rotate · scroll to zoom · click to select"}
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
            <Layers size={14} />
            {visible.length} {visible.length === 1 ? "system" : "systems"} shown
            {highlightedSystems.length
              ? ` · ${highlightedSystems.length} highlighted`
              : ""}
          </span>
          <div>
            {(model || highlightedSystems.length > 0) && (
              <button
                onClick={() => {
                  clear();
                  onClearHighlights();
                }}
              >
                <X size={13} />
                Clear highlights
              </button>
            )}
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
            <div className="inspection-title-row">
              <h2>{title}</h2>
              <button
                className="icon-button"
                aria-label="Clear selected structure"
                onClick={clear}
              >
                <X size={17} />
              </button>
            </div>
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
                {inspect ? "Return to body" : "Lift & enlarge"}
              </button>
              <button className="secondary" onClick={hide}>
                <EyeOff size={14} />
                Hide
              </button>
            </div>
            {group.length > 1 && (
              <div className="muscle-components">
                <span>Muscle regions</span>
                <button
                  aria-pressed={scope === "group"}
                  onClick={() => setScope("group")}
                >
                  Whole muscle <small>{group.length} regions</small>
                </button>
                {group.map((part) => (
                  <button
                    key={part.id}
                    aria-pressed={scope === "part" && selected === part.id}
                    onClick={() => {
                      setSelected(part.id);
                      setScope("part");
                    }}
                  >
                    <span
                      className="part-swatch"
                      style={{
                        background:
                          "#" +
                          muscleColor(
                            part,
                            appearance.muscle,
                            distinct,
                          ).getHexString(),
                      }}
                    />
                    {componentName(part)}
                  </button>
                ))}
                {muscleFamily(model) === "pectoralis major" && (
                  <p>
                    Clavicular and sternocostal are the main heads. This model
                    also separates the inferior abdominal fibers as a third
                    region.
                  </p>
                )}
              </div>
            )}
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
                {scope === "part" &&
                  study.family.toLowerCase() !== study.name.toLowerCase() &&
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
            <details className="selection-display-options">
              <summary>
                Display settings <ChevronDown size={14} />
              </summary>
              {displayControls}
            </details>
            <div className="inspection-source">
              <Info size={13} />
              <p>{study.source}</p>
            </div>
          </>
        ) : (
          <div className="inspection-empty clean-inspector">
            <span className="eyebrow">ONE BODY · YOUR VIEW</span>
            <h2>Explore at your pace.</h2>
            <p>
              Click a muscle or bone to highlight it, then watch it lift
              forward. Click it again to clear the selection.
            </p>
            {displayControls}
            <div className="quick-structures">
              <span>Try a structure</span>
              <button
                onClick={() =>
                  pick(
                    modelParts.find(
                      (m) =>
                        m.name ===
                        "Sternocostal part of right pectoralis major",
                    )!.id,
                  )
                }
              >
                Pectoralis major <Focus size={14} />
              </button>
              <button
                onClick={() =>
                  pick(modelParts.find((m) => m.name === "Right humerus")!.id)
                }
              >
                Humerus <Focus size={14} />
              </button>
            </div>
            <p className="color-key-note">
              Colors separate neighboring muscles and regions; they are a study
              aid.
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}
