import { legalRoutes } from "./legal";
import artists from "./artists";
import locations from "./locations";

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
      ...locations,
    ],
  },
];
