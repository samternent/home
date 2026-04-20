import type { RouteModule } from "@/routes/types";

/**
 * Minimal v2 route tree used as the active app surface.
 */
const v2Routes: RouteModule = [
  {
    path: "/",
    component: () => import("./RouteAppV2.vue"),
    children: [
      {
        path: "",
        component: () => import("./RouteHomeV2.vue"),
      },
      {
        path: "permissions",
        component: () => import("./RoutePermissionsV2.vue"),
      },
    ],
  },
];

export default v2Routes;
