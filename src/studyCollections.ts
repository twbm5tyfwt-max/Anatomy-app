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
  /** Shorthand or group name expanded to several structures, e.g. "quads" or "rotator cuff". */
  alias?: string;
  /** Likely OCR misspelling of a source name; always needs the learner's confirmation. */
  fuzzy?: boolean;
  references: Reference[];
};

// Study shorthand → substrings of source structure names. Expanded matches are never
// pre-confirmed because the learner may mean only some of them.
export const studyAliases: Record<string, { label: string; names: RegExp }> = {
  scm: { label: "sternocleidomastoid", names: /sternocleidomastoid/ },
  pecs: { label: "pectoralis major", names: /pectoralis major/ },
  "pec major": { label: "pectoralis major", names: /pectoralis major/ },
  "pec minor": { label: "pectoralis minor", names: /pectoralis minor/ },
  quads: { label: "quadriceps", names: /rectus femoris|vastus/ },
  quadriceps: { label: "quadriceps", names: /rectus femoris|vastus/ },
  hamstrings: { label: "hamstrings", names: /semitendinosus|semimembranosus|biceps femoris/ },
  glutes: { label: "gluteal muscles", names: /gluteus/ },
  lats: { label: "latissimus dorsi", names: /latissimus dorsi/ },
  traps: { label: "trapezius", names: /trapezius/ },
  abs: { label: "abdominal wall", names: /rectus abdominis|oblique|transversus abdominis/ },
  delts: { label: "deltoid", names: /deltoid/ },
  calf: { label: "calf muscles", names: /gastrocnemius|soleus/ },
  "rotator cuff": { label: "rotator cuff", names: /supraspinatus|infraspinatus|teres minor|subscapularis/ },
  "muscles of mastication": { label: "muscles of mastication", names: /masseter|temporalis|pterygoid/ },
  acl: { label: "anterior cruciate ligament", names: /anterior cruciate ligament/ },
  pcl: { label: "posterior cruciate ligament", names: /posterior cruciate ligament/ },
  mcl: { label: "tibial (medial) collateral ligament", names: /tibial collateral ligament/ },
  lcl: { label: "fibular (lateral) collateral ligament", names: /fibular collateral ligament/ },
  menisci: { label: "menisci", names: /meniscus$/ },
  "cruciate ligaments": { label: "cruciate ligaments", names: /cruciate ligament/ },
  "collateral ligaments": { label: "collateral ligaments", names: /collateral ligament/ },
  "achilles tendon": { label: "calcaneal (Achilles) tendon", names: /calcaneal tendon/ },
  achilles: { label: "calcaneal (Achilles) tendon", names: /calcaneal tendon/ },
  "it band": { label: "iliotibial tract", names: /iliotibial/ },
};

function editDistance(a: string, b: string, limit: number) {
  if (Math.abs(a.length - b.length) > limit) return limit + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let best = i;
    for (let j = 1; j <= b.length; j++) {
      const v = Math.min(
        prev[j] + 1,
        cur[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      cur[j] = v;
      if (v < best) best = v;
    }
    if (best > limit) return limit + 1;
    prev = cur;
  }
  return prev[b.length];
}
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
    // Shorthand and group names (quads, ACL, rotator cuff…).
    for (const [key, alias] of Object.entries(studyAliases)) {
      if (!text.includes(" " + key + " ")) continue;
      const ids = [
        ...new Set(
          modelParts
            .filter(
              (m) =>
                !m.parentId &&
                ["muscles", "ligaments", "tendons", "cartilage", "bones"].includes(
                  m.layer || "",
                ) &&
                alias.names.test(normalized(m.name)),
            )
            .map((m) => m.id),
        ),
      ];
      if (!ids.length || accepted.some((a) => a.includes(key))) continue;
      matched = true;
      let row = found.find((x) => x.term === key);
      if (!row) {
        row = { term: key, ids, exact: false, alias: alias.label, references: [] };
        found.push(row);
      }
      row.references.push(r);
    }
    // OCR slips ("sternocleidomastoid" → "stemocleidomastoid"): compare same-length word runs.
    if (r.kind === "image" || r.extraction) {
      const words = normalized(r.text).split(" ").filter(Boolean);
      for (const [term, ids] of dictionary) {
        if (term.length < 8 || found.some((x) => x.term === term)) continue;
        const n = term.split(" ").length,
          limit = term.length >= 14 ? 2 : 1;
        for (let i = 0; i + n <= words.length; i++) {
          const gram = words.slice(i, i + n).join(" ");
          if (gram[0] !== term[0] || gram === term) continue;
          if (editDistance(gram, term, limit) <= limit) {
            matched = true;
            found.push({
              term,
              ids: [...new Set(ids)],
              exact: false,
              fuzzy: true,
              references: [r],
            });
            break;
          }
        }
      }
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
