import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

const configDir = dirname(fileURLToPath(import.meta.url));
const utilsSource = resolve(configDir, "../utils/src/index.ts");

export default defineConfig({
  build: {
    outDir: "dist",
    sourcemap: true,
    target: "es2020",
    minify: false,
    lib: {
      entry: resolve(configDir, "src/index.ts"),
      name: "ternentPixpaxCore",
      fileName: "index",
      formats: ["es"],
    },
    rollupOptions: {
      output: {
        format: "es",
        entryFileNames: "index.js",
      },
    },
  },
  plugins: [
    dts({
      tsConfigFilePath: resolve(configDir, "tsconfig.json"),
    }),
  ],
  test: {
    environment: "node",
    alias: {
      "ternent-utils": utilsSource,
    },
    include: ["test/**/*.test.ts"],
  },
});
