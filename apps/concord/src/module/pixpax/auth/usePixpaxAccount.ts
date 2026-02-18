import { computed, shallowRef } from "vue";
import {
  PixPaxApiError,
  getPlatformAccountSession,
} from "../api/client";
import { platformAuthClient } from "./platform-auth-client";
import { usePixpaxAuth } from "./usePixpaxAuth";

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

function assertAuthSuccess<T extends { data: unknown; error: unknown }>(
  result: T,
  fallback: string
) {
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
  if (!force && refreshInFlight) return refreshInFlight;

  const pixpaxAuth = usePixpaxAuth();

  const run = (async () => {
    status.value = "loading";
    error.value = "";
    try {
      const authSession = await platformAuthClient.getSession();
      if (authSession.error || !authSession.data?.user?.id) {
        applyGuest("guest");
        await pixpaxAuth.validateToken({ force: true });
        return false;
      }

      try {
        const accountSession = await getPlatformAccountSession();
        applyAuthenticated(
          {
            id: String(authSession.data.user.id || ""),
            email: authSession.data.user.email,
            name: authSession.data.user.name,
            image: authSession.data.user.image,
          },
          accountSession.workspace
        );
      } catch (accountError: unknown) {
        if (accountError instanceof PixPaxApiError && accountError.status === 401) {
          applyGuest("guest");
          await pixpaxAuth.validateToken({ force: true });
          return false;
        }
        throw accountError;
      }

      await pixpaxAuth.validateToken({ force: true });
      return true;
    } catch (nextError: unknown) {
      if (nextError instanceof PixPaxApiError && nextError.status === 401) {
        applyGuest("guest");
        await pixpaxAuth.validateToken({ force: true });
        return false;
      }
      applyGuest(
        "error",
        String((nextError as Error)?.message || "Unable to resolve account session.")
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
  const result = await platformAuthClient.emailOtp.sendVerificationOtp({
    email: String(email || "").trim().toLowerCase(),
    type: "sign-in",
  });
  assertAuthSuccess(result, "Unable to send email verification code.");
}

async function loginWithOtp(input: { email: string; otp: string }) {
  const result = await platformAuthClient.signIn.emailOtp({
    email: String(input.email || "").trim().toLowerCase(),
    otp: String(input.otp || "").trim(),
  });
  assertAuthSuccess(result, "Unable to verify code.");
  return refreshSession({ force: true });
}

async function loginWithPasskey() {
  const result = await platformAuthClient.signIn.passkey();
  assertAuthSuccess(result, "Unable to sign in with passkey.");
  return refreshSession({ force: true });
}

async function registerPasskey(name = "PixPax device") {
  const normalized = String(name || "").trim();
  const result = await platformAuthClient.passkey.addPasskey({
    name: normalized || undefined,
  });
  assertAuthSuccess(result, "Unable to register passkey.");
}

async function logout() {
  const pixpaxAuth = usePixpaxAuth();
  try {
    await platformAuthClient.signOut();
  } catch {
    // no-op; continue clearing local auth caches.
  }
  pixpaxAuth.logout();
  await refreshSession({ force: true });
}

export function usePixpaxAccount() {
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
