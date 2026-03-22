import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

const configDir = dirname(fileURLToPath(import.meta.url));

// https://vitejs.dev/config/
export default defineConfig({
  output: {
    exports: "named",
  },
  build: {
    outDir: "dist",
    minify: false,
    lib: {
      entry: resolve(configDir, "src/index.ts"),
      name: "ternent-utils",
      fileName: "utils",
      formats: ["es"],
    },
    rollupOptions: {
      output: {
        format: "es",
        entryFileNames: "utils.es.js",
      },
    },
  },
  plugins: [
    dts({
      tsConfigFilePath: resolve(configDir, "../../tsconfig.json"),
    }),
  ],
});
