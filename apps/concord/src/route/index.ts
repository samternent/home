import { createRouter, createWebHistory } from "vue-router";
import docRoutes from "./docs/routes";
import workspaceRoutes from "./workspace/routes";
import pixpaxRoutes, { pixpaxChildren } from "./pixpax/routes";

const pixpaxHosts = new Set(["pixpax.xyz", "www.pixpax.xyz"]);
const isPixpaxHost =
  typeof window !== "undefined" &&
  (pixpaxHosts.has(window.location.hostname) ||
    window.location.hostname.startsWith("pixpax."));
const normalizedBaseUrl = String(import.meta.env.BASE_URL || "/").replace(
  /\/+$/,
  "",
) || "/";
const hasPixpaxBasePrefix =
  normalizedBaseUrl === "/pixpax" || normalizedBaseUrl.endsWith("/pixpax");
const useStandalonePixpaxRoutes = isPixpaxHost || hasPixpaxBasePrefix;

function cloneRouteRecord(record: any): any {
  return {
    ...record,
    children: Array.isArray(record.children)
      ? record.children.map((child) => cloneRouteRecord(child))
      : undefined,
  };
}

const pixpaxHostChildren = pixpaxChildren.map((child) => cloneRouteRecord(child));

const pixpaxHostRoutes = [
  {
    path: "/",
    component: () => import("./pixpax/RoutePixPax.vue"),
    children: pixpaxHostChildren,
  },
  ...(!hasPixpaxBasePrefix
    ? [
        {
          path: "/pixpax",
          component: () => import("./pixpax/RoutePixPax.vue"),
          children: pixpaxHostChildren,
        },
      ]
    : []),
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

export const routes = useStandalonePixpaxRoutes
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
