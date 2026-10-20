import { describe, it, expect } from "vitest";
import { modelParts } from "./modelCatalog";
import {
  componentName,
  displayGroup,
  displayName,
  isSurfaceMuscle,
  muscleColor,
} from "./modelDisplay";
const find = (name: string) => modelParts.find((m) => m.name === name)!;
describe("introductory anatomy display", () => {
  it("retains all three source pectoralis regions on each side as one muscle", () => {
    for (const side of ["right", "left"]) {
      const part = find(`Clavicular part of ${side} pectoralis major`);
      const group = displayGroup(part);
      expect(group.map(componentName).sort()).toEqual([
        "Abdominal part",
        "Clavicular part",
        "Sternocostal part",
      ]);
      expect(group.every(isSurfaceMuscle)).toBe(true);
      expect(group.every((m) => m.name.includes(side))).toBe(true);
      expect(displayName(part)).toBe(
        `${side[0].toUpperCase() + side.slice(1)} pectoralis major`,
      );
    }
  });
  it("keeps deep chest and abdominal muscles out of the introductory view", () => {
    for (const name of [
      "Right pectoralis minor",
      "Right internal oblique",
      "Right transversus abdominis",
      "Internal intercostal muscle",
    ])
      expect(isSurfaceMuscle(find(name))).toBe(false);
    expect(isSurfaceMuscle(find("Right rectus abdominis"))).toBe(true);
    expect(modelParts.filter((m) => m.system === "muscular")).toHaveLength(437);
  });
  it("groups muscle heads without merging sides, neighboring muscles, or bones", () => {
    expect(
      displayGroup(find("Long head of right biceps brachii")),
    ).toHaveLength(2);
    expect(displayGroup(find("Acromial part of left deltoid"))).toHaveLength(3);
    expect(displayGroup(find("Right humerus")).map((m) => m.name)).toEqual([
      "Right humerus",
    ]);
  });
  it("gives the three pectoralis regions distinct, reproducible colors", () => {
    const group = displayGroup(
      find("Clavicular part of right pectoralis major"),
    );
    const colors = group.map((m) =>
      muscleColor(m, "#c96875", true).getHexString(),
    );
    expect(new Set(colors).size).toBe(3);
    expect(colors).toEqual(
      group.map((m) => muscleColor(m, "#c96875", true).getHexString()),
    );
    expect(
      new Set(group.map((m) => muscleColor(m, "#c96875", false).getHexString()))
        .size,
    ).toBe(1);
  });
  it("retains bilateral palette consistency and distinguishes tendon from muscle", () => {
    expect(
      muscleColor(
        find("Clavicular part of right pectoralis major"),
        "#b76a87",
        true,
      ).getHexString(),
    ).toBe(
      muscleColor(
        find("Clavicular part of left pectoralis major"),
        "#b76a87",
        true,
      ).getHexString(),
    );
    expect(
      muscleColor(
        find("Right calcaneal tendon"),
        "#b76a87",
        true,
      ).getHexString(),
    ).not.toBe(
      muscleColor(find("Right soleus"), "#b76a87", true).getHexString(),
    );
  });
});
