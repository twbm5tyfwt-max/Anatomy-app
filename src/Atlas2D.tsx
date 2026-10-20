import { useEffect, useMemo, useRef, useState } from "react";
import {
  AnatomyScene,
  type CameraView,
  type LandmarkPoint,
  type SceneApi,
} from "./AnatomyScene";
import { defaultAppearance, type Appearance } from "./Appearance";
import { getModelStudy, modelParts, type AnatomyLayer } from "./modelCatalog";
import "./atlas2d.css";

const views: { id: CameraView; label: string; tip: string }[] = [
  { id: "front", label: "Anterior", tip: "Front of the body" },
  { id: "back", label: "Posterior", tip: "Back of the body" },
  { id: "left", label: "Left lateral", tip: "The body's left side" },
  { id: "right", label: "Right lateral", tip: "The body's right side" },
];

const layerChips: {
  id: string;
  label: string;
  layers: AnatomyLayer[];
  system: string;
}[] = [
  { id: "skin", label: "Skin", layers: ["skin"], system: "integumentary" },
  { id: "muscles", label: "Muscles", layers: ["muscles"], system: "muscular" },
  { id: "tendons", label: "Tendons", layers: ["tendons"], system: "muscular" },
  { id: "bones", label: "Bones", layers: ["bones"], system: "skeletal" },
  { id: "cartilage", label: "Cartilage", layers: ["cartilage"], system: "skeletal" },
  { id: "ligaments", label: "Ligaments", layers: ["ligaments"], system: "skeletal" },
  { id: "organs", label: "Organs, vessels & nerves", layers: ["organs"], system: "" },
];

const initialLayers: Record<string, number> = {
  skin: 0,
  muscles: 1,
  tendons: 0,
  bones: 1,
  cartilage: 0,
  ligaments: 0,
  fascia: 0,
  capsules: 0,
  bursae: 0,
  organs: 0,
  attachment: 0,
};

const byId = new Map(modelParts.map((m) => [m.id, m]));

export function Atlas2D({
  visible,
  onVisibleChange,
  appearance = defaultAppearance,
  on3D,
  onTissue,
}: {
  visible: string[];
  onVisibleChange: (v: string[]) => void;
  appearance?: Appearance;
  on3D: (id?: string) => void;
  onTissue: () => void;
}) {
  const api = useRef<SceneApi | null>(null);
  const [view, setView] = useState<CameraView>("front");
  const [layers, setLayers] = useState(initialLayers);
  const [selected, setSelected] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [labels, setLabels] = useState(true);
  const [search, setSearch] = useState("");
  const [hidden, setHidden] = useState<string[]>([]);

  // Atlas systems follow the left rail; layers are controlled here.
  const shownSystems = useMemo(
    () => new Set([...visible, "skeletal", "muscular"]),
    [visible],
  );
  const sys = useMemo(() => [...shownSystems], [shownSystems]);

  // Nothing is labeled until a structure is clicked; only that structure gets a label.
  const landmarks = useMemo<LandmarkPoint[]>(() => {
    const m = selected ? byId.get(selected) : null;
    if (!labels || !m) return [];
    return [
      {
        id: m.id,
        name: m.name,
        anchor: [
          (m.bounds[0][0] + m.bounds[1][0]) / 2,
          (m.bounds[0][1] + m.bounds[1][1]) / 2,
          (m.bounds[0][2] + m.bounds[1][2]) / 2,
        ],
        modelId: m.id,
      },
    ];
  }, [labels, selected]);

  useEffect(() => {
    api.current?.view(view);
  }, [view]);

  function toggleLayer(chip: (typeof layerChips)[number]) {
    const on = chip.layers.every((l) => (layers[l] ?? 0) > 0);
    setLayers((v) => ({
      ...v,
      ...Object.fromEntries(chip.layers.map((l) => [l, on ? 0 : 1])),
    }));
    if (!on && chip.system && !visible.includes(chip.system))
      onVisibleChange([...visible, chip.system]);
  }

  const model = selected ? byId.get(selected) : null;
  const study = model ? getModelStudy(model) : null;
  const matches = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (q.length < 2) return [];
    return modelParts
      .filter(
        (m) =>
          !m.parentId &&
          m.layer &&
          m.layer !== "attachment" &&
          m.name.toLowerCase().includes(q),
      )
      .slice(0, 8);
  }, [search]);

  function pick(id: string, ensureShown = true) {
    setSelected(id);
    const m = byId.get(id);
    if (m && ensureShown) {
      if (m.layer && !(layers[m.layer] > 0))
        setLayers((v) => ({ ...v, [m.layer as string]: 1 }));
      if (!visible.includes(m.system)) onVisibleChange([...visible, m.system]);
    }
  }

  return (
    <section className="a2d">
      <header className="a2d-head">
        <div>
          <p className="eyebrow">2D ATLAS · DRAWN FROM THE 3D MODEL</p>
          <h2>Flat anatomy plate</h2>
          <p>
            A labeled, flat view of the same source anatomy as the 3D viewer.
            Drag to pan, scroll or pinch to zoom, click any structure.
          </p>
        </div>
        <div className="a2d-views" role="group" aria-label="Plate view">
          {views.map((v) => (
            <button
              key={v.id}
              title={v.tip}
              aria-pressed={view === v.id}
              onClick={() => setView(v.id)}
            >
              {v.label}
            </button>
          ))}
        </div>
      </header>

      <div className="a2d-layers" role="group" aria-label="Plate layers">
        {layerChips.map((c) => (
          <button
            key={c.id}
            aria-pressed={c.layers.every((l) => (layers[l] ?? 0) > 0)}
            onClick={() => toggleLayer(c)}
          >
            {c.label}
          </button>
        ))}
        <button
          className="a2d-label-toggle"
          aria-pressed={labels}
          onClick={() => setLabels(!labels)}
        >
          Label on click: {labels ? "on" : "off"}
        </button>
      </div>

      <div className="a2d-body">
        <div className="a2d-plate" data-view={view}>
          <AnatomyScene
            key="plate"
            plate
            labels={labels}
            landmarks={landmarks}
            activeLandmark={selected}
            onLandmark={(id) => pick(id)}
            visible={sys}
            selected={selected ? [selected] : []}
            hidden={hidden}
            isolated={null}
            layers={layers}
            appearance={appearance}
            background="ivory"
            onSelect={(id) => (id ? pick(id, false) : setSelected(null))}
            onHover={setHover}
            onReady={(a) => {
              api.current = a;
              a.frame([], view, 0);
            }}
          />
          <div className="a2d-hint" aria-live="polite">
            {hover ? hover : "Click a bone or muscle to label it"}
          </div>
          <div className="a2d-zoom">
            <button aria-label="Zoom in" onClick={() => api.current?.zoom(0.75)}>
              +
            </button>
            <button aria-label="Zoom out" onClick={() => api.current?.zoom(1.33)}>
              −
            </button>
            <button aria-label="Fit plate" onClick={() => api.current?.frame([], view, 300)}>
              Fit
            </button>
          </div>
        </div>

        <aside className="a2d-side">
          <label className="a2d-search">
            <span>Find a structure</span>
            <input
              type="search"
              value={search}
              placeholder="e.g. deltoid, femur"
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          {!!matches.length && (
            <ul className="a2d-matches">
              {matches.map((m) => (
                <li key={m.id}>
                  <button
                    onClick={() => {
                      pick(m.id);
                      setSearch("");
                      api.current?.frame([m.id], view, 500);
                    }}
                  >
                    {m.name}
                    <small>{m.layer}</small>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {model && study ? (
            <article className="a2d-info">
              <span className="a2d-kind">{model.layer}</span>
              <h3>{model.name}</h3>
              <p>{study.description || study.function}</p>
              {study.function && (
                <>
                  <h4>Function</h4>
                  <p>{study.function}</p>
                </>
              )}
              {study.location && (
                <>
                  <h4>Location</h4>
                  <p>{study.location}</p>
                </>
              )}
              <div className="a2d-actions">
                <button onClick={() => on3D(model.id)}>Open in 3D</button>
                <button onClick={() => setHidden((h) => [...h, model.id])}>Hide</button>
                <button onClick={onTissue}>Tissue view</button>
              </div>
            </article>
          ) : (
            <p className="a2d-empty">
              Select a structure on the plate to see its name, function and
              location. Use the layer chips above to peel from skin to bone.
            </p>
          )}
          {!!hidden.length && (
            <button className="a2d-restore" onClick={() => setHidden([])}>
              Restore {hidden.length} hidden
            </button>
          )}
          <p className="a2d-note">
            Rendered from the bundled Z-Anatomy source model. It is a
            flat projection, not a separate illustration, so it matches the 3D
            viewer exactly.
          </p>
        </aside>
      </div>
    </section>
  );
}
