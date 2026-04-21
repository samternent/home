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
        path: "launch",
        component: () => import("./RouteLaunch.vue"),
      },
      {
        path: "users",
        component: () => import("./RouteHome.vue"),
      },
      {
        path: "permissions",
        component: () => import("./RoutePermissions.vue"),
      },
    ],
  },
];

export default v2Routes;
