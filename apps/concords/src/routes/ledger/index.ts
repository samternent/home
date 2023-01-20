export const ledgerRoutes = [
  {
    path: "/l",
    component: () => import("./RouteLedger.vue"),
    children: [
      {
        path: "",
        redirect: "/l/form",
      },
      {
        path: "form",
        component: () => import("./RouteLedgerForm.vue"),
      },
      {
        path: "builder",
        component: () => import("./RouteLedgerBuilder.vue"),
      },
      {
        path: "data",
        component: () => import("./RouteLedgerData.vue"),
      },
      {
        path: "permissions",
        component: () => import("./RouteLedgerPermissions.vue"),
      },
      {
        path: "people",
        component: () => import("./RouteLedgerPeople.vue"),
      },
    ],
  },
];
