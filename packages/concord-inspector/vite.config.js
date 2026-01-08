import { resolve } from "path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  output: {
    exports: "named",
  },
  build: {
    lib: {
      entry: resolve(__dirname, "src/replay.ts"),
      name: "concord-inspector",
      fileName: "concord-inspector",
    },
    rollupOptions: {},
  },
  plugins: [
    dts({
      tsConfigFilePath: resolve("../../tsconfig.json"),
      include: ["src/**/*.ts"],
    }),
  ],
});
