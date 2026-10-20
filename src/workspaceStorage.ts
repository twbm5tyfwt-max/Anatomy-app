import tissueCorrections from "./generated/tissue-corrections.json";
import type { CameraState } from "./AnatomyScene";
export type AtlasState = {
  selected: string | null;
  selectionScope?: "whole" | "component" | "tissue";
  hidden: string[];
  isolated: string[] | null;
  layers: Record<string, number>;
  camera?: CameraState;
  visible: string[];
};
export function readAtlasState(id: string): AtlasState | undefined {
  try {
    const s = JSON.parse(
      localStorage.getItem("forma-atlas-v2-" + id) || "null",
    );
    if (!s || !Array.isArray(s.hidden) || !s.layers) return undefined;
    const correction = tissueCorrections.find(
      (c) => c.id === s.selected && c.originalLayer === "cartilage",
    );
    if (correction && s.layers.cartilage > 0 && !s.hidden.includes(s.selected))
      s.layers = { ...s.layers, organs: Math.max(1, s.layers.organs || 0) };
    return s;
  } catch {
    return undefined;
  }
}
export function saveAtlasState(id: string, state: AtlasState) {
  try {
    localStorage.setItem("forma-atlas-v2-" + id, JSON.stringify(state));
  } catch {
    window.dispatchEvent(new CustomEvent("forma-storage-error"));
  }
}
