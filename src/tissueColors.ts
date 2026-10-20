// One tissue palette shared by the 3D scene, game legend, checklists and badges so
// bone, muscle, ligament, tendon and cartilage never blur together.
export const tissuePalette: Record<string, { color: string; label: string }> = {
  bones: { color: "#ece1c8", label: "Bone" },
  muscles: { color: "#cf4a3f", label: "Muscle" },
  tendons: { color: "#f2c14e", label: "Tendon" },
  ligaments: { color: "#18b3a0", label: "Ligament" },
  cartilage: { color: "#4f9fe8", label: "Cartilage" },
  fascia: { color: "#c9b99c", label: "Fascia" },
  capsules: { color: "#a58bd6", label: "Joint capsule" },
  bursae: { color: "#7cc4f0", label: "Bursa" },
  organs: { color: "#b78373", label: "Organ / vessel / nerve" },
};
export const tissueColor = (layer?: string) =>
  (tissuePalette[layer || "organs"] || tissuePalette.organs).color;
