import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

const configDir = dirname(fileURLToPath(import.meta.url));
const identitySource = resolve(configDir, "../identity-v2/src/index.ts");
const rageSource = resolve(configDir, "../rage/src/index.ts");

export default defineConfig({
  build: {
    outDir: "dist",
    sourcemap: true,
    target: "es2020",
    minify: false,
    lib: {
      entry: resolve(configDir, "src/index.ts"),
      name: "ternentArmour",
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
      "@ternent/identity": identitySource,
      "@ternent/rage": rageSource,
    },
    include: ["test/**/*.test.ts"],
  },
});
