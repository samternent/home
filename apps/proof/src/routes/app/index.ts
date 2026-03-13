import type { RouteModule } from "@/routes/types";
import { resolveAppDefaultRoute } from "@/modules/identity/identity.guard";

const appRoutes: RouteModule = [
  {
    path: "/app",
    component: () => import("./RouteAppShell.vue"),
    children: [
      {
        path: "",
        name: "app-root",
        redirect: () => resolveAppDefaultRoute(),
      },
      {
        path: "identity",
        name: "app-identity",
        component: () => import("./identity/RouteAppIdentity.vue"),
      },
      {
        path: "sign",
        name: "app-sign",
        component: () => import("./sign/RouteAppSign.vue"),
      },
      {
        path: "verify",
        name: "app-verify",
        component: () => import("./verify/RouteAppVerify.vue"),
      },
    ],
  },
];

export default appRoutes;
