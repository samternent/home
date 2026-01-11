import { createRouter, createWebHistory } from "vue-router";
import docRoutes from "./docs/routes";
import workspaceRoutes from "./workspace/routes";

export const routes = [
  ...docRoutes,
  ...workspaceRoutes,
  // Optional: 404
  { path: "/:pathMatch(.*)*", redirect: "/" },
];

export function createAppRouter() {
  return createRouter({
    history: createWebHistory(),
    routes,
    scrollBehavior() {
      return { top: 0 };
    },
  });
}

//{ path: "/", name: "home", component: Home },
