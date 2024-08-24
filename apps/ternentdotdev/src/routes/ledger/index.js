export const ledgerRoutes = [
  {
    path: "ledger",
    component: () => import("./RouteLedger.vue"),
    children: [
      {
        path: "",
        redirect: "/ledger/add",
      },
      {
        path: "permissions",
        component: () => import("./RouteLedgerPermissions.vue"),
      },
      {
        path: ":sheetName",
        component: () => import("./RouteLedgerSheet.vue"),
        props: true,
      },
      {
        path: "add",
        component: () => import("./RouteLedgerAdd.vue"),
      },
    ],
  },
];
