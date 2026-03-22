import type { RouteModule } from "@/routes/types";

const demoRoutes: RouteModule = [
  {
    path: "/demo-vue",
    name: "demo-vue",
    component: () => import("./RouteDemoVue.vue"),
  },
];

export default demoRoutes;
