import { ledgerRoutes } from "./ledger";
import { legalRoutes } from "./legal";
import { userRoutes } from "./user";

export default [
  ...ledgerRoutes,
  ...legalRoutes,
  ...userRoutes,
  {
    path: "",
    component: () => import("./RouteHome.vue"),
  },
];
