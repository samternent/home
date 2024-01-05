export const aboutRoutes = [
  {
    path: "/about",
    component: () => import("./RouteAbout.vue"),
    children: [
      {
        path: "",
        redirect: "/about/who",
      },
      {
        path: "who",
        component: () => import("./RouteAboutWho.vue"),
      },
      {
        path: "cv",
        component: () => import("./RouteAboutCV.vue"),
      },
      {
        path: "stack",
        component: () => import("./RouteAboutStack.vue"),
      },
    ],
  },
];
