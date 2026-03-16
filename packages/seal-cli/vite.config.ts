import { builtinModules } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const configDir = dirname(fileURLToPath(import.meta.url));
const external = new Set([
  ...builtinModules,
  ...builtinModules.map((name) => `node:${name}`),
]);

export default defineConfig({
  resolve: {
    alias: {
      "@ternent/identity": resolve(configDir, "../identity-v2/src/index.ts"),
    },
  },
  build: {
    outDir: "dist",
    target: "node20",
    sourcemap: true,
    minify: false,
    rollupOptions: {
      preserveEntrySignatures: "strict",
      input: {
        cli: resolve(configDir, "src/cli.ts"),
        index: resolve(configDir, "src/index.ts"),
        proof: resolve(configDir, "src/proof.ts"),
        manifest: resolve(configDir, "src/manifest.ts"),
        crypto: resolve(configDir, "src/crypto.ts"),
        errors: resolve(configDir, "src/errors.ts"),
      },
      external: Array.from(external),
      output: {
        format: "es",
        entryFileNames: "[name].js",
        chunkFileNames: "chunks/[name]-[hash].js",
      },
    },
  },
  test: {
    environment: "node",
    alias: {
      "@ternent/identity": resolve(configDir, "../identity-v2/src/index.ts"),
      "ternent-utils": resolve(configDir, "../utils/src/index.ts"),
    },
  },
});
