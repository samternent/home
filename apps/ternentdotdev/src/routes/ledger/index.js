export const ledgerRoutes = [
  {
    path: "ledger",
    component: () => import("./RouteLedger.vue"),
    children: [
      {
        path: "",
        redirect: "/ledger/tasks",
      },
      {
        path: "permissions",
        component: () => import("./RouteLedgerPermissions.vue"),
      },
      {
        path: "users",
        component: () => import("./RouteLedgerUsers.vue"),
      },
      {
        path: ":sheetName",
        component: () => import("./RouteLedgerSheet.vue"),
        props: true,
      },
      {
        path: "tasks",
        component: () => import("./RouteLedgerTasks.vue"),
        props: true,
      },
      {
        path: "add",
        component: () => import("./RouteLedgerAdd.vue"),
      },
    ],
  },
];
