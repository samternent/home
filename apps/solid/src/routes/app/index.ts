import type { RouteModule } from "@/routes/types";

const appRoutes: RouteModule = [
  {
    path: "/app",
    name: "app",
    redirect: "/",
  },
];

export default appRoutes;
