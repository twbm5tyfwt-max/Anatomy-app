import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  base: "./",
  plugins: [react()],
  server: { host: "0.0.0.0", port: 3000 },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/pdfjs-dist")) return "pdf-reader";
          if (id.includes("node_modules/jszip")) return "powerpoint-reader";
        },
      },
    },
  },
});
