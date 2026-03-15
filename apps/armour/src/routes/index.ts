import type { RouteRecordRaw } from "vue-router";
import homeRoutes from "./home";
import settingsRoutes from "./settings";

export const routes: RouteRecordRaw[] = [
  ...homeRoutes,
  ...settingsRoutes,
  {
    path: "/:pathMatch(.*)*",
    redirect: "/",
  },
];
