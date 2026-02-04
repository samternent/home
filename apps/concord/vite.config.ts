import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";
import Markdown from "vite-plugin-vue-markdown";
import { ViteEjsPlugin } from "vite-plugin-ejs";
import { version } from "./package.json";

export default defineConfig({
  build: {
    assetsInlineLimit: 0,
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
  ],
  ssgOptions: {
    includedRoutes(paths) {
      // exclude workspace from pre-render
      return paths.filter((p) => !p.startsWith("/workspace"));
    },
  },
});
