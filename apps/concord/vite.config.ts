import { defineConfig } from "vite";
import { resolve } from "path";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";
import Markdown from "vite-plugin-vue-markdown";
import { ViteEjsPlugin } from "vite-plugin-ejs";
import svgLoader from "vite-svg-loader";
import { version } from "./package.json";

export default defineConfig({
  build: {
    assetsInlineLimit: 0,
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        spa: resolve(__dirname, "spa.html"),
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
      const excludedPrefixes = ["/workspace", "/pixpax"];
      return paths.filter(
        (p) => !excludedPrefixes.some((prefix) => p.startsWith(prefix))
      );
    },
  },
});
