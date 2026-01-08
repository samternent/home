import { defineConfig } from "vite";
import { resolve } from "path";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";
import Markdown from "vite-plugin-vue-markdown";

export default defineConfig({
  resolve: {
    alias: {
      fs: resolve(__dirname, "src/shims/fs.ts"),
    },
  },
  build: {
    assetsInlineLimit: 0,
  },
  plugins: [
    vue({ include: [/\.vue$/, /\.md$/] }),
    tailwindcss(),
    Markdown({ wrapperClasses: "prose" }),
  ],
  ssgOptions: {},
});
