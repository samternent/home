import type { RouteModule } from "@/routes/types";
import suite from "./content";

const sealRoutes: RouteModule = [
  {
    path: "/seal",
    name: "suite-seal",
    component: () => import("../_shared/RouteSuiteLanding.vue"),
    meta: {
      suiteKey: suite.slug,
      suiteTheme: suite.themeName,
    },
  },
];

export default sealRoutes;
