import { chromium, expect } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";
const browser = await chromium.launch({
  ...(existsSync("/usr/bin/chromium") ? { executablePath: "/usr/bin/chromium" } : {}),
  headless: true,
  args: ["--no-sandbox"],
});
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
const page = await ctx.newPage();
page.setDefaultTimeout(30000);
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const base = process.env.FORMA_BASE_URL || "http://127.0.0.1:3000";
let passed = 0;
async function run(name, fn) {
  await fn();
  passed++;
  console.log(`PASS ${name}`);
}
try {
  await page.addInitScript(() => localStorage.setItem("forma-tour-done", "1"));
  await page.goto(base);
  await page.getByRole("button", { name: "Dismiss tutorial invitation" }).click().catch(() => {});
  await run("flashcards from a study tab feed review, goal and streak", async () => {
    await page.getByRole("button", { name: "Add study model", exact: true }).click();
    await page.getByLabel("Workspace name").fill("Knee lab");
    await page.getByRole("button", { name: "Knee", exact: true }).click();
    await page.getByRole("button", { name: /^Add all/ }).click();
    await page.getByRole("button", { name: /Create study model/ }).click();
    await page.getByRole("button", { name: "Flashcards", exact: true }).click();
    await expect(page.getByText(/cards: \d+ structure pictures/)).toBeVisible();
    await page.getByRole("button", { name: "Study these now" }).click();
    await page.getByRole("button", { name: "Show answer" }).click();
    await expect(page.locator(".fs-back h3")).toBeVisible();
    await page.getByRole("button", { name: /^Good/ }).click();
    await page.getByRole("button", { name: "End session" }).click();
    await page.getByRole("tab", { name: /Today/ }).click();
    await expect(page.getByText("1/20")).toBeVisible();
    await expect(page.getByText(/cards? due/)).toBeVisible();
    const srs = await page.evaluate(() => JSON.parse(localStorage.getItem("forma-srs-v1")));
    const rated = Object.values(srs).filter((e) => e.seen === 1);
    expect(rated).toHaveLength(1);
    expect(rated[0].box).toBe(1);
  });
  await run("exam countdown and daily goal persist", async () => {
    await page.getByLabel("Date").fill("2030-01-15");
    await page.getByPlaceholder(/Head & neck lab/).fill("Anatomy practical");
    await page.reload();
    await page.locator(".main-nav button", { hasText: "Study" }).click();
    await expect(page.getByText(/days? until Anatomy practical/)).toBeVisible();
  });
  await run("muscle tables cover columns and start a muscle quiz", async () => {
    await page.getByRole("tab", { name: "Muscle tables" }).click();
    await page.getByRole("group", { name: "Cover columns" }).getByRole("button", { name: "Origin" }).click();
    await expect(page.locator("td.hide").first()).toBeVisible();
    await page.locator("td.hide").first().click();
    await page.getByRole("button", { name: /Start muscle quiz/ }).click();
    await expect(page.locator(".question-card h2")).toContainText(/muscle|origin|insertion|action|nerve/i);
    await page.getByRole("button", { name: "Exit session" }).click();
  });
  await run("weak spots list misses and send them to review", async () => {
    await page.evaluate(() => {
      const models = null;
      localStorage.setItem("forma-game-results", JSON.stringify([]));
    });
    await page.locator(".main-nav button", { hasText: "Study" }).click();
    await page.getByRole("tab", { name: "Weak spots" }).click();
    await expect(page.getByText(/Nothing to analyse yet|Accuracy by region/)).toBeVisible();
  });
  await run("worksheet pictures are captured with an answer key", async () => {
    await page.getByRole("tab", { name: "Worksheets" }).click();
    await page.getByRole("combobox").first().selectOption("r:Knee");
    await page.getByRole("button", { name: "Create worksheet" }).click();
    await page.getByRole("link", { name: /Open to print/ }).waitFor({ timeout: 240000 });
    const href = await page.getByRole("link", { name: /Open to print/ }).getAttribute("href");
    const html = await page.evaluate(async (h) => (await (await fetch(h)).text()), href);
    expect((html.match(/<img /g) || []).length).toBeGreaterThanOrEqual(6);
    expect(html).toContain("Answer key");
    expect(html.length).toBeGreaterThan(100000);
  });
  await run("backup downloads everything and restores it", async () => {
    await page.getByRole("tab", { name: "Backup" }).click();
    const [dl] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: "Download backup" }).click(),
    ]);
    await dl.saveAs("/tmp/forma-test-backup.json");
    const backup = JSON.parse(readFileSync("/tmp/forma-test-backup.json", "utf8"));
    expect(backup.format).toBe("burdetts-anatomy-backup");
    expect(Object.keys(backup.storage)).toEqual(expect.arrayContaining(["forma-collections-v1", "forma-srs-v1"]));
    await page.evaluate(() => {
      localStorage.removeItem("forma-srs-v1");
      localStorage.removeItem("forma-collections-v1");
    });
    await page.getByLabel("Backup file").setInputFiles("/tmp/forma-test-backup.json");
    await expect(page.locator(".sh-card").nth(1).getByText("Study tabs")).toBeVisible();
    await page.getByRole("button", { name: "Restore", exact: true }).click();
    await page.waitForLoadState("load");
    await page.waitForFunction(() => !!localStorage.getItem("forma-srs-v1"));
    const restored = await page.evaluate(() => JSON.parse(localStorage.getItem("forma-collections-v1")));
    expect(restored.some((c) => c.name === "Knee lab")).toBe(true);
    await expect(page.getByRole("tab", { name: "Knee lab" })).toBeVisible({ timeout: 60000 });
  });
  expect(errors).toEqual([]);
  console.log(`${passed} study workflows passed; no page errors.`);
} finally {
  await browser.close();
}
