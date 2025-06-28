import { ledgerRoutes } from "../ledger";
import { profileRoutes } from "../profile";

export const appRoutes = [
  {
    path: "/app",
    component: () => import("./RouteApp.vue"),
    children: [
      {
        path: "profile",
        component: () => import("../profile/RouteProfile.vue"),
        children: [
          {
            path: "management",
            component: () => import("../profile/RouteProfileManagement.vue"),
          },
        ],
      },
      {
        path: "settings",
        component: () => import("../settings/RouteSettings.vue"),
      },
      ...ledgerRoutes,
    ],
  },
];
