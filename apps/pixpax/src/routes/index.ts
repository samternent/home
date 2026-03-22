import type { RouteRecordRaw } from "vue-router";
import { ensurePixpaxAdminAuthenticated } from "@/modules/admin-auth";
import { ensureLocalIdentity } from "@/modules/identity";

async function ensurePlayerIdentity() {
  if (typeof window === "undefined") {
    return true;
  }
  await ensureLocalIdentity();
  return true;
}

export const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "home",
    component: () => import("./home/RouteHome.vue"),
  },
  {
    path: "/redeem",
    name: "redeem",
    component: () => import("./redeem/RouteRedeem.vue"),
    beforeEnter: ensurePlayerIdentity,
  },
  {
    path: "/app",
    component: () => import("./app/RouteAppShell.vue"),
    children: [
      {
        path: "",
        redirect: "/app/pixbook",
      },
      {
        path: "pixbook",
        name: "app-pixbook",
        component: () => import("./app/RouteAppPixbook.vue"),
        beforeEnter: ensurePlayerIdentity,
      },
      {
        path: "collections",
        redirect: "/app/pixbook",
      },
      {
        path: "collections/:collectionId",
        redirect: "/app/pixbook",
      },
      {
        path: "admin",
        name: "app-admin",
        component: () => import("./app/RouteAppAdmin.vue"),
        beforeEnter: ensurePixpaxAdminAuthenticated,
      },
      {
        path: "admin/login",
        name: "app-admin-login",
        component: () => import("./app/RouteAppAdminLogin.vue"),
      },
      {
        path: "settings",
        component: () => import("./app/settings/RouteAppSettingsShell.vue"),
        beforeEnter: ensurePlayerIdentity,
        children: [
          {
            path: "",
            redirect: "/app/settings/my-device",
          },
          {
            path: "identity",
            redirect: "/app/settings/my-device",
          },
          {
            path: "my-device",
            name: "app-settings-identity",
            component: () => import("./app/settings/RouteAppSettingsIdentity.vue"),
          },
          {
            path: "children",
            name: "app-settings-children",
            component: () => import("./app/settings/RouteAppSettingsChildren.vue"),
          },
          {
            path: "family",
            name: "app-settings-family",
            component: () => import("./app/settings/RouteAppSettingsFamily.vue"),
          },
          {
            path: "appearance",
            name: "app-settings-appearance",
            component: () => import("./app/settings/RouteAppSettingsAppearance.vue"),
          },
          {
            path: "pixbook",
            redirect: "/app/settings/import-export",
          },
          {
            path: "import-export",
            name: "app-settings-pixbook",
            component: () => import("./app/settings/RouteAppSettingsPixbook.vue"),
          },
        ],
      },
    ],
  },
  {
    path: "/:pathMatch(.*)*",
    redirect: "/",
  },
];
