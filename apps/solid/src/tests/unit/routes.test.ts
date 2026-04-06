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
  it("includes the home shell surfaces without a dedicated auth screen", () => {
    const paths = flattenPaths(routes);

    expect(paths).toContain("/");
    expect(paths).toContain("/terminal");
    expect(paths).toContain("/explorer");
    expect(paths).toContain("/tasks");
    expect(paths).toContain("/tasks/permissions");
    expect(paths).toContain("/demo");
    expect(paths).toContain("/permissions");
    expect(paths).toContain("/launch");
    expect(paths).toContain("/launch/start");
    expect(paths).toContain("/launch/items");
    expect(paths).toContain("/launch/tasks");
    expect(paths).not.toContain("/auth/redirect");
  });
});
