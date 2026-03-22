import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import { createPackageExternal, resolvePackageDir } from "../../scripts/vite/package-lib-config";

const configDir = dirname(fileURLToPath(import.meta.url));
const external = createPackageExternal(resolvePackageDir(import.meta.url));
const alias = {
  "@ternent/identity": resolve(configDir, "../identity-v2/src/index.ts"),
  "@ternent/pixpax-core": resolve(configDir, "../pixpax-core/src/index.ts"),
  "@ternent/seal-cli/proof": resolve(configDir, "../seal-cli/src/proof.ts"),
  "ternent-utils": resolve(configDir, "../utils/src/index.ts"),
};

export default defineConfig({
  build: {
    outDir: "dist",
    sourcemap: true,
    target: "es2020",
    minify: false,
    lib: {
      entry: resolve(configDir, "src/index.ts"),
      name: "ternentPixpaxIssuer",
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
    alias,
    include: ["test/**/*.test.ts"],
  },
});
