import { beforeEach, describe, expect, it, vi } from "vitest";

const getPlatformAccountSession = vi.fn();
const getSession = vi.fn();
const sendVerificationOtp = vi.fn();
const emailOtpSignIn = vi.fn();
const passkeySignIn = vi.fn();
const addPasskey = vi.fn();
const signOut = vi.fn();

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
}));

vi.mock("@/modules/family/platform-auth-client", () => ({
  platformAuthClient: {
    getSession,
    emailOtp: {
      sendVerificationOtp,
    },
    signIn: {
      emailOtp: emailOtpSignIn,
      passkey: passkeySignIn,
    },
    passkey: {
      addPasskey,
    },
    signOut,
  },
}));

describe("family account", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    getSession.mockResolvedValue({
      data: {
        user: {
          id: "adult-1",
          email: "parent@example.com",
          name: "Parent",
        },
      },
      error: null,
    });
    getPlatformAccountSession.mockResolvedValue({
      ok: true,
      user: { id: "adult-1", email: "parent@example.com", name: "Parent" },
      workspace: {
        workspaceId: "ws-1",
        name: "Family",
        role: "owner",
        status: "active",
        createdAt: "2026-03-21T10:00:00.000Z",
        updatedAt: "2026-03-21T10:00:00.000Z",
        capabilities: ["pixpax.admin.manage"],
      },
    });
    sendVerificationOtp.mockResolvedValue({ data: { ok: true }, error: null });
    emailOtpSignIn.mockResolvedValue({ data: { ok: true }, error: null });
    passkeySignIn.mockResolvedValue({ data: { ok: true }, error: null });
    addPasskey.mockResolvedValue({ data: { ok: true }, error: null });
    signOut.mockResolvedValue({ data: { ok: true }, error: null });
  });

  it("sends OTP codes through the embedded platform auth client", async () => {
    const mod = await import("@/modules/family/usePixpaxFamilyAccount");
    const account = mod.usePixpaxFamilyAccount();

    await account.requestLoginOtp("Parent@Example.com");

    expect(sendVerificationOtp).toHaveBeenCalledWith({
      email: "parent@example.com",
      type: "sign-in",
    });
  });

  it("signs in with passkey and refreshes the family session", async () => {
    const mod = await import("@/modules/family/usePixpaxFamilyAccount");
    const account = mod.usePixpaxFamilyAccount();

    const ok = await account.loginWithPasskey();

    expect(ok).toBe(true);
    expect(passkeySignIn).toHaveBeenCalledTimes(1);
    expect(account.isAuthenticated.value).toBe(true);
    expect(account.user.value?.email).toBe("parent@example.com");
  });
});
