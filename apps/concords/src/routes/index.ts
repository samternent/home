import { legalRoutes } from "./legal";
import { userRoutes } from "./user";

export default [
  ...legalRoutes,
  ...userRoutes,
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
