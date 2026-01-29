export default [
  {
    path: "/workspace",
    component: () => import("./Workspace.vue"),
    children: [
      {
        path: "",
        component: () => import("./WorkspaceHome.vue"),
        children: [
          { path: "", redirect: "/workspace/todo" },
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
            path: "epochs",
            alias: "/epochs",
            component: () => import("./WorkspaceEpochs.vue"),
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
