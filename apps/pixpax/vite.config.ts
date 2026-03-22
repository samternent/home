import { resolve } from "node:path";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import { appConfig, appSeoConfig } from "./src/app/config/app.generated";

const appThemeData = `${appConfig.themeName}-${appConfig.defaultThemeMode}`;
const themeBootstrapScript = `(function(){var defaultMode=${JSON.stringify(appConfig.defaultThemeMode)};var themePrefix=${JSON.stringify(appConfig.themeName)};var root=document.documentElement;root.dataset.themePrefix=themePrefix;root.setAttribute("data-theme",themePrefix+"-"+defaultMode);}());`;
const workspaceRoot = resolve(__dirname, "../../packages");

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

const PRECACHE_SCRIPT_LIMIT_BYTES = 256 * 1024;

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalizedId = id.replaceAll("\\", "/");

          if (normalizedId.includes("/node_modules/vue") || normalizedId.includes("/vue-router/")) {
            return "vendor-vue";
          }

          if (normalizedId.includes("/packages/ternent-ui/")) {
            return "vendor-ui";
          }

          if (
            normalizedId.includes("/node_modules/better-auth/") ||
            normalizedId.includes("/node_modules/@better-auth/")
          ) {
            return "vendor-auth";
          }

          if (normalizedId.includes("/node_modules/")) {
            return "vendor-misc";
          }
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
      "@ternent/concord": resolve(workspaceRoot, "concord/src/index.ts"),
      "@ternent/identity": resolve(workspaceRoot, "identity-v2/src/index.ts"),
      "@ternent/ledger": resolve(workspaceRoot, "ledger-v2/src/index.ts"),
      "@ternent/pixpax-concord": resolve(workspaceRoot, "pixpax-concord/src/index.ts"),
      "@ternent/pixpax-core": resolve(workspaceRoot, "pixpax-core/src/index.ts"),
      "@ternent/pixpax-issuer": resolve(workspaceRoot, "pixpax-issuer/src/index.ts"),
      "@ternent/seal-cli": resolve(workspaceRoot, "seal-cli/src/index.ts"),
      "ternent-utils": resolve(workspaceRoot, "utils/src/index.ts"),
    },
  },
  optimizeDeps: {
    exclude: [
      "@ternent/concord",
      "@ternent/identity",
      "@ternent/ledger",
      "@ternent/pixpax-concord",
      "@ternent/pixpax-core",
      "@ternent/pixpax-issuer",
      "@ternent/seal-cli",
      "ternent-utils",
    ],
  },
  server: {
    host: true,
    port: 4173,
    proxy: {
      "/v1": {
        target: "http://localhost:8001",
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: true,
    port: 4173,
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
        manifestTransforms: [
          async (entries) => {
            const manifest = entries.filter((entry) => {
              if (!entry.url.endsWith(".js")) {
                return true;
              }
              return (entry.size ?? 0) <= PRECACHE_SCRIPT_LIMIT_BYTES;
            });
            return { manifest, warnings: [] };
          },
        ],
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
            urlPattern: ({ request, url }) =>
              request.destination === "script" && url.pathname.includes("/assets/"),
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "app-scripts",
              expiration: {
                maxEntries: 40,
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
