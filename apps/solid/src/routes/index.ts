import type { RouteRecordRaw } from "vue-router";
import homeRoutes from "./home";

export const routes: RouteRecordRaw[] = [
  ...homeRoutes,
  {
    path: "/:pathMatch(.*)*",
    redirect: "/",
  },
];
