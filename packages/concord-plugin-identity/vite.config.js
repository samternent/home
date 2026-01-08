import { resolve } from "path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  output: {
    exports: "named",
  },
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "concord-plugin-identity",
      fileName: "concord-plugin-identity",
    },
    rollupOptions: {},
  },
  plugins: [
    dts({
      tsConfigFilePath: resolve("../../tsconfig.json"),
    }),
  ],
});
