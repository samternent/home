import { legalRoutes } from "./legal";

export default [
  ...legalRoutes,
  {
    path: "",
    component: () => import("./RouteHome.vue"),
  },
];
