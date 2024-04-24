export const ledgerRoutes = [
  {
    path: "l",
    component: () => import("./RouteLedger.vue"),
    children: [
      {
        path: "",
        redirect: "/app/l/add",
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
