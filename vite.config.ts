import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { VitePWA } from "vite-plugin-pwa";
import Markdown from "vite-plugin-md";

const domain = "footballsocial.localhost";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    proxy: {
      "/api": {
        target: `http://localhost:4003`,
        changeOrigin: true,
      },
    },
    https: {
      key: "./localhost.key",
      cert: "./localhost.crt",
    },
    // host: domain,
    // hmr: {
    //   host: domain,
    // },
  },
  plugins: [
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
    // basicSsl(),
  ],
});
