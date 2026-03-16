import type { RouteModule } from "@/routes/types";
import identityRoutes from "./identity";

const settingsRoutes: RouteModule = [
  {
    path: "/settings",
    redirect: { name: "app-identity" },
  },
  {
    path: "/settings/appearance",
    name: "settings-appearance",
    redirect: { name: "app-identity" },
  },
  ...identityRoutes,
];

export default settingsRoutes;
