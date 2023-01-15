export const ledgerRoutes = [
  {
    path: "/l",
    component: () => import("./RouteLedger.vue"),
    children: [
      {
        path: "",
        component: () => import("./RouteLedgerHome.vue"),
      },
      {
        path: "permissions",
        component: () => import("./RouteLedgerPermissions.vue"),
      },
      {
        path: "people",
        component: () => import("./RouteLedgerPeople.vue"),
      },
    ],
  },
];
