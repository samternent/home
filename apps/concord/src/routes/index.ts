import type { RouteRecordRaw } from "vue-router";
import demoRoutes from "./demo";
import homeRoutes from "./home";
import settingsRoutes from "./settings";

export const routes: RouteRecordRaw[] = [
  ...demoRoutes,
  ...homeRoutes,
  ...settingsRoutes,
  {
    path: "/:pathMatch(.*)*",
    redirect: "/",
  },
];
