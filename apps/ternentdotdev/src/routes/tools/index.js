export const toolsRoutes = [
  {
    path: "/tools",
    component: () => import("./RouteTools.vue"),
    children: [
      {
        path: "",
        redirect: "/tools/gzip",
      },
      {
        path: "/tools/gzip",
        component: () => import("./RouteToolsGzip.vue"),
      },
      {
        path: "/tools/encryption",
        component: () => import("./RouteToolsEncryption.vue"),
      },
    ],
  },
];
