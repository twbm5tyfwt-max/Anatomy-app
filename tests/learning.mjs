import { chromium, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
const models = JSON.parse(
  readFileSync(new URL("../src/model-manifest.json", import.meta.url)),
).models;
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  headless: true,
  args: ["--no-sandbox"],
});
const page = await browser.newPage({ viewport: { width: 1500, height: 1100 } });
page.setDefaultTimeout(30000);
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const base = process.env.FORMA_BASE_URL || "http://127.0.0.1:3000";
const activeCanvas = () => page.locator(".three-canvas:visible");
let passed = 0;
async function run(name, fn) {
  console.log("RUN", name);
  await fn();
  console.log("PASS", name);
  passed++;
}
async function settled() {
  await page.waitForTimeout(120);
  await expect(activeCanvas()).toHaveAttribute("data-model-count", "4291", {
    timeout: 120000,
  });
  await expect(activeCanvas()).toHaveAttribute("data-animating", "false", {
    timeout: 60000,
  });
}
async function choose(name) {
  console.log("CHOOSE", name);
  await page.getByRole("textbox", { name: "Search 3D anatomy" }).fill(name);
  await page
    .locator(".pro-browser-results:visible button")
    .filter({ hasText: new RegExp("^" + name) })
    .first()
    .click();
  await settled();
}
try {
  await page.goto(base);
  await settled();
  if (
    await page
      .getByRole("button", { name: "Dismiss tutorial invitation" })
      .count()
  )
    await page
      .getByRole("button", { name: "Dismiss tutorial invitation" })
      .click();
  await run(
    "unified selection survives repeated resets and does not have a blocking landmark mode",
    async () => {
      await expect(
        page.getByRole("combobox", { name: "Anatomy selection mode" }),
      ).toHaveCount(0);
      for (const name of ["Right humerus", "Right femur", "Left nasal bone"]) {
        await choose(name);
        const landmarkOption = page.getByRole("checkbox", {
          name: "Landmark labels",
          exact: true,
        });
        if (await landmarkOption.isEnabled()) await landmarkOption.check();
        else {
          await expect(landmarkOption).toBeDisabled();
          await page
            .getByRole("button", { name: "Landmarks", exact: true })
            .click();
          await expect(page.locator(".bone-landmark-guide")).toBeVisible();
        }
        await page
          .getByRole("button", { name: "Reset anatomy", exact: true })
          .click();
        await settled();
        await choose(name);
        await expect(page.locator(".pro-inspector:visible")).toContainText(
          name,
        );
      }
    },
  );
  await run(
    "knee includes source menisci, staged removal, exploded label and tissue links",
    async () => {
      await page.getByRole("tab", { name: "Explore", exact: true }).click();
      await page
        .locator(".pro-presets:visible")
        .getByRole("button", { name: "Knee", exact: true })
        .click();
      await settled();
      await page.locator(".region-structure-list:visible summary").click();
      await expect(
        page.locator(".region-structure-list:visible"),
      ).toContainText("Right medial meniscus");
      await page
        .locator(".region-structure-list:visible")
        .getByRole("button", { name: "Right medial meniscus", exact: true })
        .click();
      await settled();
      const distance = await activeCanvas().getAttribute(
        "data-camera-distance",
      );
      await page
        .getByRole("button", {
          name: "Tissue & microscopic features",
          exact: true,
        })
        .click();
      await expect(
        page.getByRole("dialog", { name: "Fibrocartilage" }),
      ).toBeVisible();
      await page
        .getByRole("button", { name: "Microscopy reference", exact: true })
        .click();
      await page.waitForFunction(() =>
        [...document.querySelectorAll(".tissue-bridge img")].every(
          (i) => i.complete && i.naturalWidth > 0,
        ),
      );
      await expect(page.locator(".tissue-bridge")).toContainText("dog tissue");
      await page
        .getByRole("button", { name: "Return to my body view" })
        .click();
      await expect(activeCanvas()).toHaveAttribute(
        "data-camera-distance",
        distance,
      );
      await page
        .getByRole("combobox", { name: "Knee dissection stage" })
        .selectOption("2");
      await page
        .getByRole("checkbox", { name: "Exploded teaching view" })
        .check();
      await expect(page.locator(".region-tools:visible")).toContainText(
        "Structures moved from normal positions",
      );
    },
  );
  await run(
    "notes require review and create an independent saved model",
    async () => {
      await page
        .getByRole("button", { name: "Reset anatomy", exact: true })
        .click();
      await choose("Right humerus");
      const mainDistance = await activeCanvas().getAttribute(
        "data-camera-distance",
      );
      await page
        .getByRole("button", { name: "Create study workspace", exact: true })
        .click();
      await page
        .getByRole("textbox", { name: "Workspace name", exact: true })
        .fill("Arm and leg lab");
      await page
        .getByRole("textbox", { name: "Study workspace notes" })
        .fill("Right humerus, Right femur, alveoli");
      await expect(page.locator(".study-editor")).toContainText(
        "unmatched / unsupported passages",
      );
      await page
        .getByRole("checkbox", { name: "Right humerus", exact: true })
        .check();
      await page
        .getByRole("checkbox", { name: "Right femur", exact: true })
        .check();
      await page
        .getByRole("button", { name: "Save study workspace", exact: true })
        .click();
      await page
        .getByRole("button", { name: "3D study model", exact: true })
        .click();
      await settled();
      await expect(page.locator(".collection-actions")).toContainText(
        "2 confirmed structures",
      );
      await expect(activeCanvas()).toHaveAttribute(
        "data-visible-meshes",
        /^[1-9]/,
      );
      await page
        .getByRole("button", { name: "Reset anatomy", exact: true })
        .click();
      await settled();
      await page.getByRole("tab", { name: "Full body", exact: true }).click();
      await settled();
      await expect(page.locator(".pro-inspector:visible")).toContainText(
        "Right humerus",
      );
      await expect(activeCanvas()).toHaveAttribute(
        "data-camera-distance",
        mainDistance,
      );
      await page
        .getByRole("tab", { name: "Arm and leg lab", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Quiz collection", exact: true })
        .click();
      await expect(page.locator(".quiz-settings")).toContainText(
        "Confirmed collection: Arm and leg lab",
      );
    },
  );
  await run(
    "scoped games hide labels, score answers and retain sessions on reload",
    async () => {
      await page.getByRole("button", { name: "Games", exact: true }).click();
      await page
        .getByRole("combobox", { name: "Game collection" })
        .selectOption({ label: "Arm and leg lab" });
      await page
        .getByRole("combobox", { name: "Game region" })
        .selectOption("");
      await page
        .getByRole("combobox", { name: "Game activity" })
        .selectOption("Structure → name");
      await page
        .getByRole("combobox", { name: "Game timer" })
        .selectOption("0");
      await page
        .getByRole("button", { name: "Start game", exact: true })
        .click();
      const gc = page.locator(".game-model .three-canvas");
      await expect(gc).toHaveAttribute("data-model-count", "4291", {
        timeout: 120000,
      });
      await expect(gc).toHaveAttribute("data-animating", "false");
      await expect(page.locator(".game-model .anchored-label")).toHaveCount(0);
      const id = await page
        .locator(".game-model")
        .getAttribute("data-target-id");
      const name = models.find((m) => m.id === id).name;
      await page
        .locator(".game-options")
        .getByRole("button", { name, exact: true })
        .click();
      await expect(page.locator(".game-feedback")).toContainText("Correct");
      await page
        .getByRole("button", { name: "Finish session", exact: true })
        .click();
      await expect(page.locator(".learning-card")).toContainText(
        "1 correct from 1",
      );
      await page.reload();
      await page.getByRole("button", { name: "Games", exact: true }).click();
      await expect(page.locator(".games-page")).toContainText(
        "1 saved game sessions",
      );
    },
  );
  await run(
    "PT resources and a replayable contextual tutorial are available",
    async () => {
      await page.getByRole("button", { name: "PT / AT", exact: true }).click();
      await expect(page.locator(".learning-page")).toContainText(
        "not a diagnosis or personalized",
      );
      await page
        .getByRole("button", { name: "Exercise examples", exact: true })
        .click();
      await expect(page.locator(".learning-page")).toContainText(
        "Regressions".slice(0, -1),
      );
      await expect(page.locator(".learning-page a").first()).toHaveAttribute(
        "href",
        /^https:\/\/orthoinfo\.aaos\.org/,
      );
      await page.getByRole("button", { name: "Help", exact: true }).click();
      await expect(
        page.getByRole("dialog", { name: "App tutorial" }),
      ).toBeVisible();
      await page.getByRole("button", { name: "Next", exact: true }).click();
      await expect(page.locator(".tutorial-popover")).toContainText(
        "Hide, isolate and restore",
      );
      await page
        .getByRole("button", { name: "Skip tour", exact: true })
        .click();
    },
  );
  await page.screenshot({
    path: "delivery/forma-learning.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
  console.log(
    `${passed} combined learning workflows passed; no runtime errors.`,
  );
} finally {
  await browser.close();
}
