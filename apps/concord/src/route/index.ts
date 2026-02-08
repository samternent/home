import { createRouter, createWebHistory } from "vue-router";
import docRoutes from "./docs/routes";
import workspaceRoutes from "./workspace/routes";
import pixpaxRoutes from "./pixpax/routes";

const pixpaxHosts = new Set(["pixpax.xyz", "www.pixpax.xyz"]);
const isPixpaxHost =
  typeof window !== "undefined" && pixpaxHosts.has(window.location.hostname);

const pixpaxHostChildren = [
  {
    path: "",
    component: () => import("./pixpax/RoutePixPaxMain.vue"),
  },
  {
    path: "about",
    component: () => import("./pixpax/RoutePixPaxAbout.vue"),
  },
  {
    path: "collections",
    component: () => import("./pixpax/RoutePixPaxCollections.vue"),
  },
  {
    path: "admin",
    component: () => import("./pixpax/RoutePixPaxAdmin.vue"),
  },
  {
    path: "creator",
    component: () => import("./pixpax/RoutePixPaxCreator.vue"),
  },
];

const pixpaxHostRoutes = [
  {
    path: "/",
    component: () => import("./pixpax/RoutePixPax.vue"),
    children: pixpaxHostChildren,
  },
  {
    path: "/pixpax",
    component: () => import("./pixpax/RoutePixPax.vue"),
    children: pixpaxHostChildren,
  },
  {
    path: "/:pathMatch(.*)*",
    component: () => import("./pixpax/RoutePixPax.vue"),
    children: [
      {
        path: "",
        component: () => import("./pixpax/RoutePixPaxMain.vue"),
      },
    ],
  },
];

export const routes = isPixpaxHost
  ? pixpaxHostRoutes
  : [...docRoutes, ...workspaceRoutes, ...pixpaxRoutes];

export function createAppRouter() {
  return createRouter({
    history: createWebHistory(),
    routes,
    scrollBehavior() {
      return { top: 0 };
    },
  });
}
