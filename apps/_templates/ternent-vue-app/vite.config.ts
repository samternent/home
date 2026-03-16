import { resolve } from "node:path";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import { appConfig, appSeoConfig } from "./src/app/config/app.generated";

const appThemeData = `${appConfig.themeName}-${appConfig.defaultThemeMode}`;
const themeStorageKey = `${appConfig.appId}/theme-mode`;
const themeBootstrapScript = `(function(){var storageKey=${JSON.stringify(themeStorageKey)};var defaultMode=${JSON.stringify(appConfig.defaultThemeMode)};var themePrefix=${JSON.stringify(appConfig.themeName)};var mode=defaultMode;try{var stored=window.localStorage.getItem(storageKey);if(stored==="dark"||stored==="light"){mode=stored;}}catch{}document.documentElement.setAttribute("data-theme",themePrefix+"-"+mode);}());`;

function createIndexHtmlTransformPlugin() {
  return {
    name: "ternent-app-index-html",
    transformIndexHtml(html: string) {
      return html
        .replaceAll("__APP_LANG__", appSeoConfig.lang)
        .replaceAll("__APP_TITLE__", appConfig.appTitle)
        .replaceAll("__APP_DESCRIPTION__", appSeoConfig.description)
        .replaceAll("__APP_THEME_COLOR__", appSeoConfig.themeColor)
        .replaceAll("__APP_THEME_DATA__", appThemeData)
        .replaceAll("__APP_THEME_BOOTSTRAP__", themeBootstrapScript);
    },
  };
}

const pwaManifest = {
  id: "/",
  name: appConfig.appTitle,
  short_name: appSeoConfig.shortName,
  description: appSeoConfig.description,
  theme_color: appSeoConfig.themeColor,
  background_color: appSeoConfig.backgroundColor,
  display: "standalone",
  start_url: "/",
  scope: "/",
  icons: [
    {
      src: "/icons/icon-192.png",
      sizes: "192x192",
      type: "image/png",
    },
    {
      src: "/icons/icon-512.png",
      sizes: "512x512",
      type: "image/png",
    },
    {
      src: "/icons/maskable-512.png",
      sizes: "512x512",
      type: "image/png",
      purpose: "maskable",
    },
  ],
};

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
      "@ternent/seal-cli/proof": resolve(
        __dirname,
        "../../../packages/seal-cli/src/proof.ts",
      ),
    },
  },
  plugins: [
    vue(),
    tailwindcss(),
    createIndexHtmlTransformPlugin(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "icons/icon-192.png", "icons/icon-512.png", "icons/maskable-512.png"],
      manifest: pwaManifest,
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        navigateFallbackDenylist: [/^\/v1\//],
        skipWaiting: true,
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.mode === "navigate",
            handler: "NetworkFirst",
            options: {
              cacheName: "app-pages",
              precacheFallback: {
                fallbackURL: "/offline.html",
              },
            },
          },
          {
            urlPattern: ({ request }) => request.destination === "image" || request.destination === "font",
            handler: "CacheFirst",
            options: {
              cacheName: "app-media",
              expiration: {
                maxEntries: 120,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
          {
            urlPattern: ({ url }) => url.pathname.startsWith("/v1/"),
            handler: "NetworkFirst",
            options: {
              cacheName: "app-api",
            },
          },
        ],
      },
    }),
  ],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/tests/unit/setup.ts"],
    globals: true,
    include: ["src/tests/unit/**/*.test.ts"],
    exclude: ["src/tests/e2e/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
    },
  },
  ssgOptions: {
    formatting: "minify",
  },
});
