import type { RouteRecordRaw } from "vue-router";
import homeRoutes from "./home";
import suiteRoutes from "./suites";

export const routes: RouteRecordRaw[] = [
  ...homeRoutes,
  ...suiteRoutes,
  {
    path: "/:pathMatch(.*)*",
    redirect: "/",
  },
];
