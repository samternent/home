import { createRouter, createWebHistory } from "vue-router";
import docRoutes from "./docs/routes";
import workspaceRoutes from "./workspace/routes";
import pixpaxRoutes, { pixpaxChildren } from "./pixpax/routes";

const pixpaxHosts = new Set(["pixpax.xyz", "www.pixpax.xyz"]);
const isPixpaxHost =
  typeof window !== "undefined" && pixpaxHosts.has(window.location.hostname);

function cloneRouteRecord(record: any): any {
  return {
    ...record,
    children: Array.isArray(record.children)
      ? record.children.map((child) => cloneRouteRecord(child))
      : undefined,
  };
}

const pixpaxHostChildren = pixpaxChildren.map((child) =>
  cloneRouteRecord(child),
);
const pixpaxHostChildrenWithoutShortRedeem = pixpaxHostChildren.filter(
  (child) => child.path !== "r" && child.path !== "r/:code(.*)",
);

const pixpaxHostShortRedeemRoutes = [
  {
    path: "/r",
    component: () => import("./pixpax/RoutePixPax.vue"),
    children: [
      {
        path: "",
        component: () => import("./pixpax/RoutePixPaxShortRedeem.vue"),
      },
    ],
  },
  {
    path: "/r/:code(.*)",
    component: () => import("./pixpax/RoutePixPax.vue"),
    children: [
      {
        path: "",
        component: () => import("./pixpax/RoutePixPaxShortRedeem.vue"),
      },
    ],
  },
  {
    path: "/pixpax/r",
    component: () => import("./pixpax/RoutePixPax.vue"),
    children: [
      {
        path: "",
        component: () => import("./pixpax/RoutePixPaxShortRedeem.vue"),
      },
    ],
  },
  {
    path: "/pixpax/r/:code(.*)",
    component: () => import("./pixpax/RoutePixPax.vue"),
    children: [
      {
        path: "",
        component: () => import("./pixpax/RoutePixPaxShortRedeem.vue"),
      },
    ],
  },
];

const pixpaxHostRoutes = [
  ...pixpaxHostShortRedeemRoutes,
  {
    path: "/",
    component: () => import("./pixpax/RoutePixPax.vue"),
    children: pixpaxHostChildrenWithoutShortRedeem,
  },
  {
    path: "/pixpax",
    component: () => import("./pixpax/RoutePixPax.vue"),
    children: pixpaxHostChildrenWithoutShortRedeem,
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
