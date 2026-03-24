import type { RouteModule } from "@/routes/types";
import appearanceRoutes from "./appearance";

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
        ],
      },
    ],
  },
];

export default settingsRoutes;
