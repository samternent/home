import type { RouteModule } from "@/routes/types";

const homeRoutes: RouteModule = [
  {
    path: "/",
    component: () => import("./RouteApp.vue"),
    children: [
      {
        path: "",
        component: () => import("./RouteAppDashboard.vue"),
      },
      {
        path: "terminal",
        redirect: "/",
      },
      {
        path: "explorer",
        redirect: "/",
      },
      {
        path: "tasks",
        component: () => import("./RouteAppTasksShell.vue"),
        children: [
          {
            path: "",
            component: () => import("./RouteAppTasks.vue"),
          },
          {
            path: "permissions",
            component: () => import("./RouteAppPermissions.vue"),
          },
        ],
      },
      {
        path: "demo",
        component: () => import("./RouteAppDemo.vue"),
        meta: {
          shellMode: "focus",
        },
      },
      {
        path: "permissions",
        redirect: "/tasks/permissions",
      },
      {
        path: "launch",
        redirect: "/",
      },
      {
        path: "launch/start",
        redirect: "/",
      },
      {
        path: "launch/items",
        redirect: "/tasks",
      },
      {
        path: "launch/tasks",
        redirect: "/tasks",
      },
    ],
  },
];

export default homeRoutes;
