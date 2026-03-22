import { computed, shallowRef } from "vue";
import { PixpaxApiError, getPlatformAccountSession } from "@/modules/api/client";

type PixpaxAccountStatus = "loading" | "authenticated" | "guest" | "error";

type SessionUser = {
  id: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
};

type WorkspaceSummary = {
  workspaceId: string;
  name: string;
  role: string;
  capabilities: string[];
  createdAt: string;
  updatedAt: string;
} | null;

const status = shallowRef<PixpaxAccountStatus>("loading");
const sessionUser = shallowRef<SessionUser | null>(null);
const workspace = shallowRef<WorkspaceSummary>(null);
const error = shallowRef("");
let refreshInFlight: Promise<boolean> | null = null;
let bootstrapped = false;
let authClientPromise: Promise<typeof import("./platform-auth-client").platformAuthClient> | null =
  null;

async function loadPlatformAuthClient() {
  if (!authClientPromise) {
    authClientPromise = import("./platform-auth-client").then(
      (module) => module.platformAuthClient,
    );
  }
  return await authClientPromise;
}

function assertAuthSuccess<T extends { data: unknown; error: unknown }>(result: T, fallback: string) {
  if (!result || !("error" in result) || !("data" in result)) {
    throw new Error(fallback);
  }
  const { error: resultError } = result as { error: { message?: string } | null };
  if (resultError) {
    throw new Error(resultError.message || fallback);
  }
}

function applyGuest(nextStatus: PixpaxAccountStatus = "guest", nextError = "") {
  status.value = nextStatus;
  sessionUser.value = null;
  workspace.value = null;
  error.value = nextError;
}

function applyAuthenticated(user: SessionUser | null, nextWorkspace: WorkspaceSummary) {
  status.value = "authenticated";
  sessionUser.value = user;
  workspace.value = nextWorkspace;
  error.value = "";
}

async function refreshSession(options: { force?: boolean } = {}) {
  const force = options.force === true;
  if (!force && refreshInFlight) {
    return refreshInFlight;
  }

  const run = (async () => {
    status.value = "loading";
    error.value = "";
    try {
      try {
        const accountSession = await getPlatformAccountSession();
        if (!accountSession?.user?.id || !accountSession?.workspace?.workspaceId) {
          applyGuest("guest");
          return false;
        }
        applyAuthenticated(
          {
            id: String(accountSession.user.id || ""),
            email: accountSession.user.email,
            name: accountSession.user.name,
            image: accountSession.user.image,
          },
          accountSession.workspace,
        );
      } catch (accountError: unknown) {
        if (accountError instanceof PixpaxApiError && accountError.status === 401) {
          applyGuest("guest");
          return false;
        }
        throw accountError;
      }

      return true;
    } catch (nextError: unknown) {
      if (nextError instanceof PixpaxApiError && nextError.status === 401) {
        applyGuest("guest");
        return false;
      }
      applyGuest(
        "error",
        String((nextError as Error)?.message || "Unable to resolve family session."),
      );
      return false;
    } finally {
      if (refreshInFlight === run) refreshInFlight = null;
    }
  })();

  refreshInFlight = run;
  return run;
}

async function requestLoginOtp(email: string) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!normalizedEmail) {
    throw new Error("Email is required.");
  }
  const platformAuthClient = await loadPlatformAuthClient();
  const result = await platformAuthClient.emailOtp.sendVerificationOtp({
    email: normalizedEmail,
    type: "sign-in",
  });
  assertAuthSuccess(result, "Unable to send email verification code.");
}

async function loginWithOtp(input: { email: string; otp: string }) {
  const platformAuthClient = await loadPlatformAuthClient();
  const result = await platformAuthClient.signIn.emailOtp({
    email: String(input.email || "").trim().toLowerCase(),
    otp: String(input.otp || "").trim(),
  });
  assertAuthSuccess(result, "Unable to verify code.");
  return refreshSession({ force: true });
}

async function loginWithPasskey() {
  const platformAuthClient = await loadPlatformAuthClient();
  const result = await platformAuthClient.signIn.passkey();
  assertAuthSuccess(result, "Unable to sign in with passkey.");
  return refreshSession({ force: true });
}

async function registerPasskey(name = "PixPax family device") {
  const normalized = String(name || "").trim();
  const platformAuthClient = await loadPlatformAuthClient();
  const result = await platformAuthClient.passkey.addPasskey({
    name: normalized || undefined,
  });
  assertAuthSuccess(result, "Unable to register passkey.");
}

async function logout() {
  try {
    const platformAuthClient = await loadPlatformAuthClient();
    await platformAuthClient.signOut();
  } catch {
    // Ignore auth-provider signout failures and clear local state anyway.
  }
  applyGuest("guest");
  await refreshSession({ force: true });
  return true;
}

export function bootstrapPixpaxFamilyAccount() {
  if (bootstrapped || typeof window === "undefined") {
    return;
  }
  bootstrapped = true;
  refreshSession().catch(() => undefined);
}

export function usePixpaxFamilyAccount() {
  return {
    status: computed(() => status.value),
    user: computed(() => sessionUser.value),
    workspace: computed(() => workspace.value),
    error: computed(() => error.value),
    isAuthenticated: computed(() => status.value === "authenticated"),
    refreshSession,
    requestLoginOtp,
    loginWithOtp,
    loginWithPasskey,
    registerPasskey,
    logout,
  };
}
