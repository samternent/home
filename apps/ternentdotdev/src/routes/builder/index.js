// No-code app builder routes - Multiple Apps Per Ledger
export const builderRoutes = [
  {
    path: "builder",
    component: () => import("./RouteBuilder.vue"),
    children: [
      {
        path: "",
        component: () => import("./RouteBuilderHome.vue"),
      },
      {
        path: "create",
        component: () => import("./RouteBuilderCreate.vue"),
      },
      {
        path: "apps",
        component: () => import("./RouteBuilderApps.vue"),
      },
      {
        path: "app/:appId",
        component: () => import("./RouteBuilderApp.vue"),
        props: true,
      },
      {
        path: "app/:appId/design",
        component: () => import("./RouteBuilderDesign.vue"),
        props: true,
      },
      {
        path: "templates",
        component: () => import("./RouteBuilderTemplates.vue"),
      },
    ],
  },
];

export default builderRoutes;
