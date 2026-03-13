import type { RouteRecordRaw } from "vue-router";
import homeRoutes from "./home";
import appRoutes from "./app";
import settingsRoutes from "./settings";

export const routes: RouteRecordRaw[] = [
  ...homeRoutes,
  ...appRoutes,
  ...settingsRoutes,
  {
    path: "/:pathMatch(.*)*",
    redirect: "/",
  },
];
