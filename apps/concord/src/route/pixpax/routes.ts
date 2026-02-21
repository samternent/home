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
    path: "settings",
    component: () => import("./settings/RoutePixPaxSettingsShell.vue"),
    children: [
      {
        path: "",
        redirect: "/pixpax/settings/home",
      },
      {
        path: "home",
        component: () =>
          import("./settings/RoutePixPaxSettingsHome.vue"),
      },
      {
        path: "identity-devices",
        component: () =>
          import("./settings/RoutePixPaxSettingsIdentityDevices.vue"),
      },
      {
        path: "pixbooks",
        component: () =>
          import("./settings/RoutePixPaxSettingsPixbooks.vue"),
      },
      {
        path: "sync-backup",
        component: () =>
          import("./settings/RoutePixPaxSettingsSyncBackup.vue"),
      },
      {
        path: "import-export",
        component: () =>
          import("./settings/RoutePixPaxSettingsImportExport.vue"),
      },
      {
        path: "danger",
        component: () =>
          import("./settings/RoutePixPaxSettingsDanger.vue"),
      },
    ],
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
