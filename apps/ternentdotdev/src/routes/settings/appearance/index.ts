import type { RouteModule } from "@/routes/types";

const appearanceRoutes: RouteModule = [
  {
    path: "appearance",
    name: "settings-appearance",
    component: () => import("./RouteSettingsAppearance.vue"),
  },
];

export default appearanceRoutes;
