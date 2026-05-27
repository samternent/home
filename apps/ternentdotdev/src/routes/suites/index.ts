import type { RouteModule } from "@/routes/types";
import armourRoutes from "./armour";
import concordRoutes from "./concord";
import ledgerRoutes from "./ledger";
import sealRoutes from "./seal";

const suiteRoutes: RouteModule = [
  ...armourRoutes,
  ...concordRoutes,
  ...ledgerRoutes,
  ...sealRoutes,
];

export default suiteRoutes;
