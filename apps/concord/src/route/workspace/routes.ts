export default [
  {
    path: "/workspace",
    component: () => import("./Workspace.vue"),
    children: [
      {
        path: "",
        component: () => import("./WorkspaceHome.vue"),
        children: [
          {
            path: "",
            redirect: (to) => ({
              path: "/workspace/todo",
              query: to.query,
              hash: to.hash,
            }),
          },
          {
            path: "todo",
            component: () => import("./WorkspaceTodo.vue"),
          },
          {
            path: "users",
            component: () => import("./WorkspaceUsers.vue"),
          },
          {
            path: "permissions",
            component: () => import("./WorkspacePermissions.vue"),
          },
          {
            path: "tamper",
            component: () => import("./WorkspaceTamper.vue"),
          },
          {
            path: "solid",
            component: () => import("./WorkspaceSolid.vue"),
          },
        ],
      },
    ],
  },
];
