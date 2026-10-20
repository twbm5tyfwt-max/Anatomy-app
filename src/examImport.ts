import type { Question } from "./quiz";

export type ParsedQuestion = {
  prompt: string;
  options: string[];
  /** index into options, or -1 when the answer is unknown */
  correct: number;
  /** answer text for questions without choices */
  typedAnswer?: string;
  explanation: string;
  /** things the learner should look at before trusting this question */
  flags: string[];
};

export type PracticeExam = {
  id: string;
  name: string;
  created: string;
  source: string;
  questions: ParsedQuestion[];
};

const LETTERS = "ABCDEFGH";
const startRe = /^\s*(?:Q(?:uestion)?\.?\s*)?(\d{1,3})\s*[.)\]:]\s+(?=\S)/i;
const optionRe = /^\s*[(\[]?([A-Ha-h])[.)\]:]\s+(?=\S)/;
const answerRe =
  /^\s*(?:correct\s+answer|answer|ans|key)\s*(?:is)?\s*[:=\-]?\s*[(\[]?([A-Ha-h])\b[)\].]?\s*(.*)$/i;
const typedAnswerRe = /^\s*(?:correct\s+answer|answer|ans)\s*[:=\-]\s*(.+)$/i;
const explainRe = /^\s*(?:explanation|rationale|why)\s*[:\-]\s*(.*)$/i;

/** Pull inline "A. x  B. y  C. z" onto separate lines. */
function splitInlineOptions(line: string) {
  if (!/\bA[.)]\s.+\sB[.)]\s/.test(line)) return [line];
  return line.split(/\s+(?=[B-H][.)]\s)/);
}

/**
 * Parse pasted or OCR'd practice-exam text. It understands numbered questions, lettered
 * options (A. / A) / (A)), "Answer: B" lines, a trailing answer key ("1. B  2. D…") and
 * short-answer questions. Anything uncertain is flagged for the learner, never guessed.
 */
export function parseExam(raw: string): ParsedQuestion[] {
  const lines = raw
    .replace(/\r/g, "")
    .split("\n")
    .flatMap((l) => splitInlineOptions(l));
  // Everything after an "answer key" heading is key material, not question text.
  const keyAt = lines.findIndex((l) => /^\s*(answer\s*key|answers)\s*:?\s*$/i.test(l));
  const body = keyAt >= 0 ? lines.slice(0, keyAt) : lines;
  const keyText = keyAt >= 0 ? lines.slice(keyAt + 1).join(" ") : "";

  type Draft = {
    number: number;
    stem: string[];
    options: string[];
    answerLetter?: string;
    typed?: string;
    explanation: string[];
    mode: "stem" | "option" | "explain";
  };
  const drafts: Draft[] = [];
  let cur: Draft | null = null;
  for (const line of body) {
    const text = line.trim();
    if (!text) continue;
    const s = startRe.exec(line);
    // "2. B" style key lines at the very end are handled below, so require real text.
    if (s && !(cur && cur.options.length === 0 && /^[A-H]$/i.test(text.slice(s[0].length).trim()))) {
      cur = {
        number: +s[1],
        stem: [line.replace(startRe, "").trim()],
        options: [],
        explanation: [],
        mode: "stem",
      };
      drafts.push(cur);
      continue;
    }
    if (!cur) continue;
    const starKey = /^\*\s*([A-Ha-h])\s*$/.exec(text);
    if (starKey) {
      cur.answerLetter = starKey[1].toUpperCase();
      continue;
    }
    const ex = explainRe.exec(text);
    if (ex) {
      cur.explanation.push(ex[1]);
      cur.mode = "explain";
      continue;
    }
    const a = answerRe.exec(text);
    if (a && (cur.options.length > 0 || a[2] === "" || /^[)\].]/.test(text))) {
      cur.answerLetter = a[1].toUpperCase();
      continue;
    }
    const t = typedAnswerRe.exec(text);
    if (t && cur.options.length === 0) {
      cur.typed = t[1].trim();
      continue;
    }
    const o = optionRe.exec(line);
    if (o) {
      let value = text.slice(text.indexOf(o[0].trim()) + o[0].trim().length).trim();
      // A trailing marker shows the correct choice: "* B. x", "B. x (correct)", "B. x ✓"
      const marked = /(\*|\(correct\)|✓|✔)\s*$/i.test(value) || /^\*/.test(text);
      value = value.replace(/\s*(\*|\(correct\)|✓|✔)\s*$/i, "");
      cur.options.push(value);
      cur.mode = "option";
      if (marked) cur.answerLetter = LETTERS[cur.options.length - 1];
      continue;
    }
    if (cur.mode === "stem") cur.stem.push(text);
    else if (cur.mode === "option")
      cur.options[cur.options.length - 1] += " " + text;
    else cur.explanation.push(text);
  }

  // Answer key: "1. B 2. D" or "1-B, 2-D" or "1) B".
  const key = new Map<number, string>();
  const keySource =
    keyText ||
    // a run of bare "n. L" lines at the end of the document
    body
      .slice(-80)
      .filter((l) => /^\s*\d{1,3}\s*[.)\-:]\s*[A-Ha-h]\s*$/.test(l))
      .join(" ");
  for (const m of keySource.matchAll(/(\d{1,3})\s*[.)\-:]?\s*\(?([A-Ha-h])\)?(?=\s|,|;|$)/g))
    key.set(+m[1], m[2].toUpperCase());

  return drafts.map((d) => {
    const flags: string[] = [];
    let letter = d.answerLetter || key.get(d.number);
    const options = d.options.filter(Boolean);
    let correct = letter ? LETTERS.indexOf(letter) : -1;
    if (options.length && (correct < 0 || correct >= options.length)) {
      if (letter) flags.push(`Answer “${letter}” has no matching option.`);
      correct = -1;
    }
    if (options.length && correct < 0)
      flags.push("No correct answer found. Choose it before saving.");
    if (options.length === 1) flags.push("Only one answer option was found.");
    if (!options.length && !d.typed)
      flags.push("No options or answer found. Add them or delete the question.");
    const prompt = d.stem.join(" ").replace(/\s+/g, " ").trim();
    if (prompt.length < 8) flags.push("The question text looks very short.");
    return {
      prompt,
      options,
      correct,
      typedAnswer: options.length ? undefined : d.typed,
      explanation: d.explanation.join(" ").trim(),
      flags,
    };
  });
}

export function examToQuestions(exam: PracticeExam): Question[] {
  return exam.questions
    .filter(
      (q) =>
        q.prompt &&
        (q.options.length ? q.correct >= 0 : !!q.typedAnswer),
    )
    .map((q, i) => {
      const answer = q.options.length ? q.options[q.correct] : q.typedAnswer!;
      return {
        id: `exam-${exam.id}-${i}`,
        topic: exam.name,
        prompt: q.prompt,
        answer,
        aliases: [],
        explanation:
          q.explanation ||
          `Correct answer: ${answer}. This question comes from your own practice exam “${exam.name}”.`,
        source: `Your practice exam: ${exam.source}`,
        options: q.options,
        format: q.options.length ? ("choice" as const) : ("typed" as const),
      };
    });
}

const KEY = "forma-exams-v1";
export function loadExams(): PracticeExam[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}
export function saveExams(exams: PracticeExam[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(exams));
  } catch {
    window.dispatchEvent(new CustomEvent("forma-storage-error"));
  }
}
