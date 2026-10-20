import type { CameraState } from "./AnatomyScene";
export type AtlasState = {
  selected: string | null;
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
    return s && Array.isArray(s.hidden) && s.layers ? s : undefined;
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
