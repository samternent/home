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
  it("includes the landing, app shell sections, auth redirect, and appearance routes", () => {
    const paths = flattenPaths(routes);

    expect(paths).toContain("/");
    expect(paths).toContain("/app");
    expect(paths).toContain("/app/library");
    expect(paths).toContain("/app/open/:scope/:appId/:encodedPath(.*)");
    expect(paths).toContain("/app/sharing");
    expect(paths).toContain("/app/people");
    expect(paths).toContain("/app/account");
    expect(paths).toContain("/auth/redirect");
    expect(paths).toContain("/settings/appearance");
    expect(paths).not.toContain("/settings/identity/create");
  });
});
