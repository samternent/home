import { legalRoutes } from "./legal";

export default [
  ...legalRoutes,
  {
    path: "",
    component: () => import("./RouteHome.vue"),
    meta: {
      hasTopPanel: false,
      hasBottomPanel: false,
      hasLeftPanel: false,
      hasRightPanel: false,
    },
  },
];
