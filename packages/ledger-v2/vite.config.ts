import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

const configDir = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@ternent/armour": resolve(configDir, "../armour/src/index.ts"),
      "@ternent/concord-protocol": resolve(
        configDir,
        "../concord-protocol/src/index.ts"
      ),
      "@ternent/identity": resolve(configDir, "../identity-v2/src/index.ts"),
      "@ternent/rage": resolve(configDir, "../rage/src/index.ts"),
      "@ternent/seal-cli": resolve(configDir, "../seal-cli/src/index.ts"),
      "ternent-utils": resolve(configDir, "../utils/src/index.ts")
    }
  },
  build: {
    outDir: "dist",
    sourcemap: true,
    target: "es2020",
    minify: false,
    lib: {
      entry: resolve(configDir, "src/index.ts"),
      name: "ternentLedger",
      fileName: "index",
      formats: ["es"]
    },
    rollupOptions: {
      external: [
        "@ternent/armour",
        "@ternent/concord-protocol",
        "@ternent/identity",
        "@ternent/seal-cli"
      ],
      output: {
        format: "es",
        entryFileNames: "index.js"
      }
    }
  },
  plugins: [
    dts({
      tsConfigFilePath: resolve(configDir, "tsconfig.json")
    })
  ],
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"]
  }
});
