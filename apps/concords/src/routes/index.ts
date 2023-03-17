import { legalRoutes } from "./legal";

export default [
  ...legalRoutes,
  {
    path: "",
    component: () => import("./RouteHome.vue"),
    meta: {
      hasTopPanel: true,
      hasBottomPanel: true,
      hasLeftPanel: false,
      hasRightPanel: false,
    },
  },
];
