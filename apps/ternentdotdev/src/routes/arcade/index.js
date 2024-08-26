export default [
  {
    path: "/arcade",
    component: () => import("./RouteApps.vue"),
    children: [
      {
        path: "",
        redirect: "/arcade/game",
      },
      // {
      //   path: "murder",
      //   component: () => import("./RouteAppsMurder.vue"),
      // },
      {
        path: "game",
        component: () => import("./RouteAppsGame.vue"),
      },
    ],
  },
];
