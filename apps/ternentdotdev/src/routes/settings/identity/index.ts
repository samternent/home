import type { RouteModule } from "@/routes/types";
import { requireIdentityGuard } from "@/modules/identity/identity.guard";

const identityRoutes: RouteModule = [
  {
    path: "identity",
    component: () => import("./RouteSettingsIdentity.vue"),
    children: [
      {
        path: "",
        name: "settings-identity",
        redirect: { name: "settings-identity-create" },
      },
      {
        path: "create",
        name: "settings-identity-create",
        component: () => import("./create/RouteSettingsIdentityCreate.vue"),
      },
      {
        path: "import",
        name: "settings-identity-import",
        component: () => import("./import/RouteSettingsIdentityImport.vue"),
      },
      {
        path: "export",
        name: "settings-identity-export",
        component: () => import("./export/RouteSettingsIdentityExport.vue"),
        beforeEnter: requireIdentityGuard,
        meta: {
          requiresIdentity: true,
        },
      },
    ],
  },
];

export default identityRoutes;
