export type PickCandidate = { id: string; opacity: number; distance: number };
/** Near-transparent surfaces (<45%) allow a deeper, opaque structure to win.
 * All visible intersections remain available in the overlap chooser. */
export function orderPicks(hits: PickCandidate[]) {
  const seen = new Set<string>();
  const sorted = [...hits]
    .filter((h) => h.opacity > 0.05)
    .sort((a, b) => a.distance - b.distance)
    .filter((h) => !seen.has(h.id) && !!seen.add(h.id));
  const primary = sorted.find((h) => h.opacity >= 0.45) || sorted[0];
  return primary ? [primary, ...sorted.filter((h) => h.id !== primary.id)] : [];
}
