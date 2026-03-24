import type { RouteModule } from "@/routes/types";

const appRoutes: RouteModule = [
  {
    path: "/app",
    name: "app",
    component: () => import("./RouteApp.vue"),
    children: [
      {
        path: "",
        redirect: "/app/library",
      },
      {
        path: "files",
        redirect: "/app/library",
      },
      {
        path: "library",
        name: "app-library",
        component: () => import("./RouteAppFiles.vue"),
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
