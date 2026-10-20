import { createWorker, OEM } from "tesseract.js";
import workerUrl from "tesseract.js/dist/worker.min.js?url";
import coreUrl from "tesseract.js-core/tesseract-core-lstm.wasm.js?url";
import languageUrl from "@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz?url";
export async function readImageText(
  image: Blob | HTMLCanvasElement,
  progress?: (message: string) => void,
) {
  progress?.("Preparing local image reader…");
  const absolute = (url: string) => new URL(url, location.href).href;
  // Route the worker's fixed language filename to Vite's bundled asset.
  // This also works with embedded data URLs when opened from the offline HTML.
  const script = `const bundledLanguage=${JSON.stringify(absolute(languageUrl))};const originalFetch=self.fetch.bind(self);self.fetch=(url,options)=>originalFetch(String(url).endsWith('/eng.traineddata.gz')?bundledLanguage:url,options);importScripts(${JSON.stringify(absolute(workerUrl))});`;
  const localWorker = URL.createObjectURL(
    new Blob([script], { type: "text/javascript" }),
  );
  const worker = await createWorker("eng", OEM.LSTM_ONLY, {
    workerPath: localWorker,
    workerBlobURL: false,
    corePath: absolute(coreUrl) + "#core.js",
    langPath: "./bundled-language",
    cacheMethod: "none",
    logger: (m) =>
      progress?.(`${m.status} · ${Math.round((m.progress || 0) * 100)}%`),
  });
  try {
    await worker.setParameters({ preserve_interword_spaces: "1" });
    const result = await worker.recognize(image);
    return { text: result.data.text, confidence: result.data.confidence };
  } finally {
    await worker.terminate();
    URL.revokeObjectURL(localWorker);
  }
}
