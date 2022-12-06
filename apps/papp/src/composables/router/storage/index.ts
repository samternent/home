export const storageRoutes = [
  {
    path: "/storage",
    component: () => import("./RouteStorage.vue"),
    meta: {
      hasTopPanel: true,
      hasLeftPanel: false,
    },
  },
];
