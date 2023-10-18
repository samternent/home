import { resolve } from "path";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { VitePWA } from "vite-plugin-pwa";
import Markdown from "vite-plugin-md";
import { ViteEjsPlugin } from "vite-plugin-ejs";
import federation from "@originjs/vite-plugin-federation";
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
    federation({
      name: 'ui',
      remotes: {
        'ternent/ui': "http://127.0.0.1:5001/assets/ternentUIEntry.js",
      },
      shared: ['vue']
    })
  ],
});
