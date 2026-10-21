import { describe, expect, it } from "vitest";
import { examToQuestions, parseExam, type PracticeExam } from "./examImport";

describe("practice exam parser", () => {
  it("parses numbered questions with lettered options and Answer lines", () => {
    const qs = parseExam(`1. Which bone forms the lower jaw?
A. Maxilla
B. Mandible
C. Zygomatic bone
D. Frontal bone
Answer: B
Explanation: The mandible is the only mobile skull bone.

2) The deltoid is innervated by the:
a) axillary nerve
b) radial nerve
c) musculocutaneous nerve
Answer: A`);
    expect(qs).toHaveLength(2);
    expect(qs[0].options).toEqual(["Maxilla", "Mandible", "Zygomatic bone", "Frontal bone"]);
    expect(qs[0].correct).toBe(1);
    expect(qs[0].explanation).toMatch(/only mobile/);
    expect(qs[1].correct).toBe(0);
    expect(qs.every((q) => q.flags.length === 0)).toBe(true);
  });
  it("uses a trailing answer key and flags questions without one", () => {
    const qs = parseExam(`1. First question text here?
A. one
B. two
2. Second question text here?
A. one
B. two
3. Third question text here?
A. one
B. two

Answer Key
1. B  2. A`);
    expect(qs.map((q) => q.correct)).toEqual([1, 0, -1]);
    expect(qs[2].flags.join(" ")).toMatch(/No correct answer/);
  });
  it("handles inline options, wrapped lines and star markers", () => {
    const qs = parseExam(`1. Name the structure that
spans the knee joint on the inner side?
A. ACL B. MCL C. LCL D. PCL
*B`);
    expect(qs[0].prompt).toMatch(/spans the knee joint/);
    expect(qs[0].options).toEqual(["ACL", "MCL", "LCL", "PCL"]);
    const star = parseExam(`1. Which is a ligament of the knee?
A. Patellar tendon
B. Anterior cruciate *
C. Rectus femoris`);
    expect(star[0].correct).toBe(1);
  });
  it("makes short-answer questions typed and converts to quiz questions", () => {
    const qs = parseExam(`1. The largest bone of the thigh is the ______.
Answer: femur`);
    expect(qs[0].typedAnswer).toBe("femur");
    const exam: PracticeExam = { id: "t", name: "Test", created: "", source: "pasted", questions: qs };
    const out = examToQuestions(exam);
    expect(out[0].format).toBe("typed");
    expect(out[0].answer).toBe("femur");
  });
  it("never invents an answer: unanswered questions are excluded from the quiz", () => {
    const qs = parseExam(`1. Which one is right here?
A. one
B. two`);
    expect(qs[0].correct).toBe(-1);
    expect(examToQuestions({ id: "t", name: "T", created: "", source: "", questions: qs })).toHaveLength(0);
  });
});
