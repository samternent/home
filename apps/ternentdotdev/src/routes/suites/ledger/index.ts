import type { RouteModule } from "@/routes/types";
import suite from "./content";

const ledgerRoutes: RouteModule = [
  {
    path: "/ledger",
    name: "suite-ledger",
    component: () => import("../_shared/RouteSuiteLanding.vue"),
    meta: {
      suiteKey: suite.slug,
      suiteTheme: suite.themeName,
    },
  },
];

export default ledgerRoutes;
