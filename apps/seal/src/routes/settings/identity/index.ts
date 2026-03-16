import type { RouteModule } from "@/routes/types";

const identityRoutes: RouteModule = [
  {
    path: "/settings/identity",
    name: "settings-identity",
    redirect: { name: "app-identity" },
  },
  {
    path: "/settings/identity/create",
    name: "settings-identity-create",
    redirect: { name: "app-identity" },
  },
  {
    path: "/settings/identity/import",
    name: "settings-identity-import",
    redirect: { name: "app-identity" },
  },
  {
    path: "/settings/identity/export",
    name: "settings-identity-export",
    redirect: { name: "app-identity" },
  },
];

export default identityRoutes;
