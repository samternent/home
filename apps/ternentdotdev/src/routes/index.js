import { appRoutes } from "./app";
import changelogRoutes from "./changelog";

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
      ...changelogRoutes,
    ],
  },

  {
    path: "/solid/redirect",
    component: () => import("./solid/RouteSolidRedirect.vue"),
  },
  ...appRoutes,
  {
    path: "/:path(.*)*",
    redirect() {
      return "/";
    },
  },
];
