import type { RouteRecordRaw } from "vue-router";
import homeRoutes from "./home";
import settingsRoutes from "./settings";
import suiteRoutes from "./suites";

export const routes: RouteRecordRaw[] = [
  ...homeRoutes,
  ...suiteRoutes,
  ...settingsRoutes,
  {
    path: "/:pathMatch(.*)*",
    redirect: "/",
  },
];
