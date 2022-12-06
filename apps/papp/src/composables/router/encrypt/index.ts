export const encryptRoutes = [
  {
    path: "/encryption",
    component: () => import("./RouteEncrypt.vue"),
    meta: {
      hasTopPanel: true,
      hasLeftPanel: true,
    },
    children: [
      {
        path: "",
        component: () => import("./RouteEncryptHome.vue"),
      },
      {
        path: "encrypt",
        component: () => import("./RouteEncryptEncrypt.vue"),
      },
      {
        path: "decrypt",
        component: () => import("./RouteEncryptDecrypt.vue"),
      },
      {
        path: "keys",
        component: () => import("./RouteEncryptKeys.vue"),
      },
      {
        path: "install",
        component: () => import("./RouteEncryptInstall.vue"),
      },
      {
        path: "api",
        component: () => import("./RouteEncryptApi.vue"),
      },
      {
        path: "examples",
        component: () => import("./RouteEncryptExamples.vue"),
      },
    ],
  },
];
