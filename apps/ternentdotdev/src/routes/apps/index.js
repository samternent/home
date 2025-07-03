export const appsRoutes = [
  {
    path: "apps",
    component: () => import("./RouteApps.vue"),
    children: [
      {
        path: "",
        redirect: (to) => {
          // If there are apps, redirect to the first app; otherwise, show dashboard
          // This logic will be handled in RouteApps.vue if needed, but for now, fallback to dashboard
          // (You can enhance this with store access if needed)
          return "/apps/redirect";
        },
      },
      {
        path: "redirect",
        component: () => import("./RouteAppRedirect.vue"),
      },
      {
        path: "new",
        component: () => import("../builder/RouteBuilder.vue"),
      },
      {
        path: ":appId",
        component: () => import("./RouteAppsView.vue"),
        props: true,
      },
    ],
  },
];
