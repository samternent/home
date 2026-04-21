import type { RouteRecordRaw } from "vue-router";
import appRoutes from "./app";

export const routes: RouteRecordRaw[] = [
  ...appRoutes,
  {
    path: "/:pathMatch(.*)*",
    redirect: "/",
  },
];
