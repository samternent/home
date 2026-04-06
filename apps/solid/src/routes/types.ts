import type { RouteRecordRaw } from "vue-router";

export type AppShellMode = "standard" | "focus";
export type RouteModule = RouteRecordRaw[];

declare module "vue-router" {
  interface RouteMeta {
    shellMode?: AppShellMode;
  }
}
