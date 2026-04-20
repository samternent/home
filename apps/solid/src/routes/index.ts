import type { RouteRecordRaw } from "vue-router";
import v2Routes from "./v2";

export const routes: RouteRecordRaw[] = [
  ...v2Routes,
  {
    path: "/:pathMatch(.*)*",
    redirect: "/",
  },
];
