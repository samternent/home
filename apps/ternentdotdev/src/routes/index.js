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
    component: () => import("./RouteHome.vue"),
    children: [
      {
        path: "",
        component: () => import("./home/RouteHome.vue"),
      },
      {
        path: "game",
        component: () => import("./apps/RouteAppsGame.vue"),
      },
      {
        path: "sweet-shop",
        component: () => import("./apps/RouteAppsSweetShop.vue"),
      },
    ],
  },
  {
    path: "/app",
    component: () => import("./RouteLayout.vue"),
    children: [
      {
        path: "test",
        component: () => import("./RouteTest.vue"),
      },
      ...ledgerRoutes,
    ],
    // children: [
    //   ...aboutRoutes,
    //   ...appsRoutes,
    //   ...ledgerRoutes,
    //   ...legalRoutes,
    //   ...profileRoutes,
    //   ...settingsRoutes,
    //   ...solidRoutes,
    //   ...workRoutes,
    //   {
    //     path: "/test",
    //     component: () => import("./RouteTest.vue"),
    //   },
    // ],
  },
  {
    path: "/:path(.*)*",
    redirect() {
      return "/";
    },
  },
];
