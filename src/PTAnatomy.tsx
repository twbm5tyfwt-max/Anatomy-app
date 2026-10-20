import { AnatomyScene, defaultLayers } from "./AnatomyScene";
import { modelParts } from "./modelCatalog";
import { defaultAppearance } from "./Appearance";
const names: Record<string, string[]> = {
  Knee: [
    "Right femur",
    "Right tibia",
    "Right fibula",
    "Right patella",
    "Right medial meniscus",
    "Right lateral meniscus",
    "Right anterior cruciate ligament",
    "Right posterior cruciate ligament",
  ],
  Shoulder: [
    "Right humerus",
    "Right scapula",
    "Right clavicle",
    "Right supraspinatus",
    "Right infraspinatus",
    "Right subscapularis",
  ],
  Ankle: [
    "Right talus",
    "Right calcaneus",
    "Right tibia",
    "Right fibula",
    "Right anterior talofibular ligament",
    "Right calcaneofibular ligament",
  ],
  Spine: [
    "Third lumbar vertebra",
    "Fourth lumbar vertebra",
    "Intervertebral disc L3-L4",
  ],
};
export function PTAnatomy({
  region,
  onSelect,
}: {
  region: string;
  onSelect: (id: string) => void;
}) {
  const parts = modelParts.filter(
    (m) => !m.parentId && names[region]?.includes(m.name),
  );
  const ids = parts.map((m) => m.id);
  const frame =
    region === "Knee"
      ? parts.filter((m) => /patella|meniscus/.test(m.name)).map((m) => m.id)
      : ids;
  return (
    <section className="pt-anatomy-card">
      <div className="pt-anatomy-preview">
        <AnatomyScene
          key={region}
          onlyIds={ids}
          appearance={defaultAppearance}
          visible={[...new Set(parts.map((m) => m.system))]}
          selected={[]}
          hidden={[]}
          isolated={ids}
          layers={defaultLayers}
          onSelect={(id) => {
            if (id) onSelect(id);
          }}
          onReady={(api) => api.frame(frame.length ? frame : ids, "front", 0)}
        />
      </div>
      <div>
        <p className="eyebrow">START WITH THE STRUCTURE</p>
        <h2>{region} anatomy</h2>
        <p>
          Rotate the reference, or choose a structure to open its full anatomy
          and tissue notes.
        </p>
        <div className="pt-structure-links">
          {parts.map((m) => (
            <button key={m.id} onClick={() => onSelect(m.id)}>
              {m.name}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
