// Z-Anatomy's shared display material named "Cartilage" is not a histology label.
// Correct these known connective/gelatinous structures without changing source geometry or IDs.
export function correctTissueMetadata(models) {
  const changes = [];
  for (const m of models) {
    const n = m.name.toLowerCase();
    let reason = "";
    if (m.system === "cardiovascular" && /leaflet/.test(n)) {
      reason =
        "Cardiac valve leaflets are fibrous connective tissue, not cartilage.";
    } else if (/falx cerebri|tentorium cerebelli/.test(n)) {
      reason =
        "Cranial dural folds are dense connective tissue, not cartilage or neurons.";
    } else if (/(?:superior|inferior) tarsus/.test(n)) {
      reason =
        "Eyelid tarsal plates are dense connective tissue, not cartilage or skeletal muscle.";
    } else if (/nucleus pulposus/.test(n)) {
      reason =
        "Gelatinous intervertebral-disc core, distinct from the surrounding fibrocartilaginous annulus.";
    }
    if (reason) {
      const before = m.layer;
      m.layer = "organs";
      changes.push({
        id: m.id,
        name: m.name,
        sourceMaterial: m.sourceMaterial,
        originalLayer: before,
        layer: m.layer,
        reason,
      });
    }
  }
  return changes;
}
