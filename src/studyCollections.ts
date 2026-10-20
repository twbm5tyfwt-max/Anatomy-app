import { getModelStudy, modelParts } from "./modelCatalog";
export type Reference = {
  file: string;
  page: number;
  text: string;
  kind: "page" | "slide" | "note" | "image";
  fileId?: string;
  extraction?: string;
  confidence?: number;
};
export type StudyCollection = {
  id: string;
  name: string;
  ids: string[];
  references: Reference[];
  created: string;
};
export type Match = {
  term: string;
  ids: string[];
  exact: boolean;
  references: Reference[];
};
export const normalized = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
export function matchNotes(refs: Reference[]) {
  const found: Match[] = [];
  const missing: Reference[] = [];
  const dictionary = new Map<string, string[]>();
  for (const m of modelParts.filter(
    (m) => !m.parentId && m.layer !== "attachment",
  )) {
    const term = normalized(m.name);
    const alias = term
      .replace(/^(left|right) /, "")
      .replace("abdominal oblique", "oblique");
    const family = term
      .replace(/^.*?(?:head|part|belly) of /, "")
      .replace(/^(left|right) /, "")
      .replace("abdominal oblique", "oblique");
    for (const key of new Set([
      term,
      term.replace("abdominal oblique", "oblique"),
      alias,
      ...(m.layer === "muscles" ? [family] : []),
    ]))
      dictionary.set(key, [...(dictionary.get(key) || []), m.id]);
  }
  for (const r of refs) {
    const text = " " + normalized(r.text) + " ";
    let matched = false;
    const accepted: string[] = [];
    for (const [term, ids] of [...dictionary].sort(
      (a, b) => b[0].length - a[0].length,
    )) {
      if (
        term.length < 4 ||
        !text.includes(" " + term + " ") ||
        accepted.some((full) => (" " + full + " ").includes(" " + term + " "))
      )
        continue;
      accepted.push(term);
      matched = true;
      let row = found.find((x) => x.term === term);
      const exact =
        ids.length === 1 &&
        normalized(modelParts.find((m) => m.id === ids[0])!.name) === term;
      if (!row) {
        row = { term, ids: [...new Set(ids)], exact, references: [] };
        found.push(row);
      }
      row.references.push(r);
    }
    if (
      !matched ||
      /alveol|bronchiole|uterus|ovar|vagina|female model/i.test(r.text)
    )
      missing.push(r);
  }
  return {
    matches: found.sort((a, b) => a.term.localeCompare(b.term)),
    unmatched: missing,
  };
}
export function collectionFacts(ids: string[]) {
  const allowed = new Set(ids);
  return modelParts
    .filter((m) => allowed.has(m.id) && !m.parentId && m.layer !== "attachment")
    .map((m) => ({ model: m, study: getModelStudy(m) }));
}
