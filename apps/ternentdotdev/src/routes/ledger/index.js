export const ledgerRoutes = [
  {
    path: "/l",
    component: () => import("./RouteLedger.vue"),
    children: [
      {
        path: "",
        redirect: "/l/add",
      },
      {
        path: "/l/permissions",
        component: () => import("./RouteLedgerPermissions.vue"),
      },
      {
        path: "/l/:sheetName",
        component: () => import("./RouteLedgerSheet.vue"),
        props: true,
      },
      {
        path: "/l/add",
        component: () => import("./RouteLedgerAdd.vue"),
      },
    ],
  },
];
