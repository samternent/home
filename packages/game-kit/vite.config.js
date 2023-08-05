import { resolve } from "path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

// https://vitejs.dev/config/
export default defineConfig({
  output: {
    exports: "named",
  },
  build: {
    lib: {
      // Could also be a dictionary or array of multiple entry points
      entry: resolve(__dirname, "src/index.ts"),
      name: "concords-game-kit",
      // the proper extensions will be added
      fileName: "game-kit",
    },

    rollupOptions: {},
  },
  plugins: [
    dts({
      tsConfigFilePath: resolve("../../tsconfig.json"),
    }),
  ],
});
