import { ledgerRoutes } from "./ledger";
import { solidRoutes } from "./solid";
import { toolsRoutes } from "./tools";
import { builderRoutes } from "./builder";
import { appsRoutes } from "./apps";
import changelog from "./changelog";
import readme from "./readme";
import arcade from "./arcade";
import settings from "./settings";

export default [
  {
    path: "",
    component: () => import("./RouteHome.vue"),
    children: [
      {
        path: "",
        component: () => import("./home/RouteHome.vue"),
      },
      ...toolsRoutes,
      ...arcade,
      {
        path: "t",
        component: () => import("./app/RouteApp.vue"),
        children: [
          {
            path: "",
            redirect: "/t/apps",
          },
          ...changelog,
          ...readme,
          ...settings,

          ...solidRoutes,
          ...appsRoutes,
          ...builderRoutes,
          ...ledgerRoutes,
        ],
      },
    ],
  },

  {
    path: "/solid/redirect",
    component: () => import("./solid/RouteSolidRedirect.vue"),
  },
  {
    path: "/:path(.*)*",
    redirect() {
      return "/";
    },
  },
];
