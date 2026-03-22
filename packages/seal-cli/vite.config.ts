import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import { createPackageExternal, resolvePackageDir } from "../../scripts/vite/package-lib-config";

const configDir = dirname(fileURLToPath(import.meta.url));
const external = createPackageExternal(resolvePackageDir(import.meta.url), {
  includeNodeBuiltins: true,
});

export default defineConfig(({ mode }) => {
  const proofOnly = mode === "proof-only";

  return {
    build: {
      outDir: "dist",
      target: "node20",
      sourcemap: true,
      minify: false,
      rollupOptions: {
        preserveEntrySignatures: "strict",
        input: proofOnly
          ? {
              proof: resolve(configDir, "src/proof.ts"),
              crypto: resolve(configDir, "src/crypto.ts"),
            }
          : {
              cli: resolve(configDir, "src/cli.ts"),
              index: resolve(configDir, "src/index.ts"),
              proof: resolve(configDir, "src/proof.ts"),
              artifact: resolve(configDir, "src/artifact.ts"),
              manifest: resolve(configDir, "src/manifest.ts"),
              crypto: resolve(configDir, "src/crypto.ts"),
              errors: resolve(configDir, "src/errors.ts"),
            },
        external,
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
        "@ternent/armour": resolve(configDir, "../armour/src/index.ts"),
        "@ternent/identity": resolve(configDir, "../identity-v2/src/index.ts"),
        "@ternent/rage": resolve(configDir, "../rage/src/index.ts"),
        "ternent-utils": resolve(configDir, "../utils/src/index.ts"),
      },
    },
  };
});
