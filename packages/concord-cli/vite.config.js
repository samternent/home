import { resolve, dirname } from "path";
import { defineConfig } from "vite";
import { fileURLToPath } from "url";

const configDir = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  build: {
    lib: {
      entry: resolve(configDir, "src/index.ts"),
      name: "concord-cli",
      fileName: "index",
      formats: ["es"],
    },
    rollupOptions: {
      external: [
        "node:fs",
        "node:path",
        "node:process",
        "node:url",
      ],
      output: {
        banner: "#!/usr/bin/env node",
      },
    },
  },
});
