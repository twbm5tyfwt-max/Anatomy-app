import { structures, tissues } from "./content";
import { frontMuscles } from "./atlas";
export type CourseCard = {
  id: string;
  term: string;
  definition: string;
  file: string;
  page: number;
};
export type Question = {
  id: string;
  topic: string;
  prompt: string;
  answer: string;
  aliases: string[];
  explanation: string;
  source: string;
  options: string[];
  format: "choice" | "typed" | "image" | "click";
  structureId?: string;
  tissueId?: string;
};
export type QuizScope = {
  system: string;
  region: string;
  tissue: string;
  structure: string;
  count: number;
  format: string;
  difficulty: string;
  course: boolean;
  missedOnly: boolean;
  includeSystems?: string[];
  includeTissues?: string[];
};
export function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
function options(answer: string, all: string[]) {
  return shuffle([
    answer,
    ...shuffle([...new Set(all.filter((x) => x !== answer))]).slice(0, 3),
  ]);
}
export function createQuestions(
  scope: QuizScope,
  cards: CourseCard[] = [],
  missed: string[] = [],
): Question[] {
  const qs: Question[] = [];
  if (scope.course) {
    cards.forEach((c) =>
      qs.push({
        id: `course-${c.id}`,
        topic: "My course",
        prompt: `According to ${c.file}, page / slide ${c.page}: ${c.definition}`,
        answer: c.term,
        aliases: [],
        explanation: c.definition,
        source: `${c.file} · page / slide ${c.page} · reviewed course card`,
        options: options(
          c.term,
          cards.map((x) => x.term),
        ),
        format: "typed",
      }),
    );
  } else {
    const ss = structures.filter(
      (s) =>
        ((!scope.system || s.system === scope.system) &&
          (!scope.region || s.region === scope.region) &&
          (!scope.structure || s.id === scope.structure) &&
          !scope.tissue) ||
        !!scope.includeSystems?.includes(s.system),
    );
    ss.forEach((s) => {
      const answer = s.name;
      const all = structures
        .filter((x) => x.system === s.system)
        .map((x) => x.name);
      qs.push({
        id: `${s.id}-function`,
        topic: s.system,
        prompt: `Identify the structure from this combination. Location: ${s.location} Function: ${s.function}`,
        answer,
        aliases: s.aliases,
        explanation: `${s.name}: ${s.location}`,
        source: s.source,
        options: options(answer, all),
        format: "choice",
      });
      if (scope.difficulty !== "Foundations" && s.origin) {
        for (const field of ["origin", "insertion", "innervation"] as const) {
          qs.push({
            id: `${s.id}-${field}`,
            topic: s.system,
            prompt: `Identify the muscle. Location: ${s.location} ${field[0].toUpperCase() + field.slice(1)}: ${s[field]}`,
            answer,
            aliases: s.aliases,
            explanation: `${s.name}. Action: ${s.actions}`,
            source: s.source,
            options: options(answer, all),
            format: "choice",
          });
        }
      }
      if (s.landmarks)
        qs.push({
          id: `${s.id}-landmarks`,
          topic: s.system,
          prompt: `Identify the bone from these landmarks: ${s.landmarks}`,
          answer,
          aliases: s.aliases,
          explanation: s.location,
          source: s.source,
          options: options(answer, all),
          format: "choice",
        });
      if (
        frontMuscles.some((a) => a.id === s.id) &&
        [
          "pectoralis-major",
          "deltoid",
          "biceps-brachii",
          "rectus-abdominis",
          "rectus-femoris",
          "tibialis-anterior",
        ].includes(s.id)
      )
        qs.push({
          id: `${s.id}-visual`,
          topic: s.system,
          prompt:
            scope.format === "click"
              ? `Select the ${s.name} on the anterior plate.`
              : "Identify the highlighted muscle on the anterior plate.",
          answer,
          aliases: s.aliases,
          explanation: `${s.name}: ${s.location}`,
          source: s.source,
          options: options(answer, all),
          format: scope.format === "click" ? "click" : "image",
          structureId: s.id,
        });
    });
    if (
      (!scope.system && !scope.region && !scope.structure) ||
      scope.tissue ||
      scope.includeTissues?.length
    ) {
      tissues
        .filter(
          (t) =>
            (!scope.system &&
              !scope.region &&
              !scope.structure &&
              !scope.tissue) ||
            scope.tissue === t.id ||
            scope.tissue === t.class ||
            !!scope.includeTissues?.includes(t.class),
        )
        .forEach((t) => {
          const names = tissues
            .filter((x) => x.class === t.class)
            .map((x) => x.name);
          qs.push({
            id: `tissue-${t.id}-location`,
            topic: t.class,
            prompt: `Which tissue is typically found here? ${t.location}`,
            answer: t.name,
            aliases: [`${t.name} epithelium`, `${t.name} tissue`],
            explanation: t.function,
            source: "OpenStax Anatomy and Physiology 2e, chapter 4",
            options: options(t.name, names),
            format: "choice",
          });
          qs.push({
            id: `tissue-${t.id}-function`,
            topic: t.class,
            prompt: `Identify the tissue from this combination. Function: ${t.function} Identification clue: ${t.clues}`,
            answer: t.name,
            aliases: [`${t.name} epithelium`, `${t.name} tissue`],
            explanation: t.clues,
            source: "OpenStax Anatomy and Physiology 2e, chapter 4",
            options: options(t.name, names),
            format: "choice",
          });
          if (
            ![
              "glia",
              "reticular",
              "areolar",
              "dense-irregular",
              "elastic",
            ].includes(t.id)
          )
            qs.push({
              id: `tissue-${t.id}-identify`,
              topic: t.class,
              prompt: "Identify the tissue in this educational illustration.",
              answer: t.name,
              aliases: [`${t.name} epithelium`, `${t.name} tissue`],
              explanation: t.clues,
              source:
                "OpenStax Anatomy and Physiology 2e, chapter 4; original educational schematic",
              options: options(t.name, names),
              format: "image",
              tissueId: t.id,
            });
        });
    }
  }
  if (
    scope.missedOnly &&
    !scope.course &&
    !scope.system &&
    !scope.region &&
    !scope.tissue &&
    !scope.structure
  ) {
    qs.push(
      ...createQuestions(
        { ...scope, course: true, count: 1000 },
        cards,
        missed,
      ),
    );
  }
  let selected = qs.filter((q) => !scope.missedOnly || missed.includes(q.id));
  if (scope.course) return shuffle(selected).slice(0, scope.count);
  if (scope.format === "image")
    selected = selected.filter((q) => q.format === "image");
  else if (scope.format === "click")
    selected = selected.filter((q) => q.format === "click");
  else if (scope.format === "choice")
    selected = selected.filter((q) => q.format === "choice");
  else if (scope.format === "typed")
    selected = selected
      .filter((q) => q.format === "choice")
      .map((q) => ({ ...q, format: "typed" as const }));
  const unique = new Set<string>();
  return shuffle(selected)
    .filter((q) => {
      if (unique.has(q.id)) return false;
      unique.add(q.id);
      return true;
    })
    .slice(0, scope.count)
    .map((q, i) =>
      scope.format === "mixed" && q.format === "choice" && i % 4 === 1
        ? { ...q, format: "typed" as const }
        : q,
    );
}
export function normalize(s: string) {
  const raw = s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return (
    raw
      .replace(/\b(the|muscle|tissue|epithelium)\b/g, "")
      .replace(/\s+/g, " ")
      .trim() || raw
  );
}
export function distance(a: string, b: string) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [
    i,
    ...Array(b.length).fill(0),
  ]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      d[i][j] = Math.min(
        d[i - 1][j] + 1,
        d[i][j - 1] + 1,
        d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
  return d[a.length][b.length];
}
export function isCorrect(value: string, q: Question) {
  const v = normalize(value);
  if (!v) return false;
  const accepted = [q.answer, ...q.aliases].map(normalize);
  if (accepted.includes(v)) return true;
  // Never turn another valid anatomical name into a correct answer via fuzzy matching.
  const known = [
    ...structures.flatMap((s) => [s.name, ...s.aliases]),
    ...tissues.map((t) => t.name),
  ].map(normalize);
  if (known.includes(v)) return false;
  const qualifiers = [
    "major",
    "minor",
    "anterior",
    "posterior",
    "superior",
    "inferior",
    "medial",
    "lateral",
    "superficial",
    "deep",
    "right",
    "left",
    "simple",
    "stratified",
    "pseudostratified",
    "keratinized",
    "nonkeratinized",
    "regular",
    "irregular",
    "flexor",
    "extensor",
  ];
  return accepted.some(
    (a) =>
      !v
        .split(" ")
        .some(
          (token) =>
            qualifiers.includes(token) && !a.split(" ").includes(token),
        ) &&
      a.length >= 6 &&
      v.split(" ").length === a.split(" ").length &&
      distance(v, a) <= (a.length >= 14 ? 2 : 1),
  );
}
export type Result = {
  id: string;
  date: string;
  questions: Question[];
  answers: Record<string, string>;
  score: number;
  mode: string;
};
