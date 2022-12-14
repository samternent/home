import { ledgerRoutes } from "./ledger";
import { legalRoutes } from "./legal";

export default [
  ...ledgerRoutes,
  ...legalRoutes,
  {
    path: "",
    component: () => import("./RouteHome.vue"),
  },
];
