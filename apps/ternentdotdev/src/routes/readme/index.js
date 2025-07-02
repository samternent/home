export default [
  {
    path: "/readme",
    component: () => import("./RouteReadmes.vue"),
    children: [
      {
        path: "",
        component: () => import("./RouteReadmesList.vue"),
      },
      {
        path: ":type/:name",
        component: () => import("./RouteReadme.vue"),
        props: true,
      },
    ],
  },
];
