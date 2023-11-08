import { resolve } from "path";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// https://vitejs.dev/config/
export default defineConfig({
  output: {
    exports: "named",
  },
  build: {
    lib: {
      // Could also be a dictionary or array of multiple entry points
      entry: resolve(__dirname, "src/components/index.js"),
      name: "ternent-ui",
      // the proper extensions will be added
      fileName: "ternent-ui",
    },

    rollupOptions: {
      external: ["vue"],
    },
    target: "esnext",
  },
  plugins: [vue()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
});
