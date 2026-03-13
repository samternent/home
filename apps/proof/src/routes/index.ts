import type { RouteRecordRaw } from "vue-router";
import homeRoutes from "./home";
import appRoutes from "./app";

export const routes: RouteRecordRaw[] = [
  ...homeRoutes,
  ...appRoutes,
  {
    path: "/:pathMatch(.*)*",
    redirect: "/",
  },
];
