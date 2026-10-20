import JSZip from "jszip";
import * as pdfjs from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { storeFile } from "./storage";
import type { Reference } from "./studyCollections";
pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
export async function importReferences(
  file: File,
  progress?: (message: string) => void,
): Promise<Reference[]> {
  if (file.size > 25 * 1024 * 1024)
    throw new Error("Choose a file smaller than 25 MB.");
  const pages: string[] = [];
  let kind: Reference["kind"] = "note";
  let confidence: number | undefined;
  let extraction: string | undefined;
  if (/\.pdf$/i.test(file.name)) {
    kind = "page";
    const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() })
      .promise;
    try {
      for (let p = 1; p <= pdf.numPages; p++) {
        const page = await pdf.getPage(p);
        const text = await page.getTextContent();
        let extracted = text.items
          .map((i) => ("str" in i ? i.str : ""))
          .join(" ");
        if (extracted.trim().length < 20 && p <= 20) {
          progress?.(`Reading scanned page ${p} locally…`);
          const natural = page.getViewport({ scale: 1 });
          const viewport = page.getViewport({
            scale: Math.min(2, 3000 / Math.max(natural.width, natural.height)),
          });
          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          await page.render({
            canvas,
            canvasContext: canvas.getContext("2d")!,
            viewport,
          }).promise;
          const { readImageText } = await import("./imageText");
          const result = await readImageText(canvas, progress);
          extracted = result.text;
          extraction = "Local OCR; review against the original page";
        }
        pages.push(extracted);
        if (pages.join("").length > 900000)
          throw new Error("Extract fewer than 900,000 characters at once.");
      }
    } finally {
      await pdf.destroy();
    }
  } else if (/\.pptx$/i.test(file.name)) {
    kind = "slide";
    const zip = await JSZip.loadAsync(file);
    const slides = Object.keys(zip.files)
      .filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n))
      .sort((a, b) => +a.match(/slide(\d+)/)![1] - +b.match(/slide(\d+)/)![1]);
    for (const name of slides) {
      const xml = new DOMParser().parseFromString(
        await zip.file(name)!.async("text"),
        "application/xml",
      );
      pages.push(
        [...xml.getElementsByTagName("a:t")]
          .map((e) => e.textContent)
          .join("\n"),
      );
      if (pages.join("").length > 900000)
        throw new Error("Extract fewer than 900,000 characters at once.");
    }
    if (!pages.length)
      throw new Error(
        "No slides found. Legacy .ppt needs conversion to .pptx or PDF.",
      );
  } else if (file.type.startsWith("image/")) {
    kind = "image";
    const { readImageText } = await import("./imageText");
    const bitmap = await createImageBitmap(file).catch(() => {
      throw new Error(
        "This image cannot be decoded. Export it as JPG or PNG and try again.",
      );
    });
    const factor = Math.min(1, 3000 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * factor);
    canvas.height = Math.round(bitmap.height * factor);
    canvas
      .getContext("2d")!
      .drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const result = await readImageText(canvas, progress);
    pages.push(result.text);
    confidence = result.confidence;
    extraction = "Local English OCR; review labels, spelling and laterality";
  } else if (/\.(txt|md|csv)$/i.test(file.name)) pages.push(await file.text());
  else throw new Error("Use PDF, PPTX, text/Markdown notes, or an image.");
  if (pages.join("").length > 900000)
    throw new Error("This file contains too much extracted text.");
  const fileId = crypto.randomUUID();
  await storeFile(file, fileId);
  return pages.map((text, i) => ({
    file: file.name,
    page: i + 1,
    text,
    kind,
    fileId,
    extraction,
    confidence,
  }));
}
