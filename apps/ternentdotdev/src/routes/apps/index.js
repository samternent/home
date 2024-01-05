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
        path: "/apps/murder-mystery",
        component: () => import("./RouteAppsMurder.vue"),
      },
      {
        path: "/apps/sweet-shop",
        component: () => import("./RouteAppsSweetShop.vue"),
      },
    ],
  },
];
