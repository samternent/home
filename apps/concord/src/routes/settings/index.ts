import type { RouteModule } from "@/routes/types";
import appearanceRoutes from "./appearance";
import identityRoutes from "./identity";

const settingsRoutes: RouteModule = [
  {
    path: "/settings",
    component: () => import("./RouteSettingsShell.vue"),
    children: [
      {
        path: "",
        component: () => import("./RouteSettings.vue"),
        children: [
          {
            path: "",
            redirect: { name: "settings-appearance" },
          },
          ...appearanceRoutes,
          ...identityRoutes,
        ],
      },
    ],
  },
];

export default settingsRoutes;
