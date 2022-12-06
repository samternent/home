export const identityRoutes = [
  {
    path: "/identity",
    component: () => import("./RouteIdentity.vue"),
    meta: {
      hasTopPanel: true,
      hasLeftPanel: true,
    },
    children: [
      {
        path: "",
        component: () => import("./RouteIdentityHome.vue"),
      },
      {
        path: "sign",
        component: () => import("./RouteIdentitySign.vue"),
      },
      {
        path: "verify",
        component: () => import("./RouteIdentityVerify.vue"),
      },
      {
        path: "keys",
        component: () => import("./RouteIdentityKeys.vue"),
      },
    ],
  },
];
