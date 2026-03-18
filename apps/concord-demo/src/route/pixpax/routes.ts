import {
  redirectPixPaxControlEntry,
  requirePixPaxPermission,
} from "../../module/pixpax/auth/guards";

export const pixpaxControlChildren = [
  {
    path: "",
    name: "pixpax-control-entry",
    component: () => import("./RoutePixPaxControlEntry.vue"),
    beforeEnter: redirectPixPaxControlEntry,
  },
  {
    path: "login",
    name: "pixpax-control-login",
    component: () => import("./RoutePixPaxControlLogin.vue"),
  },
];

export const pixpaxChildren = [
  {
    path: "",
    name: "pixpax-main",
    component: () => import("./RoutePixPaxMain.vue"),
  },
  {
    path: "about",
    name: "pixpax-about",
    component: () => import("./RoutePixPaxAbout.vue"),
  },
  {
    path: "collections",
    name: "pixpax-collections",
    component: () => import("./RoutePixPaxCollections.vue"),
  },
  {
    path: "collections/:collectionId",
    name: "pixpax-collection",
    component: () => import("./RoutePixPaxCollection.vue"),
  },
  {
    path: "my-collections",
    name: "pixpax-my-collections",
    component: () => import("./RoutePixPaxMyCollections.vue"),
  },
  {
    path: "redeem",
    name: "pixpax-redeem",
    component: () => import("./RoutePixPaxRedeem.vue"),
  },
  {
    path: "r",
    name: "pixpax-short-redeem",
    component: () => import("./RoutePixPaxShortRedeem.vue"),
  },
  {
    path: "r/:code(.*)",
    name: "pixpax-short-redeem-code",
    component: () => import("./RoutePixPaxShortRedeem.vue"),
  },
  {
    path: "settings",
    name: "pixpax-settings",
    component: () => import("./settings/RoutePixPaxSettingsShell.vue"),
    children: [
      {
        path: "",
        redirect: {
          name: "pixpax-settings-home",
        },
      },
      {
        path: "home",
        name: "pixpax-settings-home",
        component: () =>
          import("./settings/RoutePixPaxSettingsHome.vue"),
      },
      {
        path: "identity-devices",
        name: "pixpax-settings-identity-devices",
        component: () =>
          import("./settings/RoutePixPaxSettingsIdentityDevices.vue"),
      },
      {
        path: "pixbooks",
        name: "pixpax-settings-pixbooks",
        component: () =>
          import("./settings/RoutePixPaxSettingsPixbooks.vue"),
      },
      {
        path: "sync-backup",
        name: "pixpax-settings-sync-backup",
        component: () =>
          import("./settings/RoutePixPaxSettingsSyncBackup.vue"),
      },
      {
        path: "import-export",
        name: "pixpax-settings-import-export",
        component: () =>
          import("./settings/RoutePixPaxSettingsImportExport.vue"),
      },
      {
        path: "danger",
        name: "pixpax-settings-danger",
        component: () =>
          import("./settings/RoutePixPaxSettingsDanger.vue"),
      },
    ],
  },
  {
    path: "control/creator",
    name: "pixpax-control-creator",
    component: () => import("./RoutePixPaxCreator.vue"),
  },
  {
    path: "control/analytics",
    name: "pixpax-control-analytics",
    component: () => import("./RoutePixPaxAnalytics.vue"),
    beforeEnter: requirePixPaxPermission("pixpax.analytics.read"),
  },
  {
    path: "control/admin",
    name: "pixpax-control-admin",
    component: () => import("./RoutePixPaxAdmin.vue"),
    beforeEnter: requirePixPaxPermission("pixpax.admin.manage"),
  },
  {
    path: "control",
    name: "pixpax-control",
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
