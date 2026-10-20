import { chromium, expect } from "@playwright/test";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import * as THREE from "three";
const manifest = JSON.parse(
  readFileSync(new URL("../src/model-manifest.json", import.meta.url)),
).models;
const picks = JSON.parse(
  readFileSync(new URL("./fixtures/3d-picks.json", import.meta.url)),
);
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  headless: true,
  args: ["--no-sandbox"],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
page.setDefaultTimeout(30000);
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const base = process.env.FORMA_BASE_URL || "http://127.0.0.1:3000";
const canvas = page.locator(".three-canvas");
let passed = 0,
  surfaceCount = 0;
async function run(name, fn) {
  await fn();
  console.log("PASS", name);
  passed++;
}
async function settled() {
  await expect(canvas).toHaveAttribute("data-animating", "false", {
    timeout: 30000,
  });
}
async function clear() {
  const button = page.getByRole("button", {
    name: "Clear selected structure",
    exact: true,
  });
  if (await button.count()) await button.click();
  await settled();
}
async function observeMotion() {
  await page.evaluate(() => {
    window.motionSamples = [];
    const el = document.querySelector(".three-canvas");
    window.motionObserver?.disconnect();
    window.motionObserver = new MutationObserver(() => {
      const sample = {
        progress: +el.dataset.motionProgress,
        scale: +el.dataset.focusScale,
        lifted: +el.dataset.liftedParts,
        inspecting: el.dataset.inspecting,
      };
      if (
        JSON.stringify(sample) !== JSON.stringify(window.motionSamples.at(-1))
      )
        window.motionSamples.push(sample);
    });
    window.motionObserver.observe(el, { attributes: true });
  });
}
try {
  await page.goto(base);
  await page.waitForFunction(
    () => document.querySelector(".three-canvas")?.dataset.modelCount === "924",
    null,
    { timeout: 90000 },
  );
  await settled();
  await run(
    "one body starts with fewer deep muscles; an actual chest click lifts all three regions gradually",
    async () => {
      await expect(canvas).toHaveAttribute("data-depth", "surface");
      surfaceCount = +(await canvas.getAttribute("data-visible-meshes"));
      expect(surfaceCount).toBeGreaterThan(249);
      expect(surfaceCount).toBeLessThan(686);
      const body = new THREE.Box3();
      for (const m of manifest.filter((m) => m.id !== "FMA7163")) {
        body.expandByPoint(new THREE.Vector3(...m.bounds[0]));
        body.expandByPoint(new THREE.Vector3(...m.bounds[1]));
      }
      const rect = await page.locator(".three-canvas canvas").boundingBox();
      const camera = new THREE.PerspectiveCamera(
        36,
        rect.width / rect.height,
        0.001,
        100,
      );
      camera.position.set(0, 0, 3.25);
      camera.updateMatrixWorld();
      const point = new THREE.Vector3(...picks.pectoralis)
        .sub(body.getCenter(new THREE.Vector3()))
        .project(camera);
      await observeMotion();
      await page.mouse.click(
        rect.x + ((point.x + 1) / 2) * rect.width,
        rect.y + ((1 - point.y) / 2) * rect.height,
      );
      await expect(page.locator(".inspection-card h2")).toHaveText(
        "Right pectoralis major",
      );
      await expect(canvas).toHaveAttribute("data-highlighted-parts", "3");
      await settled();
      const samples = await page.evaluate(() => window.motionSamples);
      expect(
        samples.some(
          (s) => s.inspecting === "true" && s.scale === 1 && s.progress === 0,
        ),
      ).toBe(true);
      expect(
        samples.some((s) => s.progress > 0 && s.progress < 1 && s.scale > 1),
      ).toBe(true);
      expect(+(await canvas.getAttribute("data-focus-scale"))).toBeGreaterThan(
        3,
      );
      expect(+(await canvas.getAttribute("data-visible-meshes"))).toBe(
        surfaceCount,
      );
      // The lifted chest occupies the center; a second real surface click clears it.
      await page.mouse.click(
        rect.x + rect.width * 0.5,
        rect.y + rect.height * 0.5,
      );
      await expect(canvas).toHaveAttribute("data-inspecting", "false");
      await settled();
      await expect(canvas).toHaveAttribute("data-lifted-parts", "0");
    },
  );
  await run(
    "the pectoralis exposes clavicular, sternocostal and abdominal regions without inventing three equal heads",
    async () => {
      await page
        .getByRole("button", { name: "Pectoralis major", exact: true })
        .click();
      await settled();
      const regions = page.locator(".muscle-components");
      for (const name of [
        "Clavicular part",
        "Sternocostal part",
        "Abdominal part",
      ])
        await expect(
          regions.getByRole("button", { name, exact: true }),
        ).toBeVisible();
      await expect(regions).toContainText("main heads");
      await regions
        .getByRole("button", { name: "Clavicular part", exact: true })
        .click();
      await expect(canvas).toHaveAttribute("data-highlighted-parts", "1");
      await settled();
      await expect(page.locator(".inspection-card h2")).toHaveText(
        "Clavicular part of right pectoralis major",
      );
      await regions.getByRole("button", { name: /Whole muscle/ }).click();
      await settled();
      await expect(canvas).toHaveAttribute("data-highlighted-parts", "3");
      await clear();
    },
  );
  await run(
    "a bone rotates about the selection and retains functions, landmarks, and bookmarks",
    async () => {
      await page
        .getByRole("button", { name: "Find a part", exact: true })
        .click();
      await page
        .getByRole("textbox", { name: "Search 3D model parts" })
        .fill("Right humerus");
      await page
        .locator(".model-browser")
        .getByRole("button", { name: /Right humerus/ })
        .click();
      await settled();
      await expect(page.locator(".inspection-notes")).toContainText(
        "shoulder and elbow",
      );
      const first = await page.locator(".three-canvas canvas").screenshot();
      await page
        .getByRole("button", { name: "3D left view", exact: true })
        .click();
      const second = await page.locator(".three-canvas canvas").screenshot();
      expect(createHash("sha256").update(first).digest("hex")).not.toBe(
        createHash("sha256").update(second).digest("hex"),
      );
      await page
        .getByRole("button", { name: "Landmarks", exact: true })
        .click();
      await expect(page.locator(".landmark-guide")).toContainText(
        "Olecranon fossa",
      );
      await page
        .locator(".landmark-guide")
        .getByRole("button", { name: "View from posterior" })
        .click();
      await page
        .getByRole("button", { name: "Bookmark structure", exact: true })
        .click();
      await clear();
    },
  );
  await run(
    "system visibility and highlighting stay on the same body, with deep anatomy optional",
    async () => {
      await page
        .getByRole("button", { name: "Highlight Skeletal system", exact: true })
        .click();
      await expect(canvas).toHaveAttribute(
        "data-highlighted-systems",
        "skeletal",
      );
      await expect(
        page.getByRole("button", { name: "Hide Muscular system", exact: true }),
      ).toHaveAttribute("aria-pressed", "true");
      await expect(
        page.getByRole("button", { name: "3D back view", exact: true }),
      ).toHaveClass("active");
      await page
        .getByRole("button", {
          name: "Unhighlight Skeletal system",
          exact: true,
        })
        .click();
      await expect(canvas).toHaveAttribute("data-highlighted-systems", "");
      await page
        .getByRole("button", { name: "Hide Muscular system", exact: true })
        .click();
      await expect(canvas).toHaveAttribute("data-visible-meshes", "249");
      await page
        .getByRole("button", { name: "Show Muscular system", exact: true })
        .click();
      await expect(canvas).toHaveAttribute(
        "data-visible-meshes",
        String(surfaceCount),
      );
      await page
        .getByRole("button", { name: "All layers", exact: true })
        .click();
      await expect(canvas).toHaveAttribute("data-visible-meshes", "686");
      await page
        .getByRole("button", { name: "Superficial", exact: true })
        .click();
      await page.getByLabel("Lift selection slowly", { exact: true }).uncheck();
      await page.getByRole("button", { name: "Humerus", exact: true }).click();
      await expect(canvas).toHaveAttribute("data-inspecting", "false");
      await expect(canvas).toHaveAttribute("data-highlighted-parts", "1");
      await expect(canvas).toHaveAttribute("data-lifted-parts", "0");
      await page
        .locator(".inspection-actions")
        .getByRole("button", { name: "Hide", exact: true })
        .click();
      await settled();
      await expect(canvas).toHaveAttribute(
        "data-visible-meshes",
        String(surfaceCount - 1),
      );
      await page
        .getByRole("button", { name: "Undo 3D removal", exact: true })
        .click();
      await expect(canvas).toHaveAttribute(
        "data-visible-meshes",
        String(surfaceCount),
      );
    },
  );
  await run(
    "custom colors persist and bookmarked parts reopen on mobile",
    async () => {
      await page
        .getByRole("button", { name: "Customize", exact: true })
        .click();
      await page.getByRole("button", { name: "Dark", exact: true }).click();
      await page
        .getByRole("button", { name: "Rose accent", exact: true })
        .click();
      await page.getByLabel("Bone model color").fill("#d2cbfa");
      await page.getByLabel("Muscle model color").fill("#b76a87");
      await page
        .getByRole("button", { name: "Close appearance settings" })
        .click();
      await page.reload();
      await expect(page.locator("html")).toHaveAttribute(
        "data-appearance",
        "dark",
      );
      await page
        .getByRole("button", { name: "Customize", exact: true })
        .click();
      await expect(page.getByLabel("Bone model color")).toHaveValue("#d2cbfa");
      await expect(page.getByLabel("Muscle model color")).toHaveValue(
        "#b76a87",
      );
      await page
        .getByRole("button", { name: "Close appearance settings" })
        .click();
      await page
        .getByRole("button", { name: "My Progress", exact: true })
        .click();
      await page
        .locator(".saved-structures")
        .getByRole("button", { name: /Right humerus/ })
        .click();
      await expect(page.locator(".inspection-card h2")).toHaveText(
        "Right humerus",
      );
      await page.setViewportSize({ width: 390, height: 844 });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBe(true);
    },
  );
  await run(
    "reduced-motion preference removes the lift transition",
    async () => {
      const context = await browser.newContext({
        reducedMotion: "reduce",
        viewport: { width: 1200, height: 950 },
      });
      try {
        const p = await context.newPage();
        p.on("pageerror", (e) => errors.push(e.message));
        await p.goto(base);
        await p.waitForFunction(
          () =>
            document.querySelector(".three-canvas")?.dataset.modelCount ===
            "924",
          null,
          { timeout: 90000 },
        );
        await p
          .getByRole("button", { name: "Pectoralis major", exact: true })
          .click();
        await expect(p.locator(".three-canvas")).toHaveAttribute(
          "data-motion-progress",
          "1.000",
        );
        await expect(p.locator(".three-canvas")).toHaveAttribute(
          "data-animating",
          "false",
        );
      } finally {
        await context.close();
      }
    },
  );
  expect(errors).toEqual([]);
  console.log(passed, "3D workflows passed; no browser runtime errors.");
} finally {
  await browser.close();
}
