// vite.config.js
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "file:///Users/sam/dev/samternent/home/node_modules/.pnpm/vite@2.9.18/node_modules/vite/dist/node/index.js";
import dts from "file:///Users/sam/dev/samternent/home/node_modules/.pnpm/vite-plugin-dts@1.7.3_vite@2.9.18/node_modules/vite-plugin-dts/dist/index.mjs";
var __vite_injected_original_import_meta_url = "file:///Users/sam/dev/samternent/home/packages/utils/vite.config.js";
var configDir = dirname(fileURLToPath(__vite_injected_original_import_meta_url));
var vite_config_default = defineConfig({
  output: {
    exports: "named"
  },
  build: {
    outDir: "dist",
    minify: false,
    lib: {
      entry: resolve(configDir, "src/index.ts"),
      name: "ternent-utils",
      fileName: "utils",
      formats: ["es"]
    },
    rollupOptions: {
      output: {
        format: "es",
        entryFileNames: "utils.es.js"
      }
    }
  },
  plugins: [
    dts({
      tsConfigFilePath: resolve(configDir, "../../tsconfig.json")
    })
  ]
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvc2FtL2Rldi9zYW10ZXJuZW50L2hvbWUvcGFja2FnZXMvdXRpbHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9Vc2Vycy9zYW0vZGV2L3NhbXRlcm5lbnQvaG9tZS9wYWNrYWdlcy91dGlscy92aXRlLmNvbmZpZy5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vVXNlcnMvc2FtL2Rldi9zYW10ZXJuZW50L2hvbWUvcGFja2FnZXMvdXRpbHMvdml0ZS5jb25maWcuanNcIjtpbXBvcnQgeyBkaXJuYW1lLCByZXNvbHZlIH0gZnJvbSBcIm5vZGU6cGF0aFwiO1xuaW1wb3J0IHsgZmlsZVVSTFRvUGF0aCB9IGZyb20gXCJub2RlOnVybFwiO1xuaW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSBcInZpdGVcIjtcbmltcG9ydCBkdHMgZnJvbSBcInZpdGUtcGx1Z2luLWR0c1wiO1xuXG5jb25zdCBjb25maWdEaXIgPSBkaXJuYW1lKGZpbGVVUkxUb1BhdGgoaW1wb3J0Lm1ldGEudXJsKSk7XG5cbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBvdXRwdXQ6IHtcbiAgICBleHBvcnRzOiBcIm5hbWVkXCIsXG4gIH0sXG4gIGJ1aWxkOiB7XG4gICAgb3V0RGlyOiBcImRpc3RcIixcbiAgICBtaW5pZnk6IGZhbHNlLFxuICAgIGxpYjoge1xuICAgICAgZW50cnk6IHJlc29sdmUoY29uZmlnRGlyLCBcInNyYy9pbmRleC50c1wiKSxcbiAgICAgIG5hbWU6IFwidGVybmVudC11dGlsc1wiLFxuICAgICAgZmlsZU5hbWU6IFwidXRpbHNcIixcbiAgICAgIGZvcm1hdHM6IFtcImVzXCJdLFxuICAgIH0sXG4gICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgb3V0cHV0OiB7XG4gICAgICAgIGZvcm1hdDogXCJlc1wiLFxuICAgICAgICBlbnRyeUZpbGVOYW1lczogXCJ1dGlscy5lcy5qc1wiLFxuICAgICAgfSxcbiAgICB9LFxuICB9LFxuICBwbHVnaW5zOiBbXG4gICAgZHRzKHtcbiAgICAgIHRzQ29uZmlnRmlsZVBhdGg6IHJlc29sdmUoY29uZmlnRGlyLCBcIi4uLy4uL3RzY29uZmlnLmpzb25cIiksXG4gICAgfSksXG4gIF0sXG59KTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBeVQsU0FBUyxTQUFTLGVBQWU7QUFDMVYsU0FBUyxxQkFBcUI7QUFDOUIsU0FBUyxvQkFBb0I7QUFDN0IsT0FBTyxTQUFTO0FBSGtMLElBQU0sMkNBQTJDO0FBS25QLElBQU0sWUFBWSxRQUFRLGNBQWMsd0NBQWUsQ0FBQztBQUd4RCxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixRQUFRO0FBQUEsSUFDTixTQUFTO0FBQUEsRUFDWDtBQUFBLEVBQ0EsT0FBTztBQUFBLElBQ0wsUUFBUTtBQUFBLElBQ1IsUUFBUTtBQUFBLElBQ1IsS0FBSztBQUFBLE1BQ0gsT0FBTyxRQUFRLFdBQVcsY0FBYztBQUFBLE1BQ3hDLE1BQU07QUFBQSxNQUNOLFVBQVU7QUFBQSxNQUNWLFNBQVMsQ0FBQyxJQUFJO0FBQUEsSUFDaEI7QUFBQSxJQUNBLGVBQWU7QUFBQSxNQUNiLFFBQVE7QUFBQSxRQUNOLFFBQVE7QUFBQSxRQUNSLGdCQUFnQjtBQUFBLE1BQ2xCO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNQLElBQUk7QUFBQSxNQUNGLGtCQUFrQixRQUFRLFdBQVcscUJBQXFCO0FBQUEsSUFDNUQsQ0FBQztBQUFBLEVBQ0g7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
