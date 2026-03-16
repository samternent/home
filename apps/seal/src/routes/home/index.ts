import type { RouteModule } from "@/routes/types";

const homeRoutes: RouteModule = [
  {
    path: "/",
    name: "home",
    component: () => import("./RouteHome.vue"),
  },
];

export default homeRoutes;
