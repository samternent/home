export const ledgerRoutes = [
  {
    path: "/l",
    component: () => import("./RouteLedger.vue"),
    children: [
      {
        path: "create",
        component: () => import("./RouteLedgerCreate.vue"),
        children: [
          {
            path: "",
            component: () => import("./RouteLedgerCreateHome.vue"),
          },
          {
            path: "list",
            component: () => import("./RouteLedgerCreateList.vue"),
          },
          {
            path: "board",
            component: () => import("./RouteLedgerCreateBoard.vue"),
          },
        ],
      },
    ],
  },
];
