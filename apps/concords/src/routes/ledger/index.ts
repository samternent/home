export const ledgerRoutes = [
  {
    path: "/l",
    component: () => import("./RouteLedger.vue"),
    children: [
      {
        path: "create",
        component: () => import("./RouteLedgerCreate.vue"),
      },
    ],
  },
];
