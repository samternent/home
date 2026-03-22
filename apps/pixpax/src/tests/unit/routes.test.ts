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
  it("includes PixPax landing, redeem, app, and local settings routes", () => {
    const paths = flattenPaths(routes);

    expect(paths).toContain("/");
    expect(paths).toContain("/redeem");
    expect(paths).toContain("/app/pixbook");
    expect(paths).toContain("/app/collections");
    expect(paths).toContain("/app/collections/:collectionId");
    expect(paths).toContain("/app/settings/my-device");
    expect(paths).toContain("/app/settings/children");
    expect(paths).toContain("/app/settings/family");
    expect(paths).toContain("/app/settings/appearance");
    expect(paths).toContain("/app/settings/import-export");
    expect(paths).toContain("/app/admin");
    expect(paths).toContain("/app/admin/login");
  });
});
