import type { RouteModule } from "@/routes/types";

const homeRoutes: RouteModule = [
  {
    path: "/",
    name: "home",
    component: () => import("../app/RouteApp.vue"),
  },
];

export default homeRoutes;
