import { adminRoutes } from "./admin";
import { authRoutes } from "./auth";
import { leagueRoutes } from "./league";
import { legalRoutes } from "./legal";

export default [
  ...adminRoutes,
  ...authRoutes,
  ...leagueRoutes,
  ...legalRoutes,
  {
    path: "",
    component: () => import("./RouteHome.vue"),
  },
];
