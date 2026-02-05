export default [
  {
    path: "/pixpax",
    component: () => import("./RoutePixPax.vue"),
    children: [
      {
        path: "",
        component: () => import("./RoutePixPaxMain.vue"),
      },
    ],
  },
];
