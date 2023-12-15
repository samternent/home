import { legalRoutes } from "./legal";
import { demoRoutes } from "./demo";

export default [
  {
    path: "",
    component: () => import("./RouteLayout.vue"),
    children: [
      {
        path: "",
        component: () => import("./RouteHome.vue"),
      },
      ...demoRoutes,
      ...legalRoutes,
    ],
  },
];
