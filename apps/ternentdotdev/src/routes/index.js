import { aboutRoutes } from "./about";
import { appsRoutes } from "./apps";
import { ledgerRoutes } from "./ledger";
import { legalRoutes } from "./legal";
import { settingsRoutes } from "./settings";
import { solidRoutes } from "./solid";
import { profileRoutes } from "./profile";
import { workRoutes } from "./work";

export default [
  {
    path: "",
    component: () => import("./RouteLayout.vue"),
    children: [
      {
        path: "",
        redirect: "/l/",
      },
      ...aboutRoutes,
      ...appsRoutes,
      ...ledgerRoutes,
      ...legalRoutes,
      ...profileRoutes,
      ...settingsRoutes,
      ...solidRoutes,
      ...workRoutes,
    ],
  },
];
