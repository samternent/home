import { beforeEach, describe, expect, it, vi } from "vitest";

const session = {
  info: {
    isLoggedIn: false,
    webId: undefined as string | undefined,
  },
  login: vi.fn(async (_input: unknown) => undefined),
  logout: vi.fn(async () => {
    session.info.isLoggedIn = false;
    session.info.webId = undefined;
  }),
};

const handleIncomingRedirect = vi.fn(async () => undefined);

vi.mock("@inrupt/solid-client-authn-browser", () => ({
  getDefaultSession: vi.fn(() => session),
  handleIncomingRedirect,
}));

async function importController() {
  vi.resetModules();
  return await import("@/modules/solid-session");
}

describe("solid session controller", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", "/app");
    localStorage.clear();
    session.info.isLoggedIn = false;
    session.info.webId = undefined;
    session.login.mockClear();
    session.logout.mockClear();
    handleIncomingRedirect.mockReset();
    handleIncomingRedirect.mockResolvedValue(undefined);
  });

  it("uses the chosen issuer and redirect URL for login", async () => {
    const { getSolidSessionController } = await importController();
    const controller = getSolidSessionController();

    controller.setIssuer("https://solidcommunity.net");
    await controller.login();

    expect(session.login).toHaveBeenCalledWith({
      oidcIssuer: "https://solidcommunity.net",
      redirectUrl: `${window.location.origin}/`,
      clientName: "Concord OS for Solid",
    });
    expect(localStorage.getItem("solid/solid-issuer")).toBe(
      "https://solidcommunity.net",
    );
  });

  it("clears authenticated state on logout", async () => {
    session.info.isLoggedIn = true;
    session.info.webId = "https://alice.example/profile/card#me";

    const { getSolidSessionController } = await importController();
    const controller = getSolidSessionController();

    expect(controller.isAuthenticated.value).toBe(true);
    expect(controller.webId.value).toBe("https://alice.example/profile/card#me");

    await controller.logout();

    expect(session.logout).toHaveBeenCalledTimes(1);
    expect(controller.isAuthenticated.value).toBe(false);
    expect(controller.webId.value).toBeNull();
  });

  it("stores a readable error when redirect handling fails", async () => {
    handleIncomingRedirect.mockRejectedValueOnce(new Error("OIDC redirect failed"));

    const { getSolidSessionController } = await importController();
    const controller = getSolidSessionController();

    await expect(controller.completeRedirect()).rejects.toThrow(
      "OIDC redirect failed",
    );
    expect(controller.status.value).toBe("error");
    expect(controller.error.value).toContain("OIDC redirect failed");
  });
});
