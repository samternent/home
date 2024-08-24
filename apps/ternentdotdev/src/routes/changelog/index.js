export default [
  {
    path: "/changelogs",
    component: () => import("./RouteChangelogs.vue"),
    children: [
      {
        path: "",
        component: () => import("./RouteChangelogsList.vue"),
      },
      {
        path: ":type/:name",
        component: () => import("./RouteChangelog.vue"),
        props: true,
      },
    ],
  },
];
