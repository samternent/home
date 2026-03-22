import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const configDir = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  build: {
    outDir: "dist",
    emptyOutDir: false,
    sourcemap: true,
    target: "es2020",
    minify: false,
    lib: {
      entry: resolve(configDir, "src/index.ts"),
      name: "ternentConcordBrowser",
      fileName: () => "browser.js",
      formats: ["es"],
    },
    rollupOptions: {
      output: {
        format: "es",
        inlineDynamicImports: true,
      },
    },
  },
});
