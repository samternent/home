// vite.config.ts
import { resolve } from "node:path";
import { defineConfig } from "file:///Users/sam/dev/samternent/home/node_modules/.pnpm/vite@2.9.18/node_modules/vite/dist/node/index.js";
import dts from "file:///Users/sam/dev/samternent/home/node_modules/.pnpm/vite-plugin-dts@1.7.3_vite@2.9.18/node_modules/vite-plugin-dts/dist/index.mjs";
var __vite_injected_original_dirname = "/Users/sam/dev/samternent/home/packages/identity-v2";
var vite_config_default = defineConfig({
  build: {
    target: "es2020",
    lib: {
      entry: resolve(__vite_injected_original_dirname, "src/index.ts"),
      name: "ternentIdentityV2",
      fileName: "index",
    },
    rollupOptions: {},
  },
  plugins: [
    dts({
      tsConfigFilePath: resolve("../../tsconfig.json"),
    }),
  ],
  test: {
    environment: "node",
  },
});
export { vite_config_default as default };
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvc2FtL2Rldi9zYW10ZXJuZW50L2hvbWUvcGFja2FnZXMvaWRlbnRpdHktdjJcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9Vc2Vycy9zYW0vZGV2L3NhbXRlcm5lbnQvaG9tZS9wYWNrYWdlcy9pZGVudGl0eS12Mi92aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vVXNlcnMvc2FtL2Rldi9zYW10ZXJuZW50L2hvbWUvcGFja2FnZXMvaWRlbnRpdHktdjIvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyByZXNvbHZlIH0gZnJvbSBcIm5vZGU6cGF0aFwiO1xuaW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSBcInZpdGVcIjtcbmltcG9ydCBkdHMgZnJvbSBcInZpdGUtcGx1Z2luLWR0c1wiO1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBidWlsZDoge1xuICAgIHRhcmdldDogXCJlczIwMjBcIixcbiAgICBsaWI6IHtcbiAgICAgIGVudHJ5OiByZXNvbHZlKF9fZGlybmFtZSwgXCJzcmMvaW5kZXgudHNcIiksXG4gICAgICBuYW1lOiBcInRlcm5lbnRJZGVudGl0eVYyXCIsXG4gICAgICBmaWxlTmFtZTogXCJpbmRleFwiLFxuICAgIH0sXG4gICAgcm9sbHVwT3B0aW9uczoge30sXG4gIH0sXG4gIHBsdWdpbnM6IFtcbiAgICBkdHMoe1xuICAgICAgdHNDb25maWdGaWxlUGF0aDogcmVzb2x2ZShcIi4uLy4uL3RzY29uZmlnLmpzb25cIiksXG4gICAgfSksXG4gIF0sXG4gIHRlc3Q6IHtcbiAgICBlbnZpcm9ubWVudDogXCJub2RlXCIsXG4gIH0sXG59KTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBMlUsU0FBUyxlQUFlO0FBQ25XLFNBQVMsb0JBQW9CO0FBQzdCLE9BQU8sU0FBUztBQUZoQixJQUFNLG1DQUFtQztBQUl6QyxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixPQUFPO0FBQUEsSUFDTCxRQUFRO0FBQUEsSUFDUixLQUFLO0FBQUEsTUFDSCxPQUFPLFFBQVEsa0NBQVcsY0FBYztBQUFBLE1BQ3hDLE1BQU07QUFBQSxNQUNOLFVBQVU7QUFBQSxJQUNaO0FBQUEsSUFDQSxlQUFlLENBQUM7QUFBQSxFQUNsQjtBQUFBLEVBQ0EsU0FBUztBQUFBLElBQ1AsSUFBSTtBQUFBLE1BQ0Ysa0JBQWtCLFFBQVEscUJBQXFCO0FBQUEsSUFDakQsQ0FBQztBQUFBLEVBQ0g7QUFBQSxFQUNBLE1BQU07QUFBQSxJQUNKLGFBQWE7QUFBQSxFQUNmO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
