import {
  redirectPixPaxControlEntry,
  requirePixPaxPermission,
} from "../../module/pixpax/auth/guards";

export const pixpaxControlChildren = [
  {
    path: "",
    component: () => import("./RoutePixPaxControlEntry.vue"),
    beforeEnter: redirectPixPaxControlEntry,
  },
  {
    path: "login",
    component: () => import("./RoutePixPaxControlLogin.vue"),
  },
  {
    path: "creator",
    component: () => import("./RoutePixPaxCreator.vue"),
  },
  {
    path: "analytics",
    component: () => import("./RoutePixPaxAnalytics.vue"),
    beforeEnter: requirePixPaxPermission("pixpax.analytics.read"),
  },
  {
    path: "admin",
    component: () => import("./RoutePixPaxAdmin.vue"),
    beforeEnter: requirePixPaxPermission("pixpax.admin.manage"),
  },
];

export const pixpaxChildren = [
  {
    path: "",
    component: () => import("./RoutePixPaxMain.vue"),
  },
  {
    path: "about",
    component: () => import("./RoutePixPaxAbout.vue"),
  },
  {
    path: "collections",
    component: () => import("./RoutePixPaxCollections.vue"),
  },
  {
    path: "control",
    component: () => import("./RoutePixPaxControlShell.vue"),
    children: pixpaxControlChildren,
  },
];

export default [
  {
    path: "/pixpax",
    component: () => import("./RoutePixPax.vue"),
    children: pixpaxChildren,
  },
];
