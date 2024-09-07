export default [
  {
    path: "/:location",
    component: () => import("./RouteLocation.vue"),
    props: true,
    children: [
      {
        path: ":slug",
        component: () => import("./RouteLocationInfo.vue"),
        props: true,
      },
    ],
  },
];
