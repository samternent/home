import type { RouteModule } from "@/routes/types";

const appRoutes: RouteModule = [
  {
    path: "/app",
    name: "app",
    component: () => import("./RouteApp.vue"),
    children: [
      {
        path: "",
        component: () => import("./RouteAppDesktop.vue"),
      },
      {
        path: "finder",
        name: "app-finder",
        component: () => import("./RouteAppFinder.vue"),
      },
      {
        path: "terminal",
        name: "app-terminal",
        component: () => import("./RouteAppTerminal.vue"),
      },
      {
        path: "open/:scope/:appId/:encodedPath(.*)",
        name: "app-open",
        component: () => import("./RouteAppOpen.vue"),
      },
      {
        path: "sharing",
        name: "app-sharing",
        component: () => import("./RouteAppSharing.vue"),
      },
      {
        path: "people",
        name: "app-people",
        component: () => import("./RouteAppPeople.vue"),
      },
      {
        path: "account",
        name: "app-account",
        component: () => import("./RouteAppAccount.vue"),
      },
    ],
  },
];

export default appRoutes;
