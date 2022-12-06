import { authRoutes } from "./auth";
import { leagueRoutes } from "./league";
import { legalRoutes } from "./legal";

export default [
  ...authRoutes,
  ...leagueRoutes,
  ...legalRoutes,
  {
    path: "",
    component: () => import("./RouteHome.vue"),
  },
];
