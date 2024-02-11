export const solidRoutes = [
  {
    path: "/solid",
    component: () => import("./RouteSolid.vue"),
  },
  {
    path: "/solid/redirect",
    component: () => import("./RouteSolidRedirect.vue"),
  },
];
