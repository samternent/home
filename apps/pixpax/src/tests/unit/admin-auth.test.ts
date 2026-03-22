import { beforeEach, describe, expect, it, vi } from "vitest";

const getPlatformAccountSession = vi.fn();
const validatePixpaxAdminSession = vi.fn();

class MockPixpaxApiError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

vi.mock("@/modules/api/client", () => ({
  PixpaxApiError: MockPixpaxApiError,
  getPlatformAccountSession,
  validatePixpaxAdminSession,
}));

describe("admin auth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("accepts platform sessions with admin capability", async () => {
    getPlatformAccountSession.mockResolvedValue({
      ok: true,
      user: { id: "user-1" },
      workspace: {
        workspaceId: "ws-1",
        name: "Workspace",
        role: "owner",
        status: "active",
        createdAt: "2026-03-21T10:00:00.000Z",
        updatedAt: "2026-03-21T10:00:00.000Z",
        capabilities: ["pixpax.admin.manage"],
      },
    });

    const mod = await import("@/modules/admin-auth");
    mod.resetPixpaxAdminAuthForTests();
    const auth = mod.usePixpaxAdminAuth();

    const ok = await auth.validateToken({ force: true });

    expect(ok).toBe(true);
    expect(auth.isAuthenticated.value).toBe(true);
    expect(auth.source.value).toBe("platform-session");
    expect(auth.hasPermission("pixpax.admin.manage")).toBe(true);
  });

  it("falls back to bearer token when no platform session exists", async () => {
    getPlatformAccountSession.mockRejectedValue(
      new MockPixpaxApiError("Unauthorized.", 401, { error: "Unauthorized." }),
    );
    validatePixpaxAdminSession.mockResolvedValue({
      ok: true,
      authenticated: true,
      permissions: ["pixpax.admin.manage"],
    });

    const mod = await import("@/modules/admin-auth");
    mod.resetPixpaxAdminAuthForTests();
    const auth = mod.usePixpaxAdminAuth();

    const ok = await auth.login("local-admin-token");

    expect(ok).toBe(true);
    expect(auth.isAuthenticated.value).toBe(true);
    expect(auth.source.value).toBe("bearer-token");
    expect(auth.token.value).toBe("local-admin-token");
    expect(sessionStorage.getItem("pixpax/admin/token")).toBe("local-admin-token");
    expect(localStorage.getItem("pixpax/admin/token")).toBeNull();
  });
});
