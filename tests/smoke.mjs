import { chromium, expect } from "@playwright/test";
import JSZip from "jszip";
import { existsSync } from "node:fs";
const browser = await chromium.launch({
  ...(existsSync("/usr/bin/chromium")
    ? { executablePath: "/usr/bin/chromium" }
    : {}),
  headless: true,
  args: ["--no-sandbox"],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
page.setDefaultTimeout(7000);
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
  await page.goto(base);
  await page.getByRole("button", { name: "2D reference", exact: true }).click();
  if (
    await page
      .getByRole("button", { name: "Hide Skeletal system", exact: true })
      .count()
  )
    await page
      .getByRole("button", { name: "Hide Skeletal system", exact: true })
      .click();
  await run(
    "select, mask, undo, isolate, restore, and switch views",
    async () => {
      const plate = page.locator(".atlas-wrapper");
      await plate.locator('[data-structure="deltoid"]').click();
      await expect(page.locator(".structure-panel>h2")).toHaveText("Deltoid");
      await page
        .locator(".structure-tools")
        .getByRole("button", { name: "Hide", exact: true })
        .click();
      await expect(plate.locator('[data-structure="deltoid"]')).toHaveCount(0);
      await page.getByRole("button", { name: "Undo last removal" }).click();
      await expect(plate.locator('[data-structure="deltoid"]')).toHaveCount(1);
      await page
        .locator(".structure-tools")
        .getByRole("button", { name: "Isolate", exact: true })
        .click();
      await expect(plate.locator("[data-structure]")).toHaveCount(1);
      await page.getByRole("button", { name: /hidden · restore/ }).click();
      await expect(plate.locator("[data-structure]")).toHaveCount(13);
      await page.getByRole("button", { name: "Back", exact: true }).click();
      await expect(plate.locator('[data-structure="trapezius"]')).toHaveCount(
        1,
      );
      await plate.locator('[data-structure="trapezius"]').click();
      await expect(
        page.getByRole("button", { name: "Back", exact: true }),
      ).toHaveClass(/active/);
      await page.getByRole("button", { name: "Reset atlas" }).click();
    },
  );
  await run("search, bookmark persistence, and system comparison", async () => {
    await page
      .getByRole("textbox", { name: "Search anatomy structures" })
      .fill("biceps");
    await page
      .locator(".search-results")
      .getByRole("button", { name: /Biceps brachii/ })
      .click();
    await expect(page.locator(".atlas-area.selected polygon")).toHaveAttribute(
      "data-structure",
      "biceps-brachii",
    );
    await page
      .getByRole("button", { name: "Bookmark structure", exact: true })
      .click();
    await page.reload();
    await page
      .getByRole("button", { name: "My Progress", exact: true })
      .click();
    await expect(page.locator(".saved-structures")).toContainText(
      "Biceps brachii",
    );
    await page
      .getByRole("button", { name: "Body Explorer", exact: true })
      .click();
    if (
      await page
        .getByRole("button", { name: "Hide Skeletal system", exact: true })
        .count()
    )
      await page
        .getByRole("button", { name: "Hide Skeletal system", exact: true })
        .click();
    await page
      .getByRole("button", { name: "Show Skeletal system", exact: true })
      .click();
    await expect(page.locator(".comparison-mini")).toBeVisible();
    await page
      .getByRole("button", { name: "Hide Muscular system", exact: true })
      .click();
    await expect(page.locator(".plate-hidden-message")).toBeVisible();
    await page
      .getByRole("button", { name: "Restore plate", exact: true })
      .click();
  });
  await run(
    "tissue illustrations, labels, zoom, and side-by-side comparison",
    async () => {
      await page.getByRole("button", { name: "Tissues", exact: true }).click();
      await page
        .locator(".tissue-list")
        .getByRole("button", { name: "Simple cuboidal", exact: true })
        .click();
      await expect(page.locator(".tissue-title h2")).toHaveText(
        "Simple cuboidal",
      );
      await expect(
        page.locator(".tissue-panel .tissue-annotation"),
      ).toHaveCount(3);
      await page
        .locator(".tissue-toolbar")
        .getByRole("button", { name: "Aa Labels" })
        .click();
      await expect(
        page.locator(".tissue-panel .tissue-annotation"),
      ).toHaveCount(0);
      await page
        .getByRole("button", { name: "Zoom tissue illustration in" })
        .click();
      await expect(page.locator(".tissue-toolbar")).toContainText("125%");
      await page
        .getByRole("combobox", { name: "Compare tissue" })
        .selectOption("simple-squamous");
      await expect(
        page.locator(".side-by-side .tissue-detail-body"),
      ).toHaveCount(2);
    },
  );
  await run(
    "practice quiz grades, submits, saves, and retries missed questions",
    async () => {
      await page.getByRole("button", { name: "Quizzes", exact: true }).click();
      await page
        .getByLabel("Question type", { exact: true })
        .selectOption("typed");
      await page
        .getByLabel("Question count", { exact: true })
        .selectOption("5");
      await page.getByRole("button", { name: "Start 5-question quiz" }).click();
      for (let i = 0; i < 5; i++) {
        await page.locator(".typed-answer input").fill("unknown");
        await page
          .getByRole("button", { name: "Check answer", exact: true })
          .click();
        await expect(page.locator(".answer-feedback")).toContainText(
          "Correct answer:",
        );
        await page
          .getByRole("button", {
            name: i === 4 ? "Submit quiz" : "Next question",
            exact: true,
          })
          .click();
      }
      await expect(page.locator(".score-circle")).toContainText("0");
      await page
        .getByRole("button", { name: "My Progress", exact: true })
        .click();
      await expect(page.locator(".stat-card").first()).toContainText("1");
      await page.reload();
      await page
        .getByRole("button", { name: "My Progress", exact: true })
        .click();
      await expect(page.locator(".recent-results details")).toHaveCount(1);
      await page.getByRole("button", { name: "Review 5 missed items" }).click();
      await expect(page.locator(".quiz-start")).toContainText(
        "5 matching questions",
      );
    },
  );
  await run("exam mode withholds feedback until submission", async () => {
    await page.getByRole("button", { name: "Exam", exact: false }).click();
    await page.getByRole("button", { name: "Start 5-question quiz" }).click();
    for (let i = 0; i < 5; i++) {
      if (await page.locator(".answer-options button").count())
        await page.locator(".answer-options button").first().click();
      await expect(page.locator(".answer-feedback")).toHaveCount(0);
      await page
        .getByRole("button", {
          name: i === 4 ? "Submit quiz" : "Next question",
          exact: true,
        })
        .click();
    }
    await expect(page.locator(".answer-review")).toHaveCount(5);
  });
  await run(
    "visual and click quizzes hide labels and grade precise highlighted regions",
    async () => {
      await page
        .getByRole("button", { name: "Body Explorer", exact: true })
        .click();
      await page.getByRole("button", { name: "Quizzes", exact: true }).click();
      await page
        .getByLabel("Organ system", { exact: true })
        .selectOption("muscular");
      await page
        .getByRole("checkbox", { name: "Previously missed questions" })
        .uncheck();
      await page
        .getByLabel("Question type", { exact: true })
        .selectOption("click");
      await page
        .getByLabel("Question count", { exact: true })
        .selectOption("5");
      await page.getByRole("button", { name: "Start 5-question quiz" }).click();
      const target = (
        await page.locator(".question-card h2").textContent()
      ).match(/Select the (.*) on the anterior/)[1];
      await expect(page.locator(".quiz-anatomy .atlas-label")).toHaveCount(0);
      await page
        .locator(
          `.quiz-anatomy [data-structure="${target.toLowerCase().replaceAll(" ", "-")}"]`,
        )
        .click();
      await page
        .getByRole("button", { name: "Check answer", exact: true })
        .click();
      await expect(page.locator(".answer-feedback")).toContainText(
        "That’s right.",
      );
      await page.getByRole("button", { name: "Exit session" }).click();
      await page
        .getByLabel("Question type", { exact: true })
        .selectOption("image");
      await page.getByRole("button", { name: "Start 5-question quiz" }).click();
      await expect(page.locator(".quiz-anatomy .atlas-label")).toHaveCount(0);
      await expect(
        page.locator(".quiz-anatomy .atlas-area.selected polygon"),
      ).toHaveCount(1);
      await page.getByRole("button", { name: "Exit session" }).click();
    },
  );
  await run(
    "PowerPoint import, source review, and course-only quiz",
    async () => {
      await page
        .getByRole("button", { name: "My materials", exact: true })
        .click();
      const zip = new JSZip();
      zip.file(
        "ppt/slides/slide1.xml",
        '<?xml version="1.0"?><p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:t>Humerus: long bone of the arm</a:t></p:sld>',
      );
      await page.locator(".upload-zone input").setInputFiles({
        name: "Anatomy lecture.pptx",
        mimeType:
          "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        buffer: await zip.generateAsync({ type: "nodebuffer" }),
      });
      await expect(page.locator(".source-text")).toContainText(
        "Humerus: long bone of the arm",
      );
      await page
        .getByLabel("Answer / structure name", { exact: true })
        .fill("Humerus");
      await page
        .getByLabel("Definition or identification clue", { exact: true })
        .fill("Long bone of the arm");
      await page
        .getByRole("checkbox", { name: /I checked this answer/ })
        .check();
      await page
        .getByRole("button", { name: "Save reviewed card", exact: true })
        .click();
      await expect(page.locator(".course-card")).toContainText(
        "page / slide 1",
      );
      await page
        .getByRole("button", { name: "Practice 1 reviewed cards" })
        .click();
      await page.getByRole("button", { name: "Start 1-question quiz" }).click();
      await expect(page.locator(".question-card h2")).toContainText(
        "Anatomy lecture.pptx",
      );
      await page.locator(".typed-answer input").fill("HUMERUS");
      await page
        .getByRole("button", { name: "Check answer", exact: true })
        .click();
      await expect(page.locator(".answer-feedback")).toContainText(
        "That’s right.",
      );
      await page
        .getByRole("button", { name: "Submit quiz", exact: true })
        .click();
      await expect(page.locator(".score-circle")).toContainText("100");
    },
  );
  await run(
    "PDF extraction and image transcription flags preserve source references",
    async () => {
      await page
        .getByRole("button", { name: "My materials", exact: true })
        .click();
      const stream =
        "BT /F1 12 Tf 72 720 Td (Simple cuboidal: kidney tubules) Tj ET";
      const objects = [
        "<< /Type /Catalog /Pages 2 0 R >>",
        "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
        "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
        `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
      ];
      let pdf = "%PDF-1.4\n";
      const offsets = [0];
      objects.forEach((o, i) => {
        offsets.push(Buffer.byteLength(pdf));
        pdf += `${i + 1} 0 obj\n${o}\nendobj\n`;
      });
      const xref = Buffer.byteLength(pdf);
      pdf += `xref\n0 6\n0000000000 65535 f \n${offsets
        .slice(1)
        .map((n) => String(n).padStart(10, "0") + " 00000 n ")
        .join(
          "\n",
        )}\ntrailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
      await page.locator(".upload-zone input").setInputFiles({
        name: "Histology.pdf",
        mimeType: "application/pdf",
        buffer: Buffer.from(pdf),
      });
      await expect(page.locator(".source-text")).toContainText(
        "Simple cuboidal: kidney tubules",
      );
      await expect(page.locator(".source-toolbar")).toContainText(
        "Page / slide",
      );
      await page.locator(".upload-zone input").setInputFiles({
        name: "Study guide.png",
        mimeType: "image/png",
        buffer: Buffer.from(
          "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a6s8AAAAASUVORK5CYII=",
          "base64",
        ),
      });
      await expect(page.locator(".review-note")).toContainText(
        "Image needs transcription",
      );
      await page.reload();
      await page
        .getByRole("button", { name: "My materials", exact: true })
        .click();
      await expect(page.locator(".material-list>button")).toHaveCount(3);
    },
  );
  await run("optional timer submits the exam when time expires", async () => {
    await page.getByRole("button", { name: "Quizzes", exact: true }).click();
    await page
      .getByLabel("Study collection", { exact: true })
      .selectOption("atlas");
    await page
      .getByLabel("Organ system", { exact: true })
      .selectOption("muscular");
    await page.getByRole("checkbox", { name: "10-minute timer" }).check();
    await page.getByRole("button", { name: "Exam", exact: false }).click();
    await page.clock.install();
    await page.getByRole("button", { name: "Start 10-question quiz" }).click();
    await page.clock.runFor(600000);
    await expect(page.locator(".score-circle")).toBeVisible();
    await expect(page.locator(".answer-review")).toHaveCount(10);
  });
  await run("mobile layout stays within the viewport", async () => {
    await page.setViewportSize({ width: 390, height: 844 });
    for (const name of ["Body Explorer", "Tissues", "Quizzes", "My Progress"]) {
      await page.getByRole("button", { name, exact: true }).click();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBe(true);
    }
  });
  expect(errors).toEqual([]);
  console.log(`${passed} browser workflows passed; no browser runtime errors.`);
} finally {
  await browser.close();
}
