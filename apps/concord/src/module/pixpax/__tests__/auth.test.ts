// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { requirePixPaxPermission } from "../auth/guards";
import { resetPixPaxAuthForTests, usePixpaxAuth } from "../auth/usePixpaxAuth";
import { PixPaxApiError, validateAdminSession } from "../api/client";

vi.mock("../api/client", async () => {
  const actual = await vi.importActual<typeof import("../api/client")>(
    "../api/client"
  );
  return {
    ...actual,
    validateAdminSession: vi.fn(),
  };
});

describe("usePixpaxAuth", () => {
  beforeEach(() => {
    window.localStorage.clear();
    resetPixPaxAuthForTests();
    vi.mocked(validateAdminSession).mockReset();
  });

  it("keeps creator view permission for guests", () => {
    const auth = usePixpaxAuth();
    expect(auth.hasPermission("pixpax.creator.view")).toBe(true);
    expect(auth.hasPermission("pixpax.admin.manage")).toBe(false);
  });

  it("deduplicates concurrent token validation requests", async () => {
    vi.mocked(validateAdminSession).mockResolvedValue({
      ok: true,
      authenticated: true,
      permissions: [
        "pixpax.admin.manage",
        "pixpax.analytics.read",
        "pixpax.creator.publish",
        "pixpax.creator.view",
      ],
    });

    const auth = usePixpaxAuth();
    auth.token.value = "test-token";

    const [first, second] = await Promise.all([
      auth.ensurePermission("pixpax.admin.manage"),
      auth.ensurePermission("pixpax.analytics.read"),
    ]);

    expect(first).toBe(true);
    expect(second).toBe(true);
    expect(vi.mocked(validateAdminSession)).toHaveBeenCalledTimes(1);
  });

  it("falls back to guest permission when token is rejected", async () => {
    vi.mocked(validateAdminSession).mockRejectedValue(
      new PixPaxApiError("Unauthorized.", 401, { error: "Unauthorized." })
    );
    const auth = usePixpaxAuth();
    auth.token.value = "bad-token";

    const ok = await auth.ensurePermission("pixpax.admin.manage");
    expect(ok).toBe(false);
    expect(auth.hasPermission("pixpax.creator.view")).toBe(true);
    expect(auth.hasPermission("pixpax.admin.manage")).toBe(false);
  });
});

describe("pixpax permission guards", () => {
  beforeEach(() => {
    window.localStorage.clear();
    resetPixPaxAuthForTests();
    vi.mocked(validateAdminSession).mockReset();
  });

  it("redirects to login with redirect query when missing permission", async () => {
    const guard = requirePixPaxPermission("pixpax.analytics.read");
    const result = await guard(
      { fullPath: "/pixpax/control/analytics" } as any,
      {} as any
    );

    expect(result).toEqual({
      path: "/pixpax/control/login",
      query: {
        redirect: "/pixpax/control/analytics",
      },
    });
  });
});
