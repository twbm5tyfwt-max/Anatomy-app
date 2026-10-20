import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { OutlinePass } from "three/addons/postprocessing/OutlinePass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { SSAOPass } from "three/addons/postprocessing/SSAOPass.js";
import { modelParts, type ModelPart, type AnatomyLayer } from "./modelCatalog";
import { muscleColor } from "./modelDisplay";
import type { Appearance } from "./Appearance";
export type CameraView =
  | "front"
  | "back"
  | "left"
  | "right"
  | "superior"
  | "inferior";
export type LandmarkPoint = {
  id: string;
  name: string;
  anchor: number[];
  modelId: string;
  contextIds?: string[];
};
export type SceneApi = {
  frame: (ids: string[], view?: CameraView, duration?: number) => void;
  view: (v: CameraView) => void;
  zoom: (factor: number) => void;
  home: () => void;
};
export type SceneProps = {
  visible: string[];
  selected: string[];
  hidden: string[];
  isolated: string[] | null;
  layers: Record<string, number>;
  highlightedSystems?: string[];
  attachments?: string[];
  appearance: Appearance;
  region?: string;
  quality?: boolean;
  distinct?: boolean;
  landmarks?: LandmarkPoint[];
  activeLandmark?: string | null;
  labels?: boolean;
  selectionMode?: "structure" | "landmark";
  onlyIds?: string[];
  initialView?: CameraView;
  frameSize?: number;
  quiz?: boolean;
  targetMarker?: string;
  opacityOverrides?: Record<string, number>;
  onSelect?: (id: string) => void;
  onLandmark?: (id: string) => void;
  onHover?: (text: string | null) => void;
  onReady?: (api: SceneApi) => void;
};
const byId = new Map(modelParts.map((m) => [m.id, m]));
let assetPromise: Promise<THREE.Group> | null = null;
export function anatomyAsset() {
  if (!assetPromise)
    assetPromise = (async () => {
      const response = await fetch("/models/anatomy.glb");
      if (!response.ok)
        throw new Error(
          "Anatomy files are unavailable. Open the complete downloaded app.",
        );
      const data = await response.arrayBuffer();
      return (
        await new GLTFLoader()
          .setMeshoptDecoder(MeshoptDecoder)
          .parseAsync(data, "")
      ).scene;
    })();
  return assetPromise;
}
const directions: Record<CameraView, THREE.Vector3> = {
  front: new THREE.Vector3(0, 0.02, 1),
  back: new THREE.Vector3(0, 0.02, -1),
  left: new THREE.Vector3(1, 0.02, 0),
  right: new THREE.Vector3(-1, 0.02, 0),
  superior: new THREE.Vector3(0, 1, 0.001),
  inferior: new THREE.Vector3(0, -1, 0.001),
};
function union(ids: string[]) {
  const box = new THREE.Box3();
  for (const id of ids) {
    const m = byId.get(id);
    if (!m) continue;
    box.expandByPoint(new THREE.Vector3(...m.bounds[0]));
    box.expandByPoint(new THREE.Vector3(...m.bounds[1]));
  }
  return box;
}
const bodyBox = union(
  modelParts
    .filter((m) => m.layer === "bones" || m.layer === "skin")
    .map((m) => m.id),
);
const bodyCenter = bodyBox.getCenter(new THREE.Vector3());
type Projected = {
  id: string;
  name: string;
  x: number;
  y: number;
  labelX: number;
  labelY: number;
  side: number;
};
export function AnatomyScene(props: SceneProps) {
  const host = useRef<HTMLDivElement>(null),
    live = useRef(props);
  live.current = props;
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const [points, setPoints] = useState<Projected[]>([]);
  useEffect(() => {
    const el = host.current!;
    let cancelled = false,
      raf = 0;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
    } catch {
      setError(
        "WebGL is unavailable. Enable hardware acceleration or use the 2D reference.",
      );
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.setClearColor(0x101820, 0);
    el.appendChild(renderer.domElement);
    renderer.domElement.setAttribute("role", "img");
    renderer.domElement.setAttribute(
      "aria-label",
      props.quiz
        ? "3D anatomy question"
        : "3D anatomical atlas. Drag to rotate; scroll or pinch to zoom. Click a structure to select.",
    );
    const scene = new THREE.Scene(),
      camera = new THREE.PerspectiveCamera(35, 1, 0.01, 15);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.minDistance = 0.015;
    controls.maxDistance = 8;
    controls.zoomSpeed = 0.8;
    controls.rotateSpeed = 0.7;
    scene.add(new THREE.HemisphereLight(0xffffff, 0x394047, 1.4));
    for (const [color, intensity, pos] of [
      [0xfff8ed, 2.7, [-2, 3, 5]],
      [0xe1eaff, 1.2, [3, 1, -3]],
      [0xffffff, 0.6, [3, -1, 4]],
    ] as const) {
      const l = new THREE.DirectionalLight(color, intensity);
      l.position.set(pos[0], pos[1], pos[2]);
      scene.add(l);
    }
    const root = new THREE.Group();
    root.position.copy(bodyCenter).negate();
    scene.add(root);
    const samples = Math.min(4, renderer.capabilities.maxSamples);
    const renderTarget = new THREE.WebGLRenderTarget(1, 1, {
      type: THREE.HalfFloatType,
      samples,
    });
    const composer = new EffectComposer(renderer, renderTarget);
    composer.addPass(new RenderPass(scene, camera));
    const ao = new SSAOPass(scene, camera, 1, 1);
    ao.kernelRadius = 0.015;
    ao.minDistance = 0.00005;
    ao.maxDistance = 0.035;
    ao.enabled = false;
    composer.addPass(ao);
    const outline = new OutlinePass(new THREE.Vector2(1, 1), scene, camera);
    outline.edgeStrength = 3;
    outline.edgeThickness = 1.1;
    outline.edgeGlow = 0;
    outline.hiddenEdgeColor.set("#000000");
    composer.addPass(outline);
    const output = new OutputPass();
    // Resolve coverage to an opaque atlas image after MSAA has mixed the samples.
    output.material.fragmentShader = output.material.fragmentShader.replace(
      /}\s*$/,
      "gl_FragColor.a = 1.0;\n}",
    );
    composer.addPass(output);
    type Record3D = {
      model: ModelPart;
      meshes: THREE.Mesh[];
      materials: THREE.MeshStandardMaterial[];
      base: THREE.Color[];
    };
    const records = new Map<string, Record3D>();
    let needsRender = true,
      lastSignature = "",
      lastColors = "",
      lastLabelSignature = "";
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    let framing = props.onlyIds?.length ? props.onlyIds : [],
      currentView = props.initialView || "front";
    let lastFrameSize = props.frameSize;
    let tween: {
      from: THREE.Vector3;
      to: THREE.Vector3;
      fromTarget: THREE.Vector3;
      toTarget: THREE.Vector3;
      start: number;
      duration: number;
    } | null = null;
    const start = (
      target: THREE.Vector3,
      distance: number,
      view: CameraView | undefined,
      duration: number,
    ) => {
      const to = target
        .clone()
        .add((view ? directions[view].clone() : camera.position.clone().sub(controls.target)).normalize().multiplyScalar(distance));
      tween = {
        from: camera.position.clone(),
        to,
        fromTarget: controls.target.clone(),
        toTarget: target,
        start: performance.now(),
        duration: reduced ? 0 : duration,
      };
      needsRender = true;
    };
    const fit = (ids: string[], view: CameraView | undefined, duration: number) => {
      const box = ids.length ? union(ids) : bodyBox.clone();
      if (box.isEmpty()) return;
      const center = box.getCenter(new THREE.Vector3()).sub(bodyCenter),
        size = box.getSize(new THREE.Vector3());
      let extent = Math.max(
        size.x / Math.max(camera.aspect, 0.3),
        size.y,
        size.z,
      );
      if (view === "superior" || view === "inferior")
        extent = Math.max(
          size.x / Math.max(camera.aspect, 0.3),
          size.z,
          size.y * 0.5,
        );
      if (view === "left" || view === "right")
        extent = Math.max(
          size.z / Math.max(camera.aspect, 0.3),
          size.y,
          size.x * 0.5,
        );
      extent = live.current.frameSize
        ? live.current.frameSize / Math.min(camera.aspect, 1)
        : Math.max(extent, 0.012);
      const distance =
        (extent * 0.65) / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) +
        (live.current.frameSize || Math.min(size.z, size.x)) * 0.4;
      framing = ids;
      if (view) currentView = view;
      start(center, Math.max(0.025, distance), view, duration);
    };
    const api: SceneApi = {
      frame(ids, v, duration = 1600) {
        fit(ids, v, duration);
      },
      view(v) {
        currentView = v;
        start(
          controls.target.clone(),
          camera.position.distanceTo(controls.target),
          v,
          700,
        );
      },
      zoom(factor) {
        const distance = THREE.MathUtils.clamp(
          camera.position.distanceTo(controls.target) * factor,
          0.015,
          8,
        );
        start(controls.target.clone(), distance, undefined, 250);
      },
      home() {
        fit([], "front", 900);
      },
    };
    const resize = new ResizeObserver(() => {
      const w = el.clientWidth,
        h = el.clientHeight;
      if (!w || !h) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
      composer.setSize(w, h);
      if (!ready && !records.size) fit(framing, currentView, 0);
      needsRender = true;
    });
    resize.observe(el);
    controls.addEventListener("change", () => {
      needsRender = true;
    });
    controls.addEventListener("start", () => {
      tween = null;
    });
    let down: [number, number] = [0, 0],
      lastHover = 0;
    const rayAt = (x: number, y: number) => {
      const rect = renderer.domElement.getBoundingClientRect(),
        ray = new THREE.Raycaster();
      ray.setFromCamera(
        new THREE.Vector2(
          ((x - rect.left) / rect.width) * 2 - 1,
          (-(y - rect.top) / rect.height) * 2 + 1,
        ),
        camera,
      );
      const hits = ray.intersectObjects(
        [...records.values()].flatMap((r) => r.meshes.filter((m) => m.visible)),
        false,
      );
      return (
        hits.find(
          (h) => (h.object as THREE.Mesh).userData.pickOpacity > 0.45,
        ) || hits[0]
      );
    };
    const pointerDown = (e: PointerEvent) => {
      down = [e.clientX, e.clientY];
      live.current.onHover?.(null);
    };
    const pointerUp = (e: PointerEvent) => {
      if (
        e.button !== 0 ||
        Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 5 ||
        live.current.selectionMode === "landmark"
      )
        return;
      const hit = rayAt(e.clientX, e.clientY);
      live.current.onSelect?.(hit?.object.userData.modelId || "");
    };
    const hover = (e: PointerEvent) => {
      if (e.buttons || performance.now() - lastHover < 100 || live.current.quiz)
        return;
      lastHover = performance.now();
      const hit = rayAt(e.clientX, e.clientY);
      const m = hit && byId.get(hit.object.userData.modelId);
      live.current.onHover?.(m?.name || null);
      renderer.domElement.style.cursor = m ? "pointer" : "grab";
    };
    const leave = () => live.current.onHover?.(null);
    renderer.domElement.addEventListener("pointerdown", pointerDown);
    renderer.domElement.addEventListener("pointerup", pointerUp);
    renderer.domElement.addEventListener("pointermove", hover);
    renderer.domElement.addEventListener("pointerleave", leave);
    anatomyAsset()
      .then((asset) => {
        if (cancelled) return;
        const copy = asset.clone(true),
          subset = props.onlyIds ? new Set(props.onlyIds) : null;
        copy.traverse((obj) => {
          if (!(obj instanceof THREE.Mesh)) return;
          const id = obj.name.replace(/_\d+$/, ""),
            model = byId.get(id) || byId.get(obj.parent?.name || "");
          if (!model) {
            obj.visible = false;
            return;
          }
          if (subset && !subset.has(model.id)) {
            obj.visible = false;
            return;
          }
          const mats = (
            Array.isArray(obj.material) ? obj.material : [obj.material]
          ).map((mat) => {
            const m = (mat as THREE.MeshStandardMaterial).clone();
            m.side =
              [
                "ligaments",
                "tendons",
                "fascia",
                "capsules",
                "bursae",
                "attachment",
              ].includes(model.layer || "") || model.surfaceRegion
                ? THREE.DoubleSide
                : THREE.FrontSide;
            m.metalness = 0;
            m.roughness =
              model.layer === "cartilage"
                ? 0.43
                : model.layer === "skin"
                  ? 0.9
                  : 0.72;
            m.forceSinglePass = true;
            return m;
          });
          obj.material = Array.isArray(obj.material) ? mats : mats[0];
          obj.userData.modelId = model.id;
          const rec = records.get(model.id) || {
            model,
            meshes: [],
            materials: [],
            base: [],
          };
          rec.meshes.push(obj);
          rec.materials.push(...mats);
          rec.base.push(...mats.map((m) => m.color.clone()));
          records.set(model.id, rec);
        });
        root.add(copy);
        root.updateMatrixWorld(true);
        setReady(true);
        el.dataset.modelCount = String(modelParts.length);
        el.dataset.renderedParts = String(records.size);
        lastSignature = "";
        lastColors = "";
        fit(framing, currentView, 0);
        live.current.onReady?.(api);
        needsRender = true;
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      });
    const project = () => {
      const p = live.current,
        w = el.clientWidth,
        h = el.clientHeight;
      const relevant = (p.landmarks || []).filter(
        (l) =>
          records.get(l.modelId)?.meshes.some((m) => m.visible) &&
          (!l.contextIds ||
            l.contextIds.every((id) =>
              records.get(id)?.meshes.some((m) => m.visible),
            )),
      );
      const shown: Projected[] = [];
      const solid = [...records.values()].flatMap((r) =>
        r.meshes.filter((m) => m.visible && m.userData.pickOpacity > 0.9),
      );
      for (const l of relevant) {
        const world = new THREE.Vector3(...l.anchor).sub(bodyCenter),
          ndc = world.clone().project(camera);
        if (
          ndc.z < -1 ||
          ndc.z > 1 ||
          Math.abs(ndc.x) > 0.94 ||
          Math.abs(ndc.y) > 0.9
        )
          continue;
        const delta = world.clone().sub(camera.position),
          distance = delta.length();
        const ray = new THREE.Raycaster(
          camera.position,
          delta.normalize(),
          0,
          Math.max(0, distance - 0.002),
        );
        const blocker = ray.intersectObjects(solid, false)[0];
        if (blocker && blocker.distance < distance - 0.0025) continue;
        shown.push({
          id: l.id,
          name: l.name,
          x: ((ndc.x + 1) * w) / 2,
          y: ((1 - ndc.y) * h) / 2,
          labelX: 0,
          labelY: 0,
          side: ndc.x < 0 ? -1 : 1,
        });
      }
      const filtered = shown
        .sort((a, b) =>
          a.id === p.activeLandmark ? -1 : b.id === p.activeLandmark ? 1 : 0,
        )
        .slice(0, p.quiz ? 20 : 8);
      for (const side of [-1, 1]) {
        let last = 45;
        const items = filtered
          .filter((q) => q.side === side)
          .sort((a, b) => a.y - b.y);
        for (const q of items) {
          q.labelY = Math.max(last, Math.min(h - 72, q.y));
          q.labelX = side < 0 ? 22 : w - 22;
          last = q.labelY + 40;
        }
        const overflow = last - (h - 42);
        if (overflow > 0) for (const q of items) q.labelY -= overflow;
      }
      const sig = JSON.stringify(
        filtered.map((q) => [
          q.id,
          Math.round(q.x),
          Math.round(q.y),
          Math.round(q.labelY),
        ]),
      );
      if (sig !== lastLabelSignature) {
        lastLabelSignature = sig;
        setPoints(filtered);
      }
      el.dataset.visibleLandmarks = String(filtered.length);
    };
    const tick = (now: number) => {
      if (cancelled) return;
      const p = live.current;
      if (p.frameSize !== lastFrameSize) {
        lastFrameSize = p.frameSize;
        fit(framing, currentView, 300);
      }
      const selected = new Set(p.selected),
        isolated = p.isolated ? new Set(p.isolated) : null,
        hidden = new Set(p.hidden),
        only = p.onlyIds ? new Set(p.onlyIds) : null,
        attachments = new Set(p.attachments || []);
      const signature = JSON.stringify([
        p.visible,
        p.selected,
        p.hidden,
        p.isolated,
        p.layers,
        p.highlightedSystems,
        p.attachments,
        p.region,
        p.quality,
        p.activeLandmark,
        p.landmarks?.map((l) => l.id),
      ]);
      const colors = JSON.stringify([
        p.appearance.bone,
        p.appearance.muscle,
        p.appearance.accent,
        p.distinct,
        p.appearance.mode,
        p.appearance.studio,
      ]);
      if (signature !== lastSignature || colors !== lastColors) {
        lastSignature = signature;
        lastColors = colors;
        renderer.setClearColor(
          p.appearance.studio === "adaptive" && p.appearance.mode === "light"
            ? "#e1e6e6"
            : "#182128",
          1,
        );
        let count = 0,
          transparent = false;
        for (const [id, r] of records) {
          const l = r.model.layer || "organs";
          const show = only
            ? only.has(id)
            : attachments.has(id) ||
              (!hidden.has(id) &&
                (!isolated || isolated.has(id)) &&
                p.visible.includes(r.model.system) &&
                (p.layers[l] ?? 1) > 0 &&
                l !== "attachment");
          const opacity = only
            ? (p.opacityOverrides?.[l] ?? 1)
            : attachments.has(id)
              ? 1
              : (p.layers[l] ?? 1);
          const dim =
            !!p.highlightedSystems?.length &&
            !p.highlightedSystems.includes(r.model.system) &&
            !selected.has(id);
          let color = new THREE.Color(
            l === "bones"
              ? p.appearance.bone
              : l === "muscles"
                ? p.appearance.muscle
                : l === "attachment"
                  ? r.model.attachmentKind === "origin"
                    ? "#f5b85a"
                    : "#6dc8d8"
                  : l === "skin"
                    ? "#bd9680"
                    : l === "cartilage"
                      ? "#a9c2cb"
                      : l === "tendons" ||
                          l === "ligaments" ||
                          l === "fascia" ||
                          l === "capsules" ||
                          l === "bursae"
                        ? "#dfd2b8"
                        : "#b78373",
          );
          if (l === "muscles" && !p.quiz) color.copy(muscleColor(r.model, p.appearance.muscle, p.distinct !== false));
          if (r.model.system === "cardiovascular")
            color.set(/vein|vena/i.test(r.model.name) ? "#698ab7" : "#b34b50");
          if (r.model.system === "nervous") color.set("#d2bb6e");
          if (r.model.system === "lymphatic") color.set("#7a9c76");
          if (dim) color.multiplyScalar(0.3);
          if (selected.has(id))
            color.lerp(
              new THREE.Color(p.appearance.accent),
              p.quiz ? 0.65 : 0.18,
            );
          r.meshes.forEach((m) => {
            m.visible = show;
            m.userData.pickOpacity = opacity;
          });
          r.materials.forEach((m) => {
            m.color.copy(color);
            m.emissive.set(selected.has(id) ? p.appearance.accent : "#000000");
            m.emissiveIntensity = selected.has(id) ? 0.035 : 0;
            // Per-sample depth coverage reveals deeper structures without
            // sorting translucent back faces. Older contexts use alpha hashing.
            const fading = opacity < 0.999;
            const coverage = fading && samples > 1,
              hash = fading && !coverage;
            if (m.alphaHash !== hash || m.alphaToCoverage !== coverage) {
              m.alphaHash = hash;
              m.alphaToCoverage = coverage;
              m.needsUpdate = true;
            }
            m.transparent = false;
            m.opacity = opacity;
            m.depthWrite = true;
            m.polygonOffset = l === "attachment";
            m.polygonOffsetFactor = -2;
            m.polygonOffsetUnits = -2;
          });
          if (show) {
            count++;
            transparent ||= opacity < 0.999;
          }
        }
        outline.selectedObjects = [...selected].flatMap(
          (id) => records.get(id)?.meshes.filter((m) => m.visible) || [],
        );
        outline.visibleEdgeColor.set(p.appearance.accent);
        outline.enabled = outline.selectedObjects.length > 0 && !p.quiz;
        ao.enabled = !!p.quality && !transparent && count < 500;
        el.dataset.visibleMeshes = String(count);
        el.dataset.selectedParts = String(selected.size);
        el.dataset.isolated = String(!!p.isolated);
        el.dataset.transparency = transparent ? "depth-tested" : "solid";
        el.dataset.coverageMode = samples > 1 ? "multisample" : "hashed";
        needsRender = true;
      }
      if (tween) {
        const t = tween.duration
          ? THREE.MathUtils.clamp((now - tween.start) / tween.duration, 0, 1)
          : 1;
        const ease = t * t * (3 - 2 * t);
        camera.position.lerpVectors(tween.from, tween.to, ease);
        controls.target.lerpVectors(tween.fromTarget, tween.toTarget, ease);
        el.dataset.motionProgress = t.toFixed(3);
        needsRender = true;
        if (t === 1) tween = null;
      }
      const distance = camera.position.distanceTo(controls.target);
      camera.near = Math.max(0.0008, distance / 300);
      camera.far = Math.max(4, distance * 5);
      camera.updateProjectionMatrix();
      const changed = controls.update();
      el.dataset.animating = String(!!tween);
      el.dataset.cameraView = currentView;
      el.dataset.cameraDistance = distance.toFixed(4);
      if (needsRender || changed) {
        composer.render();
        project();
        needsRender = false;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      resize.disconnect();
      controls.dispose();
      for (const r of records.values()) r.materials.forEach((m) => m.dispose());
      composer.dispose();
      ao.dispose();
      outline.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);
  const labelProps = live.current;
  return (
    <div className={`anatomy-scene ${props.quiz ? "quiz-anatomy-scene" : ""}`}>
      <div className="three-canvas" ref={host} />
      {!ready && !error && (
        <div className="scene-loading">
          <span className="atlas-loading-ring" />
          <strong>Preparing the anatomy atlas</strong>
          <span>Loading detailed structures and joint surfaces…</span>
        </div>
      )}
      {error && (
        <div className="scene-error" role="alert">
          <strong>3D viewer unavailable</strong>
          <p>{error}</p>
        </div>
      )}
      <svg className="anatomy-leaders" aria-hidden="true">
        {props.labels &&
          !props.quiz &&
          points.map((p) => (
            <polyline
              key={p.id}
              points={`${p.x},${p.y} ${p.labelX + (p.side < 0 ? 120 : -120)},${p.labelY} ${p.labelX},${p.labelY}`}
              fill="none"
              stroke="currentColor"
              strokeWidth=".8"
            />
          ))}
      </svg>
      {points.map((p, i) => (
        <div key={p.id}>
          <button
            data-landmark-id={p.id}
            className={`landmark-pin ${p.id === props.activeLandmark || p.id === props.targetMarker ? "selected" : ""}`}
            style={{ left: p.x, top: p.y }}
            aria-label={props.quiz ? `Anatomical marker ${i + 1}` : p.name}
            onClick={(e) => {
              e.stopPropagation();
              labelProps.onLandmark?.(p.id);
            }}
          >
            <span />
          </button>
          {props.labels && !props.quiz && (
            <button
              className={`anchored-label ${p.side < 0 ? "left" : "right"} ${p.id === props.activeLandmark ? "selected" : ""}`}
              style={{ left: p.labelX, top: p.labelY }}
              onClick={() => labelProps.onLandmark?.(p.id)}
            >
              {p.name}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
export const defaultLayers: Record<AnatomyLayer, number> = {
  skin: 0,
  muscles: 0,
  bones: 1,
  tendons: 0,
  ligaments: 0,
  cartilage: 1,
  fascia: 0,
  capsules: 0,
  bursae: 0,
  organs: 0,
  attachment: 0,
};
