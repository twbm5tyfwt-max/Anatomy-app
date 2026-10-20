import { anatomyModels } from "./assetPaths";
import { PublishedPlate, plateFor } from "./PlateExplorer";
import { ReferenceDefinition } from "./ReferenceDefinition";
import { useMemo, useRef, useState } from "react";
import { AnatomyScene, type SceneApi, type CameraView } from "./AnatomyScene";
import {
  hraParts,
  hraRegions,
  hraRegionParts,
  hraNote,
  type HraPart,
} from "./hraCatalog";
import { getModelStudy, modelParts, type ModelPart } from "./modelCatalog";
import { viewNames, viewTips, associatedTissue } from "./atlasDomain";
import { boneNoteFor } from "./boneNotes";
import type { Appearance } from "./Appearance";

export function organRegion(m: ModelPart): string {
  const a = [m.name, ...m.ancestry].join(" ").toLowerCase();
  const entries: [RegExp, string][] = [
    [/heart|cardiac|mitral|tricuspid|aortic valve|pulmonary valve/, "Heart"],
    [/lung|bronch|trachea/, "Lungs"],
    [/kidney|renal/, "Kidneys"],
    [/liver|hepatic/, "Liver"],
    [/pancrea/, "Pancreas"],
    [/spleen|splenic/, "Spleen"],
    [/urinary bladder/, "Bladder"],
    [/larynx|laryngeal/, "Larynx"],
    [/eyeball|eye |retina|cornea|sclera/, "Eye"],
    [/brain|cerebr|cerebell|thalam/, "Brain"],
    [/ovary|ovarian|uterus|uterine|vagina/, "Female pelvis"],
    [/mammary|breast/, "Breast"],
    [/lymph.*node/, "Lymph node"],
    [/colon|intestine|rectum|duodenum|jejunum|ileum/, "Intestines"],
  ];
  return entries.find(([r]) => r.test(a))?.[1] || m.name;
}
const extraRegions = [
  "Liver",
  "Pancreas",
  "Spleen",
  "Bladder",
  "Larynx",
  "Eye",
  "Brain",
  "Intestines",
];
export function organParts(region: string) {
  if (!extraRegions.includes(region)) return hraRegionParts(region);
  const match: Record<string, RegExp> = {
    Liver: /liver|biliary|gallbladder/,
    Pancreas: /pancreas|pancreatic/,
    Spleen: /spleen/,
    Bladder: /urinary bladder/,
    Larynx: /larynx|laryngeal|cricoid|arytenoid|thyroid cartilage/,
    Eye: /eyes|nerves of eye|muscles of eye/,
    Brain: /allen brain/,
    Intestines: /colon|small intestine|duodenum|jejunum|ileum|rectum/,
  };
  return hraParts.filter(
    (m) =>
      !m.pregnancy && match[region].test(m.ancestry.join(" ").toLowerCase()),
  );
}
const allRegions = [...hraRegions, ...extraRegions];
export function HraExplorer({
  appearance,
  initialRegion = "Body",
  onMale,
  onTissue,
  fallbackPart,
  organOnly = false,
}: {
  appearance: Appearance;
  initialRegion?: string;
  onMale: () => void;
  onTissue?: (id: string, alveoli?: boolean) => void;
  fallbackPart?: ModelPart;
  organOnly?: boolean;
}) {
  const initial = allRegions.includes(initialRegion)
    ? initialRegion
    : fallbackPart
      ? initialRegion
      : "Body";
  const [region, setRegion] = useState(initial);
  const [selected, setSelected] = useState("");
  const [isolated, setIsolated] = useState<string[] | null>(null);
  const [hidden, setHidden] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [labels, setLabels] = useState(false);
  const [sectionView, setSectionView] = useState(false);
  const [hover, setHover] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<string[]>([]);
  const [background, setBackground] = useState<
    "graphite" | "ivory" | "midnight"
  >("graphite");
  const [view, setView] = useState<CameraView>("front");
  const [systems, setSystems] = useState<string[] | null>(null);
  const [stages, setStages] = useState<string[]>([]);
  const [revealed, setRevealed] = useState<string[]>([]);
  const [bodySkin, setBodySkin] = useState(false);
  const [lungScope, setLungScope] = useState("");
  const api = useRef<SceneApi | null>(null);
  const regionData = useMemo(() => organParts(region), [region]);
  const fallback = !!fallbackPart && !allRegions.includes(region);
  const catalog = fallback ? modelParts : hraParts;
  const parts: ModelPart[] = fallback
    ? modelParts.filter(
        (m) => m.id === fallbackPart!.id || m.parentId === fallbackPart!.id,
      )
    : regionData;
  const ids = parts.map((m) => m.id),
    chosen = catalog.find((m) => m.id === selected);
  const availableSystems = [...new Set(parts.map((m) => m.system))];
  const shownSystems = systems || availableSystems;
  const bodySkinHidden =
    region === "Body" && !bodySkin
      ? parts.filter((m) => m.layer === "skin").map((m) => m.id)
      : [];
  const stageHidden = parts
    .filter((m) =>
      stages.some((stage) =>
        stage === "walls"
          ? /cardiac atrium|ventricle$/i.test(m.name)
          : stage === "capsule"
            ? /capsule/i.test(m.name)
            : stage === "lobes"
              ? m.ancestry.includes("Lungs")
              : stage === "cortex"
                ? /cortex|capsule/i.test(m.name)
                : false,
      ),
    )
    .map((m) => m.id);
  const hiddenIds = [
    ...hidden,
    ...stageHidden.filter((id) => !revealed.includes(id)),
    ...bodySkinHidden,
  ];
  const detail = chosen ? getModelStudy(chosen) : null;
  const note = chosen && !fallback ? hraNote(chosen as HraPart) : undefined;
  const frameIds = (name: string, rows: ModelPart[]) =>
    (name === "Heart"
      ? rows.filter((m) =>
          /septum|cardiac atrium|ventricle$|valve|papillary/i.test(m.name),
        )
      : rows
    ).map((m) => m.id);
  function openTissue(id: string, alveoli?: boolean) {
    const camera = api.current?.snapshot();
    if (camera) api.current?.restore(camera);
    onTissue?.(id, alveoli);
  }
  function pick(id: string) {
    setSelected(id);
    if (!id) return;
    setIsolated([id]);
    setHidden((h) => h.filter((x) => x !== id));
    setStages([]);
    api.current?.frame([id], view, 1800);
  }
  function restore() {
    setIsolated(null);
    setSelected("");
    setLungScope("");
    setHidden([]);
    setRevealed([]);
    setStages([]);
    setBodySkin(false);
    setSystems(null);
    setLabels(false);
    setCandidates([]);
    setSearch("");
    api.current?.frame(frameIds(region, parts), view, 1400);
  }
  function changeRegion(next: string) {
    setSectionView(false);
    setLungScope("");
    setRegion(next);
    setRevealed([]);
    setIsolated(null);
    setSelected("");
    setHidden([]);
    setSystems(null);
    setStages([]);
    setLabels(false);
    setCandidates([]);
    setSearch("");
    api.current?.frame(frameIds(next, organParts(next)), "front", 1400);
    setView("front");
  }
  function stage(key: string, checked: boolean) {
    setRevealed([]);
    setIsolated(null);
    setSelected("");
    setStages((v) => (checked ? [...v, key] : v.filter((x) => x !== key)));
    api.current?.frame(frameIds(region, parts), view, 1200);
  }
  const points = labels
    ? parts
        .filter(
          (m) =>
            !hiddenIds.includes(m.id) && (!isolated || isolated.includes(m.id)),
        )
        .slice(0, 20)
        .map((m) => ({
          id: m.id,
          modelId: m.id,
          name: m.name,
          anchor: m.bounds[0].map((v, i) => (v + m.bounds[1][i]) / 2),
        }))
    : [];
  return (
    <section
      className="reference-atlas"
      aria-label={organOnly ? "Organ dissection" : "Female reference atlas"}
    >
      <header className="reference-header">
        <div>
          <p className="eyebrow">
            {fallback
              ? "SOURCE ORGAN EXPLORER"
              : "HUMAN REFERENCE ATLAS · CC BY 4.0"}
          </p>
          <h2>
            {organOnly ? `${region} · dissection` : "Female reference anatomy"}
          </h2>
        </div>
        <button onClick={onMale}>
          {organOnly ? "Return to body" : "Male source anatomy"}
        </button>
      </header>
      {!organOnly && (
        <p className="reference-scope-note">
          Female organ-reference assembly: reproductive organs, organ
          substructures and body surface; selected bones and muscles only. Use
          the male source atlas for its broader musculoskeletal coverage.
        </p>
      )}
      {region === "Lymph node" && (
        <p className="reference-scope-note">
          Comparative lymph-node reference based on mouse Ce3D data (NIH). It
          illustrates conserved organization; it is not a scanned human node or
          a patient-specific location.
        </p>
      )}
      <div className="reference-toolbar">
        <label>
          Explore{" "}
          <select
            aria-label="Reference organ or region"
            value={region}
            onChange={(e) => changeRegion(e.target.value)}
          >
            {[...allRegions, ...(fallback ? [region] : [])].map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </label>
        {plateFor(region) && (
          <button
            aria-pressed={sectionView}
            onClick={() => setSectionView((v) => !v)}
          >
            {sectionView
              ? "Return to 3D dissection"
              : "Published section reference"}
          </button>
        )}
        <button onClick={restore}>
          Restore {region === "Body" ? "body" : "organ"}
        </button>
        <label>
          Background{" "}
          <select
            aria-label="Reference background"
            value={background}
            onChange={(e) => setBackground(e.target.value as typeof background)}
          >
            <option value="graphite">Graphite</option>
            <option value="ivory">Ivory</option>
            <option value="midnight">Midnight</option>
          </select>
        </label>
        <label>
          <input
            type="checkbox"
            checked={labels}
            onChange={(e) => setLabels(e.target.checked)}
          />
          Structure labels
        </label>
        {region === "Heart" && (
          <label>
            <input
              type="checkbox"
              checked={stages.includes("walls")}
              onChange={(e) => stage("walls", e.target.checked)}
            />
            Remove chamber walls
          </label>
        )}
        {region === "Body" && (
          <label>
            <input
              type="checkbox"
              checked={bodySkin}
              onChange={(e) => {
                setBodySkin(e.target.checked);
                setIsolated(null);
              }}
            />
            Body surface
          </label>
        )}
        {region === "Lungs" && (
          <label>
            Lung / lobe{" "}
            <select
              aria-label="Isolate lung or lobe"
              value={lungScope}
              onChange={(e) => {
                const key = e.target.value;
                setLungScope(key);
                const group = parts
                  .filter((m) => (key ? m.ancestry.includes(key) : true))
                  .map((m) => m.id);
                setSelected("");
                setIsolated(key ? group : null);
                setStages([]);
                api.current?.frame(group, view, 1600);
              }}
            >
              <option value="">Both lungs & airways</option>
              {[
                ["Left lungs left", "Left lung"],
                ["Lungs right", "Right lung"],
                ["L lung upper lobe", "Left superior lobe"],
                ["L lung lower lobe", "Left inferior lobe"],
                ["R lung upper lobe", "Right superior lobe"],
                ["R lung middle lobe", "Right middle lobe"],
                ["R lung lower lobe", "Right inferior lobe"],
              ].map(([value, name]) => (
                <option key={value} value={value}>
                  {name}
                </option>
              ))}
            </select>
          </label>
        )}
        {region === "Lungs" && (
          <label>
            <input
              type="checkbox"
              checked={stages.includes("lobes")}
              onChange={(e) => stage("lobes", e.target.checked)}
            />
            Reveal bronchial tree
          </label>
        )}
        {region === "Lymph node" && (
          <label>
            <input
              type="checkbox"
              checked={stages.includes("capsule")}
              onChange={(e) => stage("capsule", e.target.checked)}
            />
            Remove node capsule
          </label>
        )}
        {region === "Kidneys" && (
          <label>
            <input
              type="checkbox"
              checked={stages.includes("cortex")}
              onChange={(e) => stage("cortex", e.target.checked)}
            />
            Remove cortex / capsule
          </label>
        )}
        {region === "Heart" && (
          <button onClick={() => openTissue("cardiac-muscle")}>
            Prepared section & tissue
          </button>
        )}
        {region === "Lungs" && (
          <button onClick={() => openTissue("simple-squamous", true)}>
            Bronchioles → alveoli
          </button>
        )}
      </div>
      <div className="reference-layout">
        <div className="reference-stage">
          {sectionView && (
            <div className="organ-section-reference">
              <PublishedPlate region={region} />
            </div>
          )}
          <div hidden={sectionView} className="reference-canvas-wrap">
            <AnatomyScene
              key={fallback ? "source" : "hra"}
              catalog={catalog}
              assetUrl={fallback ? anatomyModels.atlas : anatomyModels.female}
              appearance={appearance}
              visible={shownSystems}
              selected={selected ? [selected] : []}
              hidden={hiddenIds}
              allowedIds={ids}
              isolated={isolated}
              layers={{
                bones: 1,
                muscles: 1,
                organs: 1,
                skin: 1,
                cartilage: 1,
                ligaments: 1,
                tendons: 1,
                fascia: 1,
                capsules: 1,
                bursae: 1,
              }}
              background={background}
              onSelect={pick}
              onHover={setHover}
              onCandidates={setCandidates}
              landmarks={points}
              labels={labels}
              onLandmark={pick}
              onReady={(v) => {
                api.current = v;
                v.frame(frameIds(region, parts), "front", 0);
              }}
            />
          </div>
          <div className="reference-status">
            {chosen?.name ||
              hover ||
              `${region} · ${parts.length} source components`}
            {isolated && (
              <button
                onClick={() => {
                  setIsolated(null);
                  setLungScope("");
                  api.current?.frame(frameIds(region, parts), view, 1400);
                }}
              >
                Back to {region === "Body" ? "body" : "organ"}
              </button>
            )}
          </div>
          <div className="reference-views">
            {(Object.keys(viewNames) as CameraView[]).map((v) => (
              <button
                key={v}
                title={viewTips[v]}
                aria-pressed={view === v}
                onClick={() => {
                  setView(v);
                  api.current?.view(v);
                }}
              >
                {viewNames[v]}
              </button>
            ))}
          </div>
          {!!candidates.length && (
            <details className="reference-overlap">
              <summary>Choose overlapping component</summary>
              {candidates.map((id) => (
                <button key={id} onClick={() => pick(id)}>
                  {catalog.find((m) => m.id === id)?.name}
                </button>
              ))}
            </details>
          )}
        </div>
        <aside className="reference-inspector">
          {chosen && (
            <div className="reference-detail">
              <p className="eyebrow">SELECTED COMPONENT</p>
              <h3>{chosen.name}</h3>
              <h4>What it does</h4>
              <p>{note?.[1] || detail?.function}</p>
              <ReferenceDefinition id={chosen.id} />
              <h4>Identify & compare</h4>
              <p>
                {note?.[2] ||
                  boneNoteFor(chosen.name)?.landmarks ||
                  detail?.features}
              </p>
              <p>
                <strong>Source context:</strong>{" "}
                {chosen.ancestry.slice(1, -1).join(" → ")}
              </p>
              <button
                onClick={() => {
                  setHidden((h) => [...h, chosen.id]);
                  setSelected("");
                  setIsolated(null);
                  api.current?.frame(frameIds(region, parts), view, 1400);
                }}
              >
                Hide selected component
              </button>
              <button onClick={() => openTissue(associatedTissue(chosen))}>
                Tissue & microscopic features
              </button>
            </div>
          )}
          <h3>Show / hide components</h3>
          <p>
            Click a name to isolate it with a slow close-up. Checkboxes reveal
            or remove parts in their source positions.
          </p>
          <input
            aria-label="Search organ components"
            placeholder="Search this model…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="reference-systems">
            {availableSystems.length > 1 &&
              availableSystems.map((s) => (
                <label key={s}>
                  <input
                    type="checkbox"
                    checked={shownSystems.includes(s)}
                    onChange={(e) => {
                      setIsolated(null);
                      setSystems(
                        e.target.checked
                          ? [...shownSystems, s]
                          : shownSystems.filter((x) => x !== s),
                      );
                    }}
                  />
                  {s}
                </label>
              ))}
          </div>
          <div className="reference-components">
            {parts
              .filter(
                (m) =>
                  !search ||
                  m.name.toLowerCase().includes(search.toLowerCase()),
              )
              .map((m) => (
                <div key={m.id}>
                  <input
                    type="checkbox"
                    aria-label={`Show ${m.name}`}
                    checked={!hiddenIds.includes(m.id)}
                    onChange={(e) => {
                      setIsolated(null);
                      if (m.layer === "skin") setBodySkin(e.target.checked);
                      if (e.target.checked) setRevealed((v) => [...v, m.id]);
                      else setRevealed((v) => v.filter((id) => id !== m.id));
                      setHidden((h) =>
                        e.target.checked
                          ? h.filter((x) => x !== m.id)
                          : [...h, m.id],
                      );
                      if (selected === m.id) setSelected("");
                    }}
                  />
                  <button onClick={() => pick(m.id)}>{m.name}</button>
                </div>
              ))}
          </div>
          <details className="reference-coverage">
            <summary>Source, anatomy & coverage</summary>
            <p>
              {fallback
                ? "Z-Anatomy source surfaces. This organ has no separately modeled interior in the bundled sources; removing its surface does not reveal a valid section."
                : "Kristen Browne and Heidi Schlehlein. 3D Reference Organ Set for Female, v1.5 (2023), Human Reference Atlas / HuBMAP. CC BY 4.0. Source mesh geometry retained; compression and illustrative colors adapted for this viewer."}
            </p>
            <p>
              Dissection removes named components; it does not create a new
              anatomical cross-section. Chamber walls, valves and septum are
              source components. Very fine structures, chordae and microanatomy
              are not complete.
            </p>
            {region === "Lymph node" && (
              <p>
                This is a reference node based on the NIH Ce3D method, using
                mouse data. It is a comparative teaching model, not a scanned
                human node at this location. Source: Li et al., PNAS 114(35),
                E7321; HRA lymph node reference, doi:10.48539/HBM463.LFHF.874.
              </p>
            )}
            {!fallback && (
              <>
                <p>
                  This is an organ-reference assembly, not a complete female
                  muscle/bone atlas. No male skeleton has been reshaped or
                  relabeled. Pregnancy reference parts are excluded from the
                  general body view. The source includes a sixth lumbar segment;
                  normal counts vary.
                </p>
                <a
                  href="https://doi.org/10.48539/HBM352.BTSQ.586"
                  target="_blank"
                  rel="noreferrer"
                >
                  Original dataset & credits
                </a>
              </>
            )}
            <p>
              Human anatomy explanations: OpenStax Anatomy and Physiology 2e,
              chapters 19, 21–23, 25 and 27; educational adaptations CC BY-NC-SA
              4.0.
            </p>
          </details>
        </aside>
      </div>
    </section>
  );
}
