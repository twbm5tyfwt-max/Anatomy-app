import { describe, it, expect } from "vitest";
import { modelParts } from "./modelCatalog";
import {
  displayGroup,
  displayName,
  parentModel,
  muscleColor,
} from "./modelDisplay";
const find = (name: string) =>
  modelParts.find((m) => m.name === name && !m.parentId)!;
describe("whole structures and source tissue regions", () => {
  it("keeps pectoralis major's three source regions together on the correct side", () => {
    for (const side of ["right", "left"]) {
      const part = modelParts.find(
        (m) =>
          m.layer === "muscles" &&
          new RegExp(`clavicular.*${side} pectoralis major`, "i").test(m.name),
      )!;
      const group = displayGroup(part);
      const primary = group.filter((m) => !m.parentId);
      expect(primary).toHaveLength(3);
      expect(primary.some((m) => /abdominal/i.test(m.name))).toBe(true);
      expect(primary.some((m) => /sternocostal/i.test(m.name))).toBe(true);
      expect(group.every((m) => m.name.toLowerCase().includes(side))).toBe(
        true,
      );
      expect(displayName(part).toLowerCase()).toBe(`${side} pectoralis major`);
    }
  });
  it("includes modeled tendon regions with their parent muscle without merging sides", () => {
    const group = displayGroup(find("Long head of right biceps brachii"));
    expect(group.filter((m) => !m.parentId)).toHaveLength(2);
    expect(group.some((m) => m.layer === "tendons")).toBe(true);
    expect(group.every((m) => !m.name.toLowerCase().includes("left"))).toBe(
      true,
    );
  });
  it("keeps articular surface regions associated with their bone", () => {
    const humerus = find("Right humerus"),
      surface = modelParts.find(
        (m) => m.parentId === humerus.id && m.layer === "cartilage",
      )!;
    expect(displayGroup(humerus)).toContain(surface);
    expect(parentModel(surface).id).toBe(humerus.id);
  });
  it("preserves customizable muscle colors while retaining tendon distinction", () => {
    const part = find("Long head of right biceps brachii"),
      tendon = modelParts.find(
        (m) => m.parentId === part.id && m.layer === "tendons",
      )!;
    expect(muscleColor(part, "#b76a87", false).getHexString()).toBe("b76a87");
    expect(muscleColor(tendon, "#b76a87", false).getHexString()).not.toBe(
      "b76a87",
    );
  });
});
