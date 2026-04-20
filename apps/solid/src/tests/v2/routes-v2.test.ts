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

describe("v2 routes", () => {
  it("exposes only home and permissions plus catch-all redirect", () => {
    const paths = flattenPaths(routes);

    expect(paths).toContain("/");
    expect(paths).toContain("/permissions");
    expect(paths).not.toContain("/docs");

    expect(paths).not.toContain("/shopping");
    expect(paths).not.toContain("/tasks");
    expect(paths).not.toContain("/demo");
    expect(paths).not.toContain("/users");
    expect(paths).not.toContain("/terminal");
    expect(paths).not.toContain("/explorer");

    const catchAll = routes.find((route) => route.path.includes(":pathMatch"));
    expect(catchAll?.redirect).toBe("/");
  });
});
