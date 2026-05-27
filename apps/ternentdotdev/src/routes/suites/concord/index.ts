import type { RouteModule } from "@/routes/types";
import suite from "./content";

const concordRoutes: RouteModule = [
  {
    path: "/concord",
    name: "suite-concord",
    component: () => import("../_shared/RouteSuiteLanding.vue"),
    meta: {
      suiteKey: suite.slug,
      suiteTheme: suite.themeName,
    },
  },
];

export default concordRoutes;
