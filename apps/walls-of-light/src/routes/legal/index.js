export const legalRoutes = [
  {
    path: "/legal/privacy",
    component: () => import("./RouteLegalPrivacy.vue"),
  },
  {
    path: "/legal/terms",
    component: () => import("./RouteLegalTerms.vue"),
  },
];
