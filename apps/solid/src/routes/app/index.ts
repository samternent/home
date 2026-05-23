import type { RouteModule } from "@/routes/types";

/**
 * Minimal v2 route tree used as the active app surface.
 */
const v2Routes: RouteModule = [
  {
    path: "/",
    component: () => import("./RouteApp.vue"),
    children: [
      {
        path: "",
        component: () => import("./RouteHome.vue"),
      },
      {
        path: "s/users",
        component: () => import("./RouteUsers.vue"),
      },
      {
        path: "s/permissions/:permissionKey?",
        component: () => import("./RoutePermissions.vue"),
      },
      {
        path: "s/tamper",
        component: () => import("./RouteTamper.vue"),
      },
      {
        path: "w/:appId/:surfaceId?",
        component: () => import("./RouteRuntimeApp.vue"),
      },
    ],
  },
];

export default v2Routes;
