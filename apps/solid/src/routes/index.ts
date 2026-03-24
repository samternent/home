import type { RouteRecordRaw } from "vue-router";
import appRoutes from "./app";
import authRoutes from "./auth";
import homeRoutes from "./home";
import settingsRoutes from "./settings";

export const routes: RouteRecordRaw[] = [
  ...homeRoutes,
  ...appRoutes,
  ...authRoutes,
  ...settingsRoutes,
  {
    path: "/:pathMatch(.*)*",
    redirect: "/",
  },
];
