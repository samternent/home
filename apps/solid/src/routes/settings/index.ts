import type { RouteModule } from "@/routes/types";

const settingsRoutes: RouteModule = [
  {
    path: "/settings",
    component: () => import("./RouteSettingsShell.vue"),
    children: [
      {
        path: "",
        redirect: "/settings/appearance",
      },
      {
        path: "appearance",
        component: () => import("./RouteSettings.vue"),
      },
    ],
  },
];

export default settingsRoutes;
