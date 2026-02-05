import { createRouter, createWebHistory } from "vue-router";
import docRoutes from "./docs/routes";
import workspaceRoutes from "./workspace/routes";
import pixpaxRoutes from "./pixpax/routes";

export const routes = [...docRoutes, ...workspaceRoutes, ...pixpaxRoutes];

export function createAppRouter() {
  return createRouter({
    history: createWebHistory(),
    routes,
    scrollBehavior() {
      return { top: 0 };
    },
  });
}
