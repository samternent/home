export const appsRoutes = [
  {
    path: "/apps",
    component: () => import("./RouteApps.vue"),
    children: [
      {
        path: "/apps/murder-mystery",
        component: () => import("./RouteAppsMurder.vue"),
      },
    ],
  },
];
