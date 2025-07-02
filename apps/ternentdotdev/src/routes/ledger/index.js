export const ledgerRoutes = [
  {
    path: "ledger",
    component: () => import("./RouteLedger.vue"),
    children: [
      {
        path: "",
        redirect: "/ledger/board",
      },
      {
        path: "demo",
        component: {
          template: '<div />', // Placeholder, content rendered in parent
        },
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
        path: "board",
        component: () => import("./RouteLedgerTasks.vue"),
        props: true,
      },
      {
        path: "task-list",
        component: () => import("./RouteLedgerTaskList.vue"),
      },
      {
        path: "task-table",
        component: () => import("./RouteLedgerTaskTable.vue"),
      },
      {
        path: "notes",
        component: () => import("./RouteLedgerNotes.vue"),
      },
    ],
  },
];
