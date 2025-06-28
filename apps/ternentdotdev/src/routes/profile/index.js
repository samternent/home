export const profileRoutes = [
  {
    path: "/profile",
    component: () => import("./RouteProfile.vue"),
  },
  {
    path: "/profile/management",
    component: () => import("./RouteProfileManagement.vue"),
  },
];
