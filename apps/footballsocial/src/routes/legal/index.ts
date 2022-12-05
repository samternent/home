export const legalRoutes = [
  {
    path: "/legal/privacy",
    component: () => import("./RoutePrivacy.vue"),
  },
  {
    path: "/legal/terms",
    component: () => import("./RouteTerms.vue"),
  },
];
