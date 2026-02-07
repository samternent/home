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
      {
        path: "collections",
        component: () => import("./RoutePixPaxCollections.vue"),
      },
      {
        path: "admin",
        component: () => import("./RoutePixPaxAdmin.vue"),
      },
    ],
  },
];
