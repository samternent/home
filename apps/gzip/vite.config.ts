import { resolve } from "path";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig({
  envDir: resolve("../../"),
  server: {
    proxy: {
      "/api": {
        target: `http://localhost:4006`,
        changeOrigin: true,
      },
    },
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
  ],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
});
