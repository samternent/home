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
        "./TButton": "./src/components/action/TButton.vue",
        "./TSpinner": "./src/components/TSpinner.vue",
        "./TTabs": "./src/components/TTabs.vue",
        "./TBrandHeader": "./src/components/TBrandHeader.vue",
        "./style": "./src/style.js",
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
