import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";
import Markdown from "vite-plugin-vue-markdown";

export default defineConfig({
  plugins: [
    vue({ include: [/\.vue$/, /\.md$/] }),
    tailwindcss(),
    Markdown({ wrapperClasses: "prose" }),
  ],
  ssgOptions: {
    includedRoutes(paths, routes) {
      // exclude all the route paths that contains 'playground'
      return paths.filter((i) => !i.includes("playground"));
    },
  },
});
