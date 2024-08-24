export default [
  {
    path: "/readme",
    component: () => import("./RouteReadmes.vue"),
    children: [
      {
        path: "",
        redirect: "/readme/apps/ternentdotdev",
      },
      {
        path: ":type/:name",
        component: () => import("./RouteReadme.vue"),
        props: true,
      },
    ],
  },
];
