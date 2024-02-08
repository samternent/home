export const appsRoutes = [
  {
    path: "/apps",
    component: () => import("./RouteApps.vue"),
    children: [
      {
        path: "",
        redirect: "/apps/sweet-shop",
      },
      {
        path: "/apps/permissions",
        component: () => import("./RouteAppsPermissions.vue"),
      },
      {
        path: "/apps/murder-mystery",
        component: () => import("./RouteAppsMurder.vue"),
      },
      {
        path: "/apps/tasks",
        component: () => import("./RouteAppsTasks.vue"),
      },
      {
        path: "/apps/sweet-shop",
        component: () => import("./RouteAppsSweetShop.vue"),
      },
      {
        path: "/apps/game",
        component: () => import("./RouteAppsGame.vue"),
      },
    ],
  },
];
