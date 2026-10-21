import { chromium, expect } from "@playwright/test";
const browser = await chromium.launch({ executablePath: "/usr/bin/chromium", headless: true, args: ["--no-sandbox"] });
const base = process.env.FORMA_BASE_URL || "http://127.0.0.1:3000";
const errors = [];
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
page.setDefaultTimeout(45000);
page.on("pageerror", (e) => errors.push(e.message));
await page.addInitScript(() => localStorage.setItem("forma-tour-done", "1"));
let fails = 0;
async function run(name, fn) {
  try { await fn(); console.log("PASS", name); } catch (e) { fails++; console.log("FAIL", name, String(e.message).split("\n").slice(0, 4).join(" | ")); }
}
async function home(preset) {
  await page.goto(base);
  await page.getByRole("button", { name: "Games", exact: true }).click();
  await page.getByRole("button", { name: preset, exact: true }).last().click();
}
const mode = (n) => page.getByRole("radio", { name: new RegExp(n) }).click();
const start = () => page.getByRole("button", { name: "Start", exact: true }).click();
const finish = () => page.getByRole("button", { name: "Finish session", exact: true }).click();
const ready = () => page.waitForFunction(() => {
  const el = document.querySelector(".game-model"); const c = el?.querySelector(".three-canvas");
  return c && JSON.parse(c.dataset.pickableIds || "[]").length > 0;
}, null, { timeout: 90000 });

await run("games home shows quick starts, difficulty, players and playlists", async () => {
  await home("Skull bones");
  await expect(page.getByRole("region", { name: "Quick start" })).toBeVisible();
  await expect(page.getByRole("radiogroup", { name: "Difficulty" })).toBeVisible();
  await page.getByRole("radio", { name: "Easy" }).click();
  await page.getByLabel("Playlist name").fill("Skull test");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByRole("group", { name: "My playlists" }).or(page.locator(".gs-lists"))).toContainText("Skull test");
});
await run("name it: persistent stage, number keys answer, points and results list", async () => {
  await home("Skull bones");
  await mode("Name it"); await start(); await ready();
  await expect(page.locator(".game-options button")).toHaveCount(4);
  await page.keyboard.press("1");
  await expect(page.locator(".game-feedback")).toBeVisible();
  const id = await page.locator(".game-model").getAttribute("data-target-id");
  await page.getByRole("button", { name: "Next challenge" }).click();
  await expect.poll(() => page.locator(".game-model").getAttribute("data-target-id")).not.toBe(id);
  await page.keyboard.press("p");
  await expect(page.getByRole("dialog", { name: "Paused" })).toBeVisible();
  await page.getByRole("button", { name: "Resume" }).last().click();
  await finish();
  await expect(page.getByText("Every answer")).toBeVisible();
  await expect(page.getByText("points", { exact: true })).toBeVisible();
});
await run("hard name it asks for a typed answer", async () => {
  await home("Skull bones");
  await page.getByRole("radio", { name: "Hard" }).click();
  await mode("Name it"); await start(); await ready();
  await expect(page.getByRole("textbox", { name: "Your answer" })).toBeVisible();
  await expect(page.locator(".game-options")).toHaveCount(0);
  await page.getByRole("textbox", { name: "Your answer" }).fill("zzz");
  await page.getByRole("button", { name: "Check" }).click();
  await expect(page.locator(".game-feedback")).toContainText("Study again");
});
await run("survival shows three lives and speed round counts down", async () => {
  await home("Skull bones");
  await mode("Survival"); await start(); await ready();
  await expect(page.getByLabel("3 lives left")).toBeVisible();
  await finish();
  await home("Skull bones");
  await mode("Speed round"); await start(); await ready();
  await expect(page.getByRole("timer")).toContainText("s");
  await finish();
});
await run("odd one out and colour the labels", async () => {
  await home("Knee: bones & cartilage");
  await mode("Odd one out"); await start(); await ready();
  await expect(page.locator(".game-options button")).toHaveCount(4);
  await page.locator(".game-options button").first().click();
  await expect(page.locator(".game-feedback")).toBeVisible();
  await finish();
  await home("Skull bones");
  await mode("Colour the labels"); await start(); await ready();
  const slots = page.locator(".label-slot");
  await expect(slots).toHaveCount(5);
  for (let i = 0; i < 5; i++) {
    await page.locator(".label-chips button:not([disabled])").first().click();
    await slots.nth(i).click();
  }
  await page.getByRole("button", { name: "Check my answers" }).click();
  await expect(page.locator(".game-feedback")).toContainText("of 5 right");
  await finish();
});
await run("lab practical hides feedback until the end and lists every station", async () => {
  await home("Skull bones");
  await mode("Lab practical"); await start(); await ready();
  await expect(page.getByRole("heading", { name: /Station 1 of/ })).toBeVisible();
  await page.getByRole("textbox", { name: "Your answer" }).fill("nothing");
  await page.getByRole("button", { name: "Lock in" }).click();
  await expect(page.locator(".game-feedback")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: /Station 2 of/ })).toBeVisible();
  await finish();
  await expect(page.getByText("Every answer")).toBeVisible();
});
await run("muscle match and pass-and-play", async () => {
  await home("Neck muscles");
  await mode("Muscle match"); await start();
  await expect(page.locator(".game-options button").first()).toBeVisible();
  await page.locator(".game-options button").first().click();
  await expect(page.locator(".game-feedback")).toBeVisible();
  await finish();
  await home("Skull bones");
  await page.getByRole("radio", { name: /Pass & play/ }).click();
  await mode("Name it"); await start(); await ready();
  await expect(page.getByText("Player 1's turn")).toBeVisible();
  await page.keyboard.press("1");
  await page.keyboard.press("Enter");
  await expect(page.getByText("Player 2's turn")).toBeVisible();
  await finish();
  await expect(page.getByText(/Player 1: \d+ · Player 2/)).toBeVisible();
});
console.log(errors.length ? "PAGE ERRORS: " + errors.slice(0, 3).join(" || ") : "no page errors");
await browser.close();
process.exit(fails || errors.length ? 1 : 0);
