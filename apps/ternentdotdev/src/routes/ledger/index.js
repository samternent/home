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
        path: "audit",
        component: () => import("./RouteLedgerAudit.vue"),
      },
      {
        path: "settings",
        component: () => import("./RouteLedgerSettings.vue"),
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
        path: "notes",
        component: () => import("./RouteLedgerNotes.vue"),
      },
    ],
  },
];
