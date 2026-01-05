import { resolve } from "path";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import dts from "vite-plugin-dts";

// https://vitejs.dev/config/
export default defineConfig({
  output: {
    exports: "named",
  },
  build: {
    lib: {
      entry: {
        primitives: resolve(__dirname, "src/primitives/index.ts"),
        components: resolve(__dirname, "src/components/index.js"),
        use: resolve(__dirname, "src/use/index.js"),
        themes: resolve(__dirname, "src/themes.js"),
      },
    },

    rollupOptions: {
      external: ["vue", "@vueuse/core", "luxon"],
    },
    target: "esnext",
  },
  plugins: [
    vue(),
    // dts({
    //   tsConfigFilePath: resolve("./tsconfig.json"),
    // }),
  ],
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
});
