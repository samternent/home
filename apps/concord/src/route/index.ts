import { createRouter, createWebHistory } from "vue-router";
import docRoutes from "./docs/routes";
import workspaceRoutes from "./workspace/routes";
import pixpaxRoutes, { pixpaxChildren } from "./pixpax/routes";

const pixpaxHosts = new Set(["pixpax.xyz", "www.pixpax.xyz"]);
function isPixpaxHostname(hostname: string) {
  const normalized = String(hostname || "").toLowerCase();
  return pixpaxHosts.has(normalized) || normalized.startsWith("pixpax.");
}

const isPixpaxHost =
  typeof window !== "undefined" &&
  isPixpaxHostname(window.location.hostname);
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

const pixpaxShortRedeemRoutes = [
  {
    path: "/r",
    component: () => import("./pixpax/RoutePixPaxShortRedeem.vue"),
  },
  {
    path: "/r/:code(.*)",
    component: () => import("./pixpax/RoutePixPaxShortRedeem.vue"),
  },
];

export const routes = useStandalonePixpaxRoutes
  ? pixpaxHostRoutes
  : [...pixpaxShortRedeemRoutes, ...docRoutes, ...workspaceRoutes, ...pixpaxRoutes];

export function resolveRouterBase() {
  if (typeof window !== "undefined") {
    if (isPixpaxHostname(window.location.hostname)) {
      return "/";
    }
  }
  return import.meta.env.BASE_URL;
}

export function createAppRouter() {
  return createRouter({
    history: createWebHistory(resolveRouterBase()),
    routes,
    scrollBehavior() {
      return { top: 0 };
    },
  });
}
