export default [
  {
    path: "/:location",
    component: () => import("./RouteLocation.vue"),
    props: true,
    children: [
      {
        path: ":id",
        component: () => import("./RouteLocationInfo.vue"),
        props: true,
      },
    ],
  },
];
