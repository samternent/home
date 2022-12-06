export const ledgerRoutes = [
  {
    path: "/ledger",
    component: () => import("./RouteLedger.vue"),
    meta: {
      hasTopPanel: true,
      hasLeftPanel: true,
    },
    children: [
      {
        path: "",
        component: () => import("./RouteLedgerHome.vue"),
      },
    ],
  },
];
