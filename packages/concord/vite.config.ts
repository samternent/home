import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

const configDir = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  build: {
    outDir: "dist",
    sourcemap: true,
    target: "es2020",
    minify: false,
    lib: {
      entry: resolve(configDir, "src/index.ts"),
      name: "ternentConcord",
      fileName: "index",
    },
    rollupOptions: {},
  },
  plugins: [
    dts({
      tsConfigFilePath: resolve(configDir, "tsconfig.json"),
    }),
  ],
});
