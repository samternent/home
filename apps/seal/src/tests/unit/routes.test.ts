import { describe, expect, it } from "vitest";
import { routes } from "@/routes";
import { useIdentitySession } from "@/modules/identity";

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
  it("includes seal workspace routes", () => {
    const paths = flattenPaths(routes);

    expect(paths).toContain("/");
    expect(paths).toContain("/app");
    expect(paths).toContain("/app/identity");
    expect(paths).toContain("/app/sign");
    expect(paths).toContain("/app/verify");
    expect(paths).toContain("/settings");
    expect(paths).toContain("/settings/appearance");
    expect(paths).toContain("/settings/identity");
    expect(paths).toContain("/settings/identity/create");
    expect(paths).toContain("/settings/identity/import");
    expect(paths).toContain("/settings/identity/export");
  });

  it("routes /app to identity by default when no identity is loaded", () => {
    const session = useIdentitySession();
    session.clearIdentity();
    session.setRememberInBrowser(false);

    const appRoute = routes.find((route) => route.path === "/app");
    const rootChild = appRoute?.children?.find((route) => route.path === "");

    expect(typeof rootChild?.redirect).toBe("function");
    expect((rootChild?.redirect as () => any)()).toEqual({ name: "app-sign" });
  });

  it("redirects settings identity routes to the app identity workspace", () => {
    expect(routes.find((route) => route.path === "/settings/identity")?.redirect).toEqual({ name: "app-identity" });
    expect(routes.find((route) => route.path === "/settings/identity/create")?.redirect).toEqual({ name: "app-identity" });
    expect(routes.find((route) => route.path === "/settings/identity/import")?.redirect).toEqual({ name: "app-identity" });
    expect(routes.find((route) => route.path === "/settings/identity/export")?.redirect).toEqual({ name: "app-identity" });
  });
});
