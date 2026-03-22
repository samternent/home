import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import { createPackageExternal, resolvePackageDir } from "../../scripts/vite/package-lib-config";

const configDir = dirname(fileURLToPath(import.meta.url));
const external = createPackageExternal(resolvePackageDir(import.meta.url));

export default defineConfig({
  build: {
    outDir: "dist",
    sourcemap: true,
    target: "es2020",
    minify: false,
    lib: {
      entry: resolve(configDir, "src/index.ts"),
      name: "ternentPixpaxConcord",
      fileName: "index",
      formats: ["es"],
    },
    rollupOptions: {
      external,
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
    include: ["test/**/*.test.ts"],
  },
});
