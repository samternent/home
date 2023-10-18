import { resolve } from "path";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import federation from "@originjs/vite-plugin-federation";

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    target: "esnext",
    minify: true,
    cssCodeSplit: false,
  },
  plugins: [
    vue(),
    federation({
      name: "ternent-ui",
      filename: "ternentUIEntry.js",
      exposes: {
        "./Button": "./src/components/action/Button.vue",
      },
      shared: ["vue", "tailwindcss"],
    }),
  ],
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
});
