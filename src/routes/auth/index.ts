export const authRoutes = [
  {
    path: "/auth/signup",
    props: true,
    component: () => import("./RouteAuthSignup.vue"),
  },
  {
    path: "/auth/login",
    props: true,
    component: () => import("./RouteAuthLogin.vue"),
  },
  {
    path: "/auth/profile/:username",
    props: true,
    component: () => import("./RouteAuthProfile.vue"),
  },
];
