import { ledgerRoutes } from "../ledger";

export const appRoutes = [
  {
    path: "/app",
    component: () => import("./RouteApp.vue"),
    children: [
      {
        path: "solid",
        component: () => import("../solid/RouteSolid.vue"),
      },
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
