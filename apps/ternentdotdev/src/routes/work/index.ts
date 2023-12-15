export const workRoutes = [
  {
    path: "/work",
    component: () => import("./RouteWork.vue"),
    children: [
      {
        path: "",
        redirect: "/work/football-social",
      },
      {
        path: "concords",
        component: () => import("./RouteWorkConcords.vue"),
      },
      {
        path: "football-social",
        component: () => import("./RouteWorkFootballSocial.vue"),
      },
      {
        path: "gzip",
        component: () => import("./RouteWorkGzip.vue"),
      },
      {
        path: "teamwork",
        component: () => import("./RouteWorkTeamwork.vue"),
      },
    ],
  },
];
