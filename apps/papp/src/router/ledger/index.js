export const ledgerRoutes = [
  {
    path: "/ledger",
    component: () => import("./RouteLedger.vue"),
    children: [
      {
        path: "",
        redirect: "/ledger/home",
      },
      {
        path: "home",
        component: () => import("./RouteLedgerHome.vue"),
      },
      {
        path: "people",
        component: () => import("./RouteLedgerPeople.vue"),
      },
      {
        path: "permissions",
        component: () => import("./RouteLedgerPermissions.vue"),
      },
    ],
  },
];
