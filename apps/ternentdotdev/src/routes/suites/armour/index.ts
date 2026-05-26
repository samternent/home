import type { RouteModule } from "@/routes/types";
import suite from "./content";

const armourRoutes: RouteModule = [
  {
    path: "/armour",
    name: "suite-armour",
    component: () => import("../_shared/RouteSuiteLanding.vue"),
    meta: {
      suiteKey: suite.slug,
      suiteTheme: suite.themeName,
    },
  },
];

export default armourRoutes;
