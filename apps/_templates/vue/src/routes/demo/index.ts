export const demoRoutes = [
  {
    path: "/demo",
    component: () => import("./RouteDemo.vue"),
    children: [
      {
        path: "",
        redirect: "/demo/board",
      },
      {
        path: "board",
        component: () => import("./RouteDemoBoard.vue"),
      },
      {
        path: "list",
        component: () => import("./RouteDemoList.vue"),
      },
    ],
  },
];
