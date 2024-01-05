import { resolve } from "path";
import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import { VitePWA } from "vite-plugin-pwa";
import { ViteEjsPlugin } from "vite-plugin-ejs";
import { version } from "./package.json";

/** @type {import('vite').UserConfig} */
export default ({ mode }) => {
  // Load app-level env vars to node-level env vars.
  process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };

  return defineConfig({
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
        "@": resolve(__dirname, "./src"),
      },
    },
    plugins: [
      ViteEjsPlugin(() => ({
        __APP_VERSION__: version,
        __APP_TITLE__: process.env.VITE_APP_NAME,
        __APP_DESCRIPTION__: process.env.VITE_APP_NAME,
      })),
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
};
