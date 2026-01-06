import { resolve } from "path";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";

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
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
});
