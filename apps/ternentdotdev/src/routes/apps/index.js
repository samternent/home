export const appsRoutes = [
  {
    path: "apps",
    component: () => import("./RouteApps.vue"),
    children: [],
  },
  {
    path: "apps/new",
    component: () => import("../builder/RouteBuilder.vue"),
  },
  {
    path: "apps/:appId",
    component: () => import("./RouteAppsView.vue"),
    props: true,
  },
];
