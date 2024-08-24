export default [
  {
    path: "/changelog",
    component: () => import("./RouteChangelogs.vue"),
    children: [
      {
        path: "",
        redirect: "/changelog/apps/ternentdotdev",
      },
      {
        path: ":type/:name",
        component: () => import("./RouteChangelog.vue"),
        props: true,
      },
    ],
  },
];
