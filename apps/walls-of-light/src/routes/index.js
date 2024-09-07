import { legalRoutes } from "./legal";
import artists from "./artists";
import location from "./location";

export default [
  {
    path: "",
    component: () => import("./RouteLayout.vue"),
    children: [
      {
        path: "",
        component: () => import("./RouteHome.vue"),
      },
      ...artists,
      ...legalRoutes,
      ...location,
    ],
  },
];
