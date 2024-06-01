import { ledgerRoutes } from "./ledger";

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
      {
        path: "stream",
        component: () => import("./stream/RouteStream.vue"),
      },
      {
        path: "s",
        component: () => import("./slides/RouteSlides.vue"),
        children: [
          {
            path: ":slideName",
            component: () => import("./slides/RouteSlidesView.vue"),
            props: true,
          },
        ],
      },
      {
        path: "app",
        component: () => import("./RouteLayout.vue"),
        children: [
          {
            path: "",
            component: () => import("./RouteTest.vue"),
          },
          {
            path: "profile",
            component: () => import("./profile/RouteProfile.vue"),
          },
          {
            path: "settings",
            component: () => import("./settings/RouteSettings.vue"),
          },
          ...ledgerRoutes,
        ],
      },
    ],
  },
  {
    path: "/:path(.*)*",
    redirect() {
      return "/";
    },
  },
];
