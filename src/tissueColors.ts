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
  isColourBlind()
    ? colourBlind[layer || "organs"] || colourBlind.organs
    : (tissuePalette[layer || "organs"] || tissuePalette.organs).color;

/** Okabe–Ito based palette, safe for the common kinds of colour-blindness. */
const colourBlind: Record<string, string> = {
  bones: "#e9e2d0",
  muscles: "#d55e00",
  tendons: "#f0e442",
  ligaments: "#009e73",
  cartilage: "#0072b2",
  fascia: "#999999",
  capsules: "#cc79a7",
  bursae: "#56b4e9",
  organs: "#a6761d",
};
export const isColourBlind = () =>
  typeof document !== "undefined" && document.documentElement.dataset.cb === "1";
export const setColourBlind = (on: boolean) => {
  if (typeof document !== "undefined") document.documentElement.dataset.cb = on ? "1" : "0";
};
