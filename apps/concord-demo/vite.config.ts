import { defineConfig } from "vite";
import { resolve } from "path";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";
import Markdown from "vite-plugin-vue-markdown";
import { ViteEjsPlugin } from "vite-plugin-ejs";
import svgLoader from "vite-svg-loader";
import { version } from "./package.json";

export default defineConfig({
  resolve: {
    alias: [
      {
        find: "ternent-ui/components",
        replacement: resolve(__dirname, "../../packages/ternent-ui/src/components/index.js"),
      },
      {
        find: "ternent-ui/patterns",
        replacement: resolve(__dirname, "../../packages/ternent-ui/src/patterns/index.ts"),
      },
      {
        find: "ternent-ui/primitives",
        replacement: resolve(__dirname, "../../packages/ternent-ui/src/primitives/index.ts"),
      },
      {
        find: "@ternent/concord-protocol",
        replacement: resolve(__dirname, "../../packages/concord-protocol/src/index.ts"),
      },
      {
        find: "ternent-encrypt",
        replacement: resolve(__dirname, "../../packages/encrypt/src/index.ts"),
      },
      {
        find: "ternent-identity",
        replacement: resolve(__dirname, "../../packages/identity/src/index.ts"),
      },
      {
        find: "ternent-ledger-vue",
        replacement: resolve(__dirname, "../../packages/ternent-ledger-vue/src/index.ts"),
      },
      {
        find: "ternent-ledger",
        replacement: resolve(__dirname, "../../packages/ledger/src/index.ts"),
      },
      {
        find: "ternent-utils",
        replacement: resolve(__dirname, "../../packages/utils/src/index.ts"),
      },
    ],
  },
  build: {
    assetsInlineLimit: 0,
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        spa: resolve(__dirname, "spa.html"),
        pixpax: resolve(__dirname, "pixpax.html"),
      },
    },
  },
  server: {
    proxy: {
      "/v1": {
        target: "http://localhost:8001",
        changeOrigin: true,
      },
    },
  },
  plugins: [
    ViteEjsPlugin(() => ({
      __APP_VERSION__: version,
    })),
    vue({ include: [/\.vue$/, /\.md$/] }),
    tailwindcss(),
    Markdown({ wrapperClasses: "prose dark:prose-invert" }),
    svgLoader(),
  ],
  ssgOptions: {
    includedRoutes(paths) {
      // exclude app-only routes from pre-render
      return paths.filter((p) => !p.startsWith("/workspace"));
    },
  },
});
