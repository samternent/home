import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";
import Markdown from "vite-plugin-vue-markdown";

export default defineConfig({
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
