import { resolve } from "path";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { VitePWA } from "vite-plugin-pwa";
import Markdown from "vite-plugin-md";
import { ViteEjsPlugin } from "vite-plugin-ejs";
import { version } from "./package.json";

const domain = "footballsocial.localhost";

// https://vitejs.dev/config/
export default defineConfig({
  envDir: resolve("../../"),
  server: {
    proxy: {
      "/api": {
        target: `http://localhost:4002`,
        changeOrigin: true,
      },
    },
    https: {
      key: "./footballsocial.localhost+2-key.pem",
      cert: "./footballsocial.localhost+2.pem",
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
