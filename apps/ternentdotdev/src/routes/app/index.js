import { ledgerRoutes } from "../ledger";

export const appRoutes = [
  {
    path: "/app",
    component: () => import("./RouteApp.vue"),
    children: [
      {
        path: "profile",
        component: () => import("../profile/RouteProfile.vue"),
      },
      {
        path: "settings",
        component: () => import("../settings/RouteSettings.vue"),
      },
      ...ledgerRoutes,
    ],
  },
];
