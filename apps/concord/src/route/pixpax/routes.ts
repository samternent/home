export default [
  {
    path: "/pixpax",
    component: () => import("./RoutePixPax.vue"),
    children: [
      {
        path: "",
        component: () => import("./RoutePixPaxMain.vue"),
      },
      {
        path: "about",
        component: () => import("./RoutePixPaxAbout.vue"),
      },
    ],
  },
];
