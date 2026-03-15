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
  it("includes create/import/export identity routes", () => {
    const paths = flattenPaths(routes);

    expect(paths).toContain("/settings/identity/create");
    expect(paths).toContain("/settings/identity/import");
    expect(paths).toContain("/settings/identity/export");
  });
});
