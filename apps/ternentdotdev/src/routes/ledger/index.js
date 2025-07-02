export const ledgerRoutes = [
  {
    path: "ledger",
    component: () => import("./RouteLedger.vue"),
    children: [
      {
        path: "",
        redirect: (to) => {
          // Redirect to first app if available, otherwise to users
          return "/ledger/users";
        },
      },
      {
        path: "app/:appId",
        component: () => import("./RouteLedgerApp.vue"),
        props: true,
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
        path: "notes",
        component: () => import("./RouteLedgerNotes.vue"),
      },
    ],
  },
];
