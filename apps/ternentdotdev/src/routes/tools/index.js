export const toolsRoutes = [
  {
    path: "/tools",
    component: () => import("./RouteTools.vue"),
    children: [
      {
        path: "",
        redirect: "/tools/compression",
      },
      {
        path: "/tools/compression",
        component: () => import("./RouteToolsGzip.vue"),
      },
      {
        path: "/tools/encryption",
        component: () => import("./RouteToolsEncryption.vue"),
      },
    ],
  },
];
