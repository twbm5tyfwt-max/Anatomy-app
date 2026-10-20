import { chromium, expect } from "@playwright/test";
import { createHash } from "node:crypto";
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  headless: true,
  args: ["--no-sandbox"],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
page.setDefaultTimeout(20000);
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const base = process.env.FORMA_BASE_URL || "http://127.0.0.1:3000";
let passed = 0;
async function run(name, fn) {
  await fn();
  console.log("PASS", name);
  passed++;
}
try {
  await page.goto(base);
  await page.waitForFunction(
    () => document.querySelector(".three-canvas")?.dataset.modelCount === "924",
    null,
    { timeout: 90000 },
  );
  await run(
    "actual registered 3D models load and body picking brings a part forward",
    async () => {
      await expect(page.locator(".three-canvas")).toHaveAttribute(
        "data-visible-meshes",
        "686",
      );
      const rect = await page.locator(".three-canvas canvas").boundingBox();
      await page.mouse.click(
        rect.x + rect.width * 0.46,
        rect.y + rect.height * 0.34,
      );
      await expect(page.locator(".three-canvas")).toHaveAttribute(
        "data-inspecting",
        "true",
      );
      await expect(page.locator(".three-canvas")).toHaveAttribute(
        "data-visible-meshes",
        "1",
      );
      await expect(page.locator(".inspection-card h2")).not.toHaveText("");
      await page
        .getByRole("button", { name: "Back to body", exact: true })
        .click();
      await expect(page.locator(".three-canvas")).toHaveAttribute(
        "data-inspecting",
        "false",
      );
    },
  );
  await run(
    "individual bone rotates in 3D and exposes function and landmark guidance",
    async () => {
      await page.getByRole("button", { name: "Find a part" }).click();
      await page
        .getByRole("textbox", { name: "Search 3D model parts" })
        .fill("Right humerus");
      await page
        .locator(".model-browser")
        .getByRole("button", { name: /Right humerus/ })
        .click();
      await expect(page.locator(".inspection-card h2")).toHaveText(
        "Right humerus",
      );
      await expect(page.locator(".inspection-notes")).toContainText(
        "shoulder and elbow",
      );
      await page.waitForTimeout(1200);
      const first = await page.locator(".three-canvas canvas").screenshot();
      await page
        .getByRole("button", { name: "3D left view", exact: true })
        .click();
      await page.waitForTimeout(400);
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
    },
  );
  await run(
    "hide, undo and multiple system visibility affect the actual mesh scene",
    async () => {
      await page
        .locator(".inspection-actions")
        .getByRole("button", { name: "Hide", exact: true })
        .click();
      await expect(page.locator(".three-canvas")).toHaveAttribute(
        "data-visible-meshes",
        "685",
      );
      await page.getByRole("button", { name: "Undo 3D removal" }).click();
      await expect(page.locator(".three-canvas")).toHaveAttribute(
        "data-visible-meshes",
        "686",
      );
      await page
        .getByRole("button", { name: "Hide Muscular system", exact: true })
        .click();
      await expect(page.locator(".three-canvas")).toHaveAttribute(
        "data-visible-meshes",
        "249",
      );
      await page
        .getByRole("button", { name: "Show Muscular system", exact: true })
        .click();
      await expect(page.locator(".three-canvas")).toHaveAttribute(
        "data-visible-meshes",
        "686",
      );
    },
  );
  await run(
    "custom accents, dark mode and model colors persist after reload",
    async () => {
      await page
        .getByRole("button", { name: "Customize", exact: true })
        .click();
      await page.getByRole("button", { name: "Dark", exact: true }).click();
      await page.getByRole("button", { name: "Rose accent" }).click();
      await page.getByLabel("Bone model color").fill("#d2cbfa");
      await page.getByLabel("Muscle model color").fill("#b76a87");
      await page
        .getByRole("button", { name: "Close appearance settings" })
        .click();
      await expect(page.locator("html")).toHaveAttribute(
        "data-appearance",
        "dark",
      );
      expect(
        await page.evaluate(() =>
          getComputedStyle(document.documentElement)
            .getPropertyValue("--accent")
            .trim(),
        ),
      ).toBe("#db2777");
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
    },
  );
  await run(
    "3D bookmarks return to the same part and mobile layout fits",
    async () => {
      await page.getByRole("button", { name: "Try the humerus" }).click();
      await page
        .getByRole("button", { name: "Bookmark structure", exact: true })
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
  expect(errors).toEqual([]);
  console.log(
    passed,
    "3D and appearance workflows passed; no browser runtime errors.",
  );
} finally {
  await browser.close();
}
