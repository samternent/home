import type { RouteModule } from "@/routes/types";

const authRoutes: RouteModule = [
  {
    path: "/auth/redirect",
    name: "auth-redirect",
    component: () => import("./RouteAuthRedirect.vue"),
  },
];

export default authRoutes;
