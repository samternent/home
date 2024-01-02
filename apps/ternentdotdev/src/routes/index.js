import { aboutRoutes } from "./about";
import { appsRoutes } from "./apps";
import { legalRoutes } from "./legal";
import { workRoutes } from "./work";

export default [
  {
    path: "",
    component: () => import("./RouteLayout.vue"),
    children: [
      {
        path: "",
        component: () => import("./RouteHome.vue"),
      },
      ...aboutRoutes,
      ...appsRoutes,
      ...legalRoutes,
      ...workRoutes,
    ],
  },
];
