export const adminRoutes = [
  {
    path: "/admin",
    props: true,
    component: () => import("./RouteAdmin.vue"),
  },
];
