import { resolve } from "path";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { VitePWA } from "vite-plugin-pwa";
import Markdown from "vite-plugin-md";
import { ViteEjsPlugin } from "vite-plugin-ejs";
import { version } from "./package.json";

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
  plugins: [
    ViteEjsPlugin(() => {
      return {
        __APP_VERSION__: version,
      };
    }),
    vue({
      include: [/\.vue$/, /\.md$/],
    }),
    VitePWA({
      registerType: "autoUpdate",
      workbox: {
        navigateFallbackDenylist: [/^\/api/],
      },
    }),
    Markdown(),
  ],
});
