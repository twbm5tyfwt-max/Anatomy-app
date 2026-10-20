import { tissueColor } from "./tissueColors";
import { anatomyModels } from "./assetPaths";
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
import {
  modelParts as defaultModelParts,
  type ModelPart,
  type AnatomyLayer,
} from "./modelCatalog";
import { orderPicks } from "./interaction";
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
export type CameraState = {
  position: number[];
  target: number[];
  view: CameraView;
};
export type SceneApi = {
  snapshot: () => CameraState;
  restore: (state: CameraState) => void;
  frame: (ids: string[], view?: CameraView, duration?: number) => void;
  view: (v: CameraView) => void;
  zoom: (factor: number) => void;
  home: () => void;
};
export type SceneProps = {
  catalog?: ModelPart[];
  assetUrl?: string;
  visible: string[];
  selected: string[];
  hidden: string[];
  allowedIds?: string[];
  isolated: string[] | null;
  layers: Record<string, number>;
  highlightedSystems?: string[];
  attachments?: string[];
  appearance: Appearance;
  region?: string;
  background?: "graphite" | "ivory" | "midnight";
  offsets?: Record<string, number[]>;
  cameraState?: CameraState;
  onCamera?: (state: CameraState) => void;
  onCandidates?: (ids: string[]) => void;
  onPickable?: (ids: string[]) => void;
  onInteracting?: (active: boolean) => void;
  disableStructurePick?: boolean;
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
  /** Flat atlas-plate presentation: near-orthographic camera, rotation locked, pan + zoom only. */
  plate?: boolean;
  targetMarker?: string;
  opacityOverrides?: Record<string, number>;
  /** Per-structure colours, e.g. one colour per head of a multi-part muscle. */
  colorOverrides?: Record<string, string>;
  onSelect?: (id: string) => void;
  onLandmark?: (id: string) => void;
  onHover?: (text: string | null) => void;
  onReady?: (api: SceneApi) => void;
};
const assetPromises = new Map<string, Promise<THREE.Group>>();
export function anatomyAsset(url = anatomyModels.atlas) {
  let promise = assetPromises.get(url);
  if (!promise) {
    promise = (async () => {
      const response = await fetch(url);
      if (!response.ok)
        throw new Error(
          "Anatomy files are unavailable. Open the complete downloaded app.",
        );
      return (
        await new GLTFLoader()
          .setMeshoptDecoder(MeshoptDecoder)
          .parseAsync(await response.arrayBuffer(), "")
      ).scene;
    })();
    assetPromises.set(url, promise);
    promise.catch(() => assetPromises.delete(url));
  }
  return promise;
}
const directions: Record<CameraView, THREE.Vector3> = {
  front: new THREE.Vector3(0, 0.02, 1),
  back: new THREE.Vector3(0, 0.02, -1),
  left: new THREE.Vector3(1, 0.02, 0),
  right: new THREE.Vector3(-1, 0.02, 0),
  superior: new THREE.Vector3(0, 1, 0.001),
  inferior: new THREE.Vector3(0, -1, 0.001),
};
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
    const modelParts = props.catalog || defaultModelParts;
    const byId = new Map(modelParts.map((m) => [m.id, m]));
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
    const el = host.current!;
    setReady(false);
    setError("");
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
    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio || 1, props.plate || props.quiz ? 1.5 : 2),
    );
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
      camera = new THREE.PerspectiveCamera(props.plate ? 7 : 35, 1, 0.01, 15);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.minDistance = 0.015;
    controls.maxDistance = props.plate ? 120 : 8;
    if (props.plate) {
      controls.enableRotate = false;
      controls.screenSpacePanning = true;
      controls.mouseButtons = {
        LEFT: THREE.MOUSE.PAN,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.PAN,
      };
      controls.touches = { ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.DOLLY_PAN };
    }
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
    const samples = Math.min(
      props.plate || props.quiz ? 2 : 4,
      renderer.capabilities.maxSamples,
    );
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
    let desiredAo = false;
    let lastActive = 0,
      idleDirty = true,
      needsRender = true,
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
      elapsed: number;
      last: number;
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
        .add(
          (view
            ? directions[view].clone()
            : camera.position.clone().sub(controls.target)
          )
            .normalize()
            .multiplyScalar(distance),
        );
      tween = {
        from: camera.position.clone(),
        to,
        fromTarget: controls.target.clone(),
        toTarget: target,
        start: performance.now(),
        elapsed: 0,
        last: performance.now(),
        duration: reduced ? 0 : duration,
      };
      needsRender = true;
    };
    const fit = (
      ids: string[],
      view: CameraView | undefined,
      duration: number,
    ) => {
      const box = ids.length ? union(ids) : bodyBox.clone();
      if (ids.length && live.current.offsets)
        for (const id of ids) {
          const offset = live.current.offsets[id];
          if (offset) {
            const b = union([id]).translate(new THREE.Vector3(...offset));
            box.union(b);
          }
        }
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
      snapshot() {
        return {
          position: camera.position.toArray(),
          target: controls.target.toArray(),
          view: currentView,
        };
      },
      restore(state) {
        tween = null;
        const damping = controls.enableDamping;
        controls.enableDamping = false;
        controls.update();
        camera.position.fromArray(state.position);
        controls.target.fromArray(state.target);
        currentView = state.view;
        controls.update();
        controls.enableDamping = damping;
        needsRender = true;
      },
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
    let down: [number, number] | null = null,
      moved = false,
      lastHover = 0,
      hoverId = "";
    const pointers = new Set<number>();
    function setHover(id: string) {
      if (hoverId === id) return;
      hoverId = id;
      lastSignature = "";
      needsRender = true;
      live.current.onHover?.(byId.get(id)?.name || null);
      renderer.domElement.style.cursor = id ? "pointer" : "grab";
    }
    const rayAt = (x: number, y: number) => {
      const rect = renderer.domElement.getBoundingClientRect(),
        ray = new THREE.Raycaster();
      ray.setFromCamera(
        new THREE.Vector2(
          ((x - rect.left) / rect.width) * 2 - 1,
          -((y - rect.top) / rect.height) * 2 + 1,
        ),
        camera,
      );
      ray.near = camera.near;
      ray.far = camera.far;
      root.updateMatrixWorld(true);
      const meshes = [...records.values()].flatMap((r) =>
        r.meshes.filter((m) => m.visible && m.userData.pickOpacity > 0.05),
      );
      const hits = ray.intersectObjects(meshes, false);
      const candidates = hits.map((h) => ({
        id: h.object.userData.modelId,
        opacity: h.object.userData.pickOpacity,
        distance: h.distance,
      }));
      // Small lymph-node targets receive an invisible 8 px hit tolerance, only
      // when their center is not occluded by a nearer opaque surface.
      if (!live.current.quiz)
        for (const [id, r] of records) {
          if (
            !/nodes?|gangli/i.test(r.model.name) ||
            r.model.system !== "lymphatic" ||
            !r.meshes.some((m) => m.visible)
          )
            continue;
          const center = union([id])
              .getCenter(new THREE.Vector3())
              .sub(bodyCenter),
            point = center.clone().project(camera);
          const px = ((point.x + 1) * rect.width) / 2,
            py = ((1 - point.y) * rect.height) / 2;
          if (
            point.z > -1 &&
            point.z < 1 &&
            Math.hypot(px - (x - rect.left), py - (y - rect.top)) <= 8
          ) {
            const d = center.distanceTo(camera.position),
              nr = new THREE.Raycaster(
                camera.position,
                center.clone().sub(camera.position).normalize(),
                0,
                d - 0.003,
              );
            if (
              !nr.intersectObjects(
                meshes.filter((m) => m.userData.pickOpacity >= 0.9),
                false,
              ).length
            )
              candidates.push({ id, opacity: 1, distance: d });
          }
        }
      return orderPicks(candidates).map((h) => h.id);
    };
    const pointerDown = (e: PointerEvent) => {
      live.current.onInteracting?.(true);
      pointers.add(e.pointerId);
      if (pointers.size > 1) moved = true;
      if (pointers.size === 1) {
        down = [e.clientX, e.clientY];
        moved = false;
      }
      setHover("");
    };
    const pointerUp = (e: PointerEvent) => {
      live.current.onInteracting?.(false);
      pointers.delete(e.pointerId);
      const tap =
        down &&
        !moved &&
        Math.hypot(e.clientX - down[0], e.clientY - down[1]) <= 5 &&
        e.button === 0;
      down = null;
      if (!tap || live.current.disableStructurePick) return;
      const ids = rayAt(e.clientX, e.clientY);
      live.current.onCandidates?.(ids.slice(0, 12));
      live.current.onSelect?.(ids[0] || "");
    };
    const hover = (e: PointerEvent) => {
      if (down && Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 5)
        moved = true;
      if (
        e.buttons ||
        pointers.size ||
        performance.now() - lastHover < 90 ||
        live.current.quiz
      )
        return;
      lastHover = performance.now();
      setHover(rayAt(e.clientX, e.clientY)[0] || "");
    };
    const leave = () => setHover("");
    const cancel = () => {
      live.current.onInteracting?.(false);
      pointers.clear();
      down = null;
      moved = true;
      setHover("");
    };
    renderer.domElement.addEventListener("pointercancel", cancel);
    renderer.domElement.addEventListener("pointerdown", pointerDown);
    renderer.domElement.addEventListener("pointerup", pointerUp);
    renderer.domElement.addEventListener("pointermove", hover);
    renderer.domElement.addEventListener("pointerleave", leave);
    anatomyAsset(props.assetUrl)
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
          obj.userData.sourcePosition = obj.position.clone();
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
        if (live.current.cameraState) api.restore(live.current.cameraState);
        live.current.onReady?.(api);
        needsRender = true;
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      });
    let lastPickable = "";
    function reportPickable() {
      if (!live.current.onPickable || tween) return;
      const rect = renderer.domElement.getBoundingClientRect(),
        found: string[] = [];
      const pickPoints: Record<string, number[]> = {};
      for (const [id, r] of records) {
        if (r.model.parentId || !r.meshes.some((m) => m.visible)) continue;
        let ok = false;
        for (const mesh of r.meshes.filter((m) => m.visible)) {
          const index = mesh.geometry.index,
            position = mesh.geometry.attributes.position;
          if (!position) continue;
          const count = index?.count || position.count;
          for (
            let i = 0;
            i < count;
            i += Math.max(3, Math.floor(count / 36 / 3) * 3)
          ) {
            const v = new THREE.Vector3();
            for (let j = 0; j < 3; j++) {
              const n = index
                ? index.getX(Math.min(i + j, count - 1))
                : Math.min(i + j, count - 1);
              v.add(new THREE.Vector3().fromBufferAttribute(position, n));
            }
            v.divideScalar(3).applyMatrix4(mesh.matrixWorld).project(camera);
            if (
              v.z < 0 ||
              v.z > 1 ||
              Math.abs(v.x) > 0.88 ||
              Math.abs(v.y) > 0.88
            )
              continue;
            const picked = rayAt(
              rect.left + ((v.x + 1) * rect.width) / 2,
              rect.top + ((1 - v.y) * rect.height) / 2,
            )[0];
            if (picked === id || byId.get(picked)?.parentId === id) {
              pickPoints[id] = [(v.x + 1) / 2, (1 - v.y) / 2];
              ok = true;
              break;
            }
          }
          if (ok) break;
        }
        if (ok) found.push(id);
      }
      el.dataset.pickableIds = JSON.stringify(found);
      el.dataset.pickPoints = JSON.stringify(pickPoints);
      const signature = found.join(",");
      if (signature !== lastPickable) {
        lastPickable = signature;
        live.current.onPickable(found);
      }
    }
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
        const hits = ray.intersectObjects(solid, false);
        // On a flat plate the anchor sits inside its own structure, so only other
        // structures in front of it hide the label.
        const blocker = p.plate
          ? hits.find((h) => h.object.userData.modelId !== l.modelId)
          : hits[0];
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
        .slice(0, p.quiz ? 20 : p.plate ? 26 : 16);
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
        p.allowedIds,
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
        p.background,
        p.offsets,
        hoverId,
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
        const theme =
          p.background ||
          (p.appearance.studio === "adaptive" && p.appearance.mode === "light"
            ? "ivory"
            : "graphite");
        const palettes = {
          graphite: ["#233345", "#0d1726"],
          ivory: ["#f1f1e9", "#cbd7dc"],
          midnight: ["#1d3658", "#080f21"],
        };
        const bg = document.createElement("canvas");
        bg.width = 4;
        bg.height = 512;
        const ctx = bg.getContext("2d")!,
          gradient = ctx.createLinearGradient(0, 0, 0, 512);
        gradient.addColorStop(0, palettes[theme][0]);
        gradient.addColorStop(1, palettes[theme][1]);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 4, 512);
        (scene.background as THREE.Texture | null)?.dispose();
        const texture = new THREE.CanvasTexture(bg);
        texture.colorSpace = THREE.SRGBColorSpace;
        scene.background = texture;
        const visibleLayerCounts: Record<string, number> = {};
        let count = 0,
          transparent = false;
        for (const [id, r] of records) {
          const l = r.model.layer || "organs";
          const show =
            (!p.allowedIds || p.allowedIds.includes(id)) &&
            (only
              ? only.has(id)
              : attachments.has(id) ||
                (!hidden.has(id) &&
                  (!isolated || isolated.has(id)) &&
                  p.visible.includes(r.model.system) &&
                  (p.layers[l] ?? 1) > 0 &&
                  l !== "attachment"));
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
            l === "bones" && !p.quiz
              ? p.appearance.bone
              : l === "muscles" && !p.quiz
                ? p.appearance.muscle
                : l === "attachment"
                  ? r.model.attachmentKind === "origin"
                    ? "#f5b85a"
                    : "#6dc8d8"
                  : l === "skin"
                    ? "#bd9680"
                    : tissueColor(l),
          );
          if (l === "muscles" && !p.quiz)
            color.copy(
              muscleColor(r.model, p.appearance.muscle, p.distinct !== false),
            );
          if (r.model.system === "cardiovascular")
            color.set(/vein|vena/i.test(r.model.name) ? "#698ab7" : "#b34b50");
          if (r.model.system === "nervous") color.set("#d2bb6e");
          if (r.model.system === "lymphatic") color.set("#7a9c76");
          const custom = p.colorOverrides?.[id];
          if (custom) color.set(custom);
          if (dim) color.multiplyScalar(0.3);
          if (selected.has(id) && !custom)
            color.lerp(
              new THREE.Color(p.appearance.accent),
              p.quiz ? 0.65 : 0.18,
            );
          if (id === hoverId && show)
            color.lerp(new THREE.Color("#e4f1cf"), 0.22);
          r.meshes.forEach((m) => {
            const offset = p.offsets?.[id] || [0, 0, 0];
            m.position
              .copy(m.userData.sourcePosition)
              .add(new THREE.Vector3(...offset));
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
            visibleLayerCounts[l] = (visibleLayerCounts[l] || 0) + 1;
            count++;
            transparent ||= opacity < 0.999;
          }
        }
        if (hoverId && !records.get(hoverId)?.meshes.some((m) => m.visible))
          setHover("");
        root.updateMatrixWorld(true);
        outline.selectedObjects = [...new Set([...selected, hoverId])].flatMap(
          (id) => records.get(id)?.meshes.filter((m) => m.visible) || [],
        );
        outline.visibleEdgeColor.set(p.appearance.accent);
        outline.enabled = outline.selectedObjects.length > 0 && !p.quiz;
        desiredAo =
          !!p.quality &&
          !transparent &&
          count < 50 &&
          camera.position.distanceTo(controls.target) < 0.8;
        el.dataset.hoveredId = hoverId;
        el.dataset.selectedIds = JSON.stringify([...selected]);
        el.dataset.visibleMeshes = String(count);
        el.dataset.visibleLayerCounts = JSON.stringify(visibleLayerCounts);
        el.dataset.selectedParts = String(selected.size);
        el.dataset.isolated = String(!!p.isolated);
        el.dataset.transparency = transparent ? "depth-tested" : "solid";
        el.dataset.coverageMode = samples > 1 ? "multisample" : "hashed";
        needsRender = true;
      }
      if (tween) {
        tween.elapsed += Math.min(100, Math.max(0, now - tween.last));
        tween.last = now;
        const t = tween.duration
          ? THREE.MathUtils.clamp(tween.elapsed / tween.duration, 0, 1)
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
      if (changed || tween) live.current.onCamera?.(api.snapshot());
      el.dataset.animating = String(!!tween);
      el.dataset.cameraView = currentView;
      el.dataset.cameraDistance = distance.toFixed(4);
      el.dataset.cameraPose = JSON.stringify({
        position: camera.position.toArray().map((n) => +n.toFixed(6)),
        target: controls.target.toArray().map((n) => +n.toFixed(6)),
      });
      if (needsRender || changed) {
        ao.enabled = desiredAo && !tween && pointers.size === 0;
        outline.enabled =
          outline.selectedObjects.length > 0 &&
          !p.quiz &&
          !tween &&
          pointers.size === 0;
        composer.render();
        needsRender = false;
        lastActive = now;
        // Label projection and pickability checks cast many rays; run them only once the
        // camera has settled so dragging, panning and zooming stay smooth.
        idleDirty = true;
        el.classList.toggle("moving", pointers.size > 0 || !!tween);
      } else if (
        idleDirty &&
        pointers.size === 0 &&
        !tween &&
        now - lastActive > 140
      ) {
        project();
        reportPickable();
        idleDirty = false;
        el.classList.remove("moving");
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
      live.current.onCamera?.(api.snapshot());
      (scene.background as THREE.Texture | null)?.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    };
  }, [props.catalog, props.assetUrl]);
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
  cartilage: 0,
  fascia: 0,
  capsules: 0,
  bursae: 0,
  organs: 0,
  attachment: 0,
};
