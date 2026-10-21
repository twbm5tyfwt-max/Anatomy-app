import { chromium, expect } from "@playwright/test";
import * as THREE from "three";
import { readFileSync } from "node:fs";
const models = JSON.parse(
  readFileSync(new URL("../src/model-manifest.json", import.meta.url)),
).models;
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  headless: true,
  args: ["--no-sandbox"],
});
const base = process.env.FORMA_BASE_URL || "http://127.0.0.1:3000";
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  page.setDefaultTimeout(30000);
  let release;
  const gate = new Promise((r) => (release = r));
  let intercepted = false;
  if (!base.includes("forma-preview.html"))
    await page.route("**/models/anatomy.glb", async (route) => {
      intercepted = true;
      await gate;
      await route.fulfill({
        path: new URL("../public/models/anatomy.glb", import.meta.url).pathname,
        contentType: "model/gltf-binary",
      });
    });
  await page.goto(base);
  await page.getByRole("button", { name: "Games", exact: true }).click();
  await page.getByRole("button", { name: "Skull bones" }).click();
  await page.getByRole("radio", { name: /Find & click/ }).click();
  await page.getByRole("group", { name: "Timer" }).getByRole("button", { name: "60s" }).click();
  await page.getByRole("button", { name: "Start", exact: true }).click();
  if (intercepted) {
    await expect(page.getByRole("timer")).toHaveText("60s");
    await page.waitForTimeout(1100);
    await expect(page.getByRole("timer")).toHaveText("60s");
    release();
  }
  const gc = page.locator(".game-model .three-canvas");
  await expect(gc).toHaveAttribute("data-model-count", "4291", {
    timeout: 120000,
  });
  await page.waitForFunction(
    () => {
      const el = document.querySelector(".game-model");
      const canvas = el?.querySelector(".three-canvas");
      return JSON.parse(canvas?.dataset.pickableIds || "[]").includes(
        el?.dataset.targetId,
      );
    },
    null,
    { timeout: 60000 },
  );
  await expect(page.locator(".game-model .anchored-label")).toHaveCount(0);
  await expect(page.getByRole("timer")).not.toHaveText("60s", {
    timeout: 10000,
  });
  const id=await page.locator('.game-model').getAttribute('data-target-id');
  const gamePoint=JSON.parse(await gc.getAttribute('data-pick-points'))[id],gameRect=await gc.boundingBox();
  await page.mouse.click(gameRect.x+gamePoint[0]*gameRect.width,gameRect.y+gamePoint[1]*gameRect.height);
  await expect(page.locator('.game-feedback')).toContainText('Correct.');
  const paused=await page.getByRole('timer').textContent();await page.waitForTimeout(1100);await expect(page.getByRole('timer')).toHaveText(paused);
  console.log(
    "PASS find challenge starts only after source raycasts prove a visible target; loading time is free",
  );
  await page.getByRole('button',{name:'Finish session',exact:true}).click();
  const scopeIds=['Right humerus','Right femur'].map(name=>models.find(m=>m.name===name&&!m.parentId).id);
  await page.evaluate(ids=>localStorage.setItem('forma-collections-v1',JSON.stringify([{id:'stress-set',name:'Context stress set',ids,references:[],created:new Date().toISOString()}])),scopeIds);
  await page.reload();await page.getByRole('button',{name:'Games',exact:true}).click();
  await page.getByRole('radio',{name:/Name it/}).click();
  await page.getByRole('button',{name:'Context stress set'}).click();
  await page.getByRole('group',{name:'Timer'}).getByRole('button',{name:'Untimed'}).click();
  await expect(page.getByText('2 selected')).toBeVisible();
  await page.getByRole('button',{name:'Start',exact:true}).click();
  for(let i=0;i<20;i++){
    const target=await page.locator('.game-model').getAttribute('data-target-id');
    const answerName=models.find(m=>m.id===target).name;
    const button=page.locator('.game-options').getByRole('button',{name:answerName,exact:true});
    await expect(button).toBeEnabled({timeout:60000});await button.click();
    await expect(page.locator('.game-feedback')).toContainText('Correct.');
    if(i<19)await page.getByRole('button',{name:'Next challenge',exact:true}).click();
  }
  await expect(page.locator('.game-status')).toContainText('20 correct / 20 answered');
  await page.getByRole('button',{name:'Finish session',exact:true}).click();
  await page.getByRole('button',{name:'Body Explorer',exact:true}).click();
  expect(await page.locator('.pro-atlas canvas').first().evaluate(c=>{const gl=c.getContext('webgl2');return !!gl&&!gl.isContextLost()})).toBe(true);
  console.log('PASS twenty game model transitions retain the main viewer WebGL context');
  await page.close();
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  const p = await context.newPage();
  await p.goto(base);
  if (
    await p.getByRole("button", { name: "Dismiss tutorial invitation" }).count()
  )
    await p
      .getByRole("button", { name: "Dismiss tutorial invitation" })
      .click();
  const c = p.locator(".three-canvas:visible");
  await expect(c).toHaveAttribute("data-model-count", "4291", {
    timeout: 120000,
  });
  await p
    .getByRole("textbox", { name: "Search 3D anatomy" })
    .fill("Right humerus");
  await p
    .locator(".pro-browser-results:visible button")
    .filter({ hasText: /^Right humerus/ })
    .click();
  await p.waitForTimeout(150);
  await expect(c).toHaveAttribute("data-animating", "false", {
    timeout: 60000,
  });
  await p.getByRole("button", { name: "Clear anatomy selection" }).click();
  await c.scrollIntoViewIfNeeded();
  const bone = models.find((m) => m.name === "Right humerus" && !m.parentId),
    children = models.filter((m) => m.id === bone.id || m.parentId === bone.id);
  const box = new THREE.Box3();
  for (const m of children) {
    box.expandByPoint(new THREE.Vector3(...m.bounds[0]));
    box.expandByPoint(new THREE.Vector3(...m.bounds[1]));
  }
  const point = new THREE.Vector3(
    (bone.bounds[0][0] + bone.bounds[1][0]) / 2,
    (bone.bounds[0][1] + bone.bounds[1][1]) / 2,
    bone.bounds[1][2],
  ).sub(box.getCenter(new THREE.Vector3()));
  const rect = await c.boundingBox(),
    distance = +(await c.getAttribute("data-camera-distance"));
  const camera = new THREE.PerspectiveCamera(
    35,
    rect.width / rect.height,
    0.001,
    15,
  );
  camera.position.copy(
    new THREE.Vector3(0, 0.02, 1).normalize().multiplyScalar(distance),
  );
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld();
  point.project(camera);
  await p.touchscreen.tap(
    rect.x + ((point.x + 1) * rect.width) / 2,
    rect.y + ((1 - point.y) * rect.height) / 2,
  );
  await expect(p.locator(".pro-inspector:visible")).toContainText(
    "Right humerus",
  );
  expect(
    await p.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
  await p.screenshot({ path: "delivery/forma-touch.png", fullPage: true });
  console.log(
    "PASS real touch tap selects anatomy after clearing; mobile layout fits",
  );
  await context.close();
} finally {
  await browser.close();
}
