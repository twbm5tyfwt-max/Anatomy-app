import { chromium, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
const models = JSON.parse(
  readFileSync("src/model-manifest.json", "utf8"),
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
let passed = 0;
const mainCanvas = () =>
  page.locator(".pro-stage .three-canvas:visible").first();
const refCanvas = () => page.locator(".reference-stage .three-canvas:visible");
async function settled(canvas = mainCanvas()) {
  await page.waitForTimeout(180);
  await expect
    .poll(async () => +(await canvas.getAttribute("data-rendered-parts")), {
      timeout: 120000,
    })
    .toBeGreaterThan(0);
  await expect
    .poll(async () => +(await canvas.getAttribute("data-visible-meshes")), {
      timeout: 120000,
    })
    .toBeGreaterThan(0);
  await expect(canvas).toHaveAttribute("data-animating", "false", {
    timeout: 120000,
  });
}
async function run(name, fn) {
  console.log("RUN", name);
  await fn();
  passed++;
  console.log("PASS", name);
}
async function pick(name) {
  await page
    .getByRole("textbox", { name: "Search 3D anatomy", exact: true })
    .fill(name);
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
    "click isolation, contextual landmark checkbox and complete bone guides",
    async () => {
      await pick("Right capitate bone");
      await expect(mainCanvas()).toHaveAttribute("data-isolated", "true");
      await expect(
        page.getByRole("checkbox", { name: "Landmark labels", exact: true }),
      ).toBeVisible();
      await page
        .getByRole("button", { name: "Landmarks", exact: true })
        .click();
      await expect(page.locator(".bone-landmark-guide")).toContainText("head");
      await page
        .getByRole("button", { name: "Attachments", exact: true })
        .click();
      await expect(page.locator(".pro-inspector")).toContainText("Intercarpal");
      await page
        .getByRole("button", { name: "Back to body", exact: true })
        .click();
      await settled();
      await expect(
        page.getByRole("checkbox", { name: "Landmark labels", exact: true }),
      ).toHaveCount(0);
    },
  );
  await run(
    "whole-muscle option is a checkbox and archived attachments have attribution",
    async () => {
      await pick("Long head of right biceps brachii");
      await page
        .getByRole("checkbox", { name: "Whole muscle", exact: true })
        .check();
      await settled();
      expect(
        +(await mainCanvas().getAttribute("data-selected-parts")),
      ).toBeGreaterThan(1);
      await page
        .getByRole("button", { name: "Attachments", exact: true })
        .click();
      await expect(page.locator(".pro-inspector")).toContainText("Origin");
      await page.waitForTimeout(600);
      await page.reload();
      await settled();
      await expect(
        page.getByRole("checkbox", { name: "Whole muscle", exact: true }),
      ).toBeChecked();
      expect(
        +(await mainCanvas().getAttribute("data-selected-parts")),
      ).toBeGreaterThan(1);
    },
  );
  await run(
    "dedicated ligament sidebar switch and visible knee cartilage controls",
    async () => {
      await page.getByRole("button", { name: "Show ligaments" }).click();
      await settled();
      await page.getByRole("tab", { name: "Explore", exact: true }).click();
      await page
        .locator(".pro-presets")
        .getByRole("button", { name: "Knee", exact: true })
        .click();
      await settled();
      const kneeLayers = JSON.parse(
        await mainCanvas().getAttribute("data-visible-layer-counts"),
      );
      expect(kneeLayers.skin || 0).toBe(0);
      expect(kneeLayers.organs || 0).toBe(0);
      expect(kneeLayers.tendons).toBeGreaterThan(0);
      await page.screenshot({ path: "delivery/forma-knee.png" });
      await expect(page.locator(".knee-layer-checks")).toContainText(
        "Articular surfaces & menisci",
      );
      await page
        .getByRole("checkbox", { name: "Exploded teaching view" })
        .check();
      await settled();
      await expect(page.locator(".region-tools")).toContainText("not to scale");
      await page.locator(".cartilage-examples summary").click();
      await page
        .getByRole("button", { name: "Fibrocartilage · medial meniscus" })
        .click();
      await expect(page.locator(".pro-inspector h2")).toHaveText(
        "Right medial meniscus",
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
      await expect(mainCanvas()).toHaveAttribute("data-animating", "false");
      const camera = await mainCanvas().getAttribute("data-camera-distance");
      const pose = await mainCanvas().getAttribute("data-camera-pose");
      await page.waitForTimeout(350);
      await page
        .getByRole("button", { name: "Return to body", exact: true })
        .click();
      await expect(mainCanvas()).toHaveAttribute(
        "data-camera-distance",
        camera,
      );
      await expect(mainCanvas()).toHaveAttribute("data-camera-pose", pose);
    },
  );
  await run(
    "heart dissection removes source chamber walls and isolates the actual septum",
    async () => {
      await pick("Left ventricle");
      await page
        .getByRole("button", {
          name: "Dissect organ · internal views",
          exact: true,
        })
        .click();
      await settled(refCanvas());
      const total = +(await refCanvas().getAttribute("data-visible-meshes"));
      await page
        .getByRole("checkbox", { name: "Remove chamber walls" })
        .check();
      await settled(refCanvas());
      expect(
        +(await refCanvas().getAttribute("data-visible-meshes")),
      ).toBeLessThan(total);
      await page.screenshot({ path: "delivery/forma-heart.png" });
      await page
        .locator(".reference-components")
        .getByRole("button", { name: "Interventricular septum", exact: true })
        .click();
      await settled(refCanvas());
      await expect(page.locator(".reference-detail")).toContainText(
        "separating the right and left ventricles",
      );
      await page
        .getByRole("button", {
          name: "Published section reference",
          exact: true,
        })
        .click();
      await expect(page.locator(".organ-section-reference img")).toBeVisible();
      await expect(
        page.locator(".organ-section-reference img"),
      ).toHaveJSProperty("complete", true);
      await page
        .getByRole("button", { name: "Return to body", exact: true })
        .click();
      await settled();
    },
  );
  await run(
    "lungs have real lobe groups, branching bronchi and a camera-preserving alveolar guide",
    async () => {
      await page
        .getByRole("button", { name: "Female reference", exact: true })
        .click();
      await settled(refCanvas());
      await page
        .getByRole("combobox", { name: "Reference organ or region" })
        .selectOption("Lungs");
      await settled(refCanvas());
      await page
        .getByRole("combobox", { name: "Isolate lung or lobe" })
        .selectOption({ label: "Right middle lobe" });
      await settled(refCanvas());
      await expect(refCanvas()).toHaveAttribute("data-isolated", "true");
      await page
        .getByRole("button", { name: "Restore organ", exact: true })
        .click();
      await settled(refCanvas());
      const before = +(await refCanvas().getAttribute("data-visible-meshes"));
      await page
        .getByRole("checkbox", { name: "Reveal bronchial tree" })
        .check();
      await settled(refCanvas());
      expect(
        +(await refCanvas().getAttribute("data-visible-meshes")),
      ).toBeLessThan(before);
      await page.screenshot({ path: "delivery/forma-lungs.png" });
      const camera = await refCanvas().getAttribute("data-camera-distance");
      await page.getByRole("button", { name: "Bronchioles → alveoli" }).click();
      await expect(
        page.getByRole("button", { name: "Alveolar sac", exact: true }),
      ).toBeVisible();
      await page.getByRole("button", { name: "Alveolus", exact: true }).click();
      await expect(page.getByRole("dialog")).toContainText(
        "capillary endothelium",
      );
      await page
        .getByRole("button", { name: "Return to body", exact: true })
        .click();
      await expect(refCanvas()).toHaveAttribute("data-camera-distance", camera);
      await page
        .locator(".reference-components")
        .getByRole("button", {
          name: "Cartilage of main bronchus right",
          exact: true,
        })
        .click();
      await settled(refCanvas());
      await page
        .getByRole("button", {
          name: "Tissue & microscopic features",
          exact: true,
        })
        .click();
      await expect(
        page.getByRole("dialog", { name: "Hyaline cartilage", exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Educational diagram", exact: true }),
      ).toHaveAttribute("aria-pressed", "true");
      await page
        .getByRole("button", { name: "Return to body", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Male source anatomy", exact: true })
        .click();
      await settled();
    },
  );
  await run(
    "picture upload reads labels locally and produces an actual study guide plus scoped 3D model",
    async () => {
      await page
        .getByRole("button", { name: "Add study model", exact: true })
        .click();
      await page
        .getByRole("textbox", { name: "Workspace name" })
        .fill("Image lab guide");
      const data = await page.evaluate(() => {
        const c = document.createElement("canvas");
        c.width = 1200;
        c.height = 360;
        const x = c.getContext("2d");
        x.fillStyle = "#fff";
        x.fillRect(0, 0, c.width, c.height);
        x.fillStyle = "#000";
        x.font = "48px Arial";
        x.fillText("Right humerus", 50, 90);
        x.fillText("Right femur", 50, 180);
        x.fillText("Right medial meniscus", 50, 270);
        return c.toDataURL().split(",")[1];
      });
      const external = [];
      const track = (request) => {
        if (
          request.url().startsWith("http") &&
          !request.url().startsWith(new URL(base).origin)
        )
          external.push(request.url());
      };
      page.on("request", track);
      await page.getByLabel("Study workspace files").setInputFiles({
        name: "lab-image.png",
        mimeType: "image/png",
        buffer: Buffer.from(data, "base64"),
      });
      await expect(
        page.getByRole("checkbox", { name: /^Right humerus/ }),
      ).toBeVisible({ timeout: 120000 });
      await page
        .getByRole("checkbox", { name: /^Right humerus/ })
        .check();
      await page
        .getByRole("checkbox", { name: /^Right femur/ })
        .check();
      await page
        .getByRole("button", { name: /Create study model/ })
        .click();
      // A new study model opens on its 3D tab with landmarks showing; the guide is one tab away.
      await settled();
      await expect(page.locator(".pro-inspector:visible")).toContainText(
        /Right (humerus|femur)/,
      );
      await page
        .getByRole("button", { name: "Study guide", exact: true })
        .click();
      await expect(page.locator(".personal-study-guide:visible")).toContainText(
        "Right humerus",
      );
      await expect(
        page.locator(".personal-study-guide:visible .study-source-image"),
      ).toBeVisible();
      await expect(page.locator(".guide-structure").first()).toContainText(
        "Landmarks",
      );
      await page.screenshot({ path: "delivery/forma-image-guide.png" });
      expect(external).toEqual([]);
      page.off("request", track);
      await page.locator(".guide-structure").first().locator(":scope > summary").click();
      await page
        .locator(".guide-structure")
        .first()
        .getByRole("button", { name: "Find in my 3D model" })
        .click();
      await settled();
      const scope = JSON.parse(
        await mainCanvas().getAttribute("data-selected-ids"),
      );
      expect(scope.length).toBeGreaterThan(0);
      await page
        .getByRole("button", { name: "Study guide", exact: true })
        .click();
      const download = page.waitForEvent("download");
      await page
        .getByRole("button", { name: "Download / print study guide" })
        .click();
      expect((await download).suggestedFilename()).toContain(
        "study-guide.html",
      );
      await page.reload();
      await page
        .getByRole("tab", { name: "Image lab guide", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Study guide", exact: true })
        .click();
      await expect(page.locator(".personal-study-guide:visible")).toContainText(
        "Right humerus",
      );
      await page.getByRole("tab", { name: "Full body", exact: true }).click();
      await settled();
    },
  );
  await run(
    "new 2D source atlas zooms and keeps the original overview available",
    async () => {
      await page
        .getByRole("button", { name: "2D reference", exact: true })
        .click();
      await expect(page.locator(".a2d")).toBeVisible();
      await page.getByRole("button", { name: "Published plates" }).click();
      await expect(page.locator(".plate-explorer")).toBeVisible();
      await page
        .getByRole("combobox", { name: "2D reference plate" })
        .selectOption("Heart");
      await expect(page.locator(".published-plate img")).toHaveJSProperty(
        "complete",
        true,
      );
      await page.getByRole("button", { name: "Zoom reference in" }).click();
      await expect(page.locator(".plate-zoom")).toContainText("125%");
      await page.screenshot({ path: "delivery/forma-reference.png" });
      await page.getByRole("button", { name: "Atlas plate" }).click();
      await expect(page.locator(".a2d")).toBeVisible();
    },
  );
  await run(
    "tissue microscopy, illustration labels and comparisons remain distinct",
    async () => {
      await page.getByRole("button", { name: "Tissues", exact: true }).click();
      await expect(page.locator(".histology-figure")).toBeVisible();
      await page
        .locator(".tissue-class-tabs")
        .getByRole("button", { name: /Connective/ })
        .click();
      await page
        .locator(".tissue-list")
        .getByRole("button", { name: "Hyaline cartilage", exact: true })
        .click();
      await expect(page.locator(".histology-figure")).toContainText(
        "dog tissue",
      );
      await page.screenshot({ path: "delivery/forma-tissues.png" });
      await page
        .locator(".tissue-view-mode")
        .getByRole("button", { name: "Diagram", exact: true })
        .click();
      await expect(
        page.locator(".tissue-panel .tissue-annotation").first(),
      ).toBeVisible();
      await page
        .getByRole("combobox", { name: "Compare tissue" })
        .selectOption("fibrocartilage");
      await expect(
        page.locator(".side-by-side .tissue-detail-body"),
      ).toHaveCount(2);
    },
  );
  await run(
    "game checklist restricts every 3D target to checked structures",
    async () => {
      await page.getByRole("button", { name: "Games", exact: true }).click();
      await page.getByRole("button", { name: "Knee", exact: true }).click();
      const search = page.getByRole("searchbox", { name: "Search study checklist" });
      await search.fill("Right patella");
      await page.getByRole("checkbox", { name: "Right patella", exact: true }).check();
      await search.fill("Right medial meniscus");
      await page.getByRole("checkbox", { name: "Right medial meniscus", exact: true }).check();
      await expect(page.getByText("2 selected")).toBeVisible();
      await page.getByRole("button", { name: "Start", exact: true }).click();
      const game = page.locator(".game-session .three-canvas");
      await settled(game);
      await expect(page.getByRole("timer")).toHaveText("Untimed");
      const allowed = ["Right patella", "Right medial meniscus"].map(
        (name) => models.find((m) => m.name === name).id,
      );
      const pickable = JSON.parse(await game.getAttribute("data-pickable-ids"));
      expect(pickable.length).toBeGreaterThan(0);
      expect(pickable.every((id) => allowed.includes(id))).toBe(true);
      await page.getByRole("button", { name: "Finish session" }).click();
    },
  );
  await run(
    "PT anatomy opens actual structures and exercise cards have source-linked technique detail",
    async () => {
      await page.getByRole("button", { name: "PT / AT", exact: true }).click();
      await settled(page.locator(".pt-anatomy-preview .three-canvas"));
      await page.getByRole("tab", { name: "Exercise examples" }).click();
      await expect(page.locator(".pt-grid")).toContainText("Supported heel slide");
      await page.locator(".pt-exercise").first().getByRole("button", { name: /Technique, mistakes/ }).click();
      for (const heading of ["Basic technique", "Common mistakes", "Precautions", "Easier (regression)", "Harder (progression)"])
        await expect(page.locator(".pt-exercise").first()).toContainText(heading);
      await expect(page.locator('.pt-exercise a[href^="https://orthoinfo.aaos.org/"]').first()).toBeVisible();
      await expect(page.locator(".pt-videos")).toContainText("does not embed exercise videos");
      await page.screenshot({ path: "delivery/forma-pt.png" });
      await page.getByRole("tab", { name: "Sources" }).click();
      await expect(page.locator(".pt-page")).toContainText("unverified");
      await page.getByRole("tab", { name: "Anatomy" }).click();
      await page.locator(".pt-structure-list").getByRole("button", { name: /^Menisci/ }).click();
      await page.getByRole("button", { name: "Open in the body viewer →" }).click();
      await settled();
      await expect(page.locator(".pro-inspector h2")).toHaveText(/Right (medial|lateral) meniscus/);
      await page.getByRole("button", { name: "Help", exact: true }).click();
      await expect(
        page.getByRole("dialog", { name: "App tutorial" }),
      ).toContainText("isolates the structure");
      await page.getByRole("button", { name: "Skip tour" }).click();
    },
  );
  expect(errors).toEqual([]);
  console.log(`${passed} upgrade workflows passed; no page errors.`);
} finally {
  await browser.close();
}
