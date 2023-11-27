import { legalRoutes } from "./legal";
import { demoRoutes } from "./demo";

export default [
  ...demoRoutes,
  ...legalRoutes,
  {
    path: "",
    component: () => import("./RouteHome.vue"),
  },
];
