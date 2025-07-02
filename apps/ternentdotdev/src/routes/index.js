import { appRoutes } from "./app";
import { ledgerRoutes } from "./ledger";
import { solidRoutes } from "./solid";
import { toolsRoutes } from "./tools";
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

      {
        path: "stream",
        component: () => import("./stream/RouteStream.vue"),
      },
      {
        path: "slide",
        component: () => import("./slides/RouteSlides.vue"),
        children: [
          {
            path: ":slideName",
            component: () => import("./slides/RouteSlidesView.vue"),
            props: true,
          },
        ],
      },
      ...arcade,
      ...changelog,
      ...readme,
      ...settings,
      ...toolsRoutes,
      ...appRoutes,
      ...solidRoutes,
      ...ledgerRoutes,
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
