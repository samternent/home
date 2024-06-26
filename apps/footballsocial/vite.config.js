import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { VitePWA } from "vite-plugin-pwa";
import { ViteEjsPlugin } from "vite-plugin-ejs";
import { version } from "./package.json";

const scriptFilePath = fileURLToPath(import.meta.url);
const scriptDirectoryPath = dirname(scriptFilePath);

// https://vitejs.dev/config/
export default defineConfig({
  envDir: resolve("../../"),
  server: {
    proxy: {
      "/api": {
        target: `http://localhost:8002`,
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      "@": resolve(scriptDirectoryPath, "src"),
    },
    extensions: [".js"],
  },
  plugins: [
    ViteEjsPlugin(() => ({ __APP_VERSION__: version })),
    vue({
      include: [/\.vue$/, /\.md$/],
    }),
    VitePWA({
      registerType: "autoUpdate",
      workbox: {
        navigateFallbackDenylist: [/^\/api/],
      },
    }),
  ],
});
