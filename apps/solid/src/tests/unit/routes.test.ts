import { describe, expect, it } from "vitest";
import { routes } from "@/routes";

function flattenPaths(input: any[], parent = ""): string[] {
  return input.flatMap((route) => {
    const path = route.path.startsWith("/")
      ? route.path
      : `${parent}/${route.path}`.replace(/\/+/g, "/");

    const own = route.path.includes(":pathMatch") ? [] : [path];
    const children = route.children ? flattenPaths(route.children, path) : [];
    return [...own, ...children];
  });
}

describe("routes", () => {
  it("includes the root auth/core flow, legacy app redirect, and auth redirect", () => {
    const paths = flattenPaths(routes);

    expect(paths).toContain("/");
    expect(paths).toContain("/app");
    expect(paths).toContain("/auth/redirect");
  });
});
