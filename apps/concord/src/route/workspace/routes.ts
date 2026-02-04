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
              path: "/workspace/apps",
              query: to.query,
              hash: to.hash,
            }),
          },
          {
            path: "todo",
            redirect: (to) => ({
              path: "/workspace/apps/todos",
              query: to.query,
              hash: to.hash,
            }),
          },
          {
            path: "apps",
            component: () => import("./WorkspaceApps.vue"),
            children: [
              {
                path: "",
                redirect: (to) => ({
                  path: "/workspace/apps/todos",
                  query: to.query,
                  hash: to.hash,
                }),
              },
              {
                path: "todos",
                component: () => import("./WorkspaceTodo.vue"),
              },
              {
                path: "patients",
                component: () => import("./WorkspacePatients.vue"),
              },
              {
                path: "social",
                component: () => import("./WorkspaceSocial.vue"),
              },
              {
                path: "stickerbook",
                component: () => import("./WorkspaceStickerbook.vue"),
              },
              {
                path: "vault",
                component: () => import("./WorkspaceVault.vue"),
              },
            ],
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
