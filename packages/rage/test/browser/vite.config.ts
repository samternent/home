import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import topLevelAwait from "vite-plugin-top-level-await";
import wasm from "vite-plugin-wasm";

const browserRoot = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(browserRoot, "../..");

export default defineConfig({
  root: browserRoot,
  plugins: [wasm(), topLevelAwait()],
  resolve: {
    alias: {
      "@ternent/rage": resolve(packageRoot, "dist/index.js"),
    },
  },
});
