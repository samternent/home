import type { RouteRecordRaw } from "vue-router";
import appRoutes from "./app";
import authRoutes from "./auth";
import homeRoutes from "./home";

export const routes: RouteRecordRaw[] = [
  ...homeRoutes,
  ...appRoutes,
  ...authRoutes,
  {
    path: "/:pathMatch(.*)*",
    redirect: "/",
  },
];
