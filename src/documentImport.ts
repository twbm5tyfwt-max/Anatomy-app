import JSZip from "jszip";
import * as pdfjs from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { storeFile } from "./storage";
import type { Reference } from "./studyCollections";
pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
export async function importReferences(file: File): Promise<Reference[]> {
  if (file.size > 25 * 1024 * 1024)
    throw new Error("Choose a file smaller than 25 MB.");
  const pages: string[] = [];
  let kind: Reference["kind"] = "note";
  if (/\.pdf$/i.test(file.name)) {
    kind = "page";
    const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() })
      .promise;
    try {
      for (let p = 1; p <= pdf.numPages; p++) {
        const text = await (await pdf.getPage(p)).getTextContent();
        pages.push(text.items.map((i) => ("str" in i ? i.str : "")).join(" "));
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
    pages.push("");
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
  }));
}
