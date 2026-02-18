import { computed, shallowRef } from "vue";
import {
  PixPaxApiError,
  getPlatformAccountSession,
  getPlatformAuthSession,
  sendSignInOtp,
  signInWithEmail,
  signInWithOtp,
  signOutPlatformSession,
  signUpWithEmail,
} from "../api/client";
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
      const authSession = await getPlatformAuthSession();
      if (!authSession?.authenticated) {
        applyGuest("guest");
        await pixpaxAuth.validateToken({ force: true });
        return false;
      }

      try {
        const accountSession = await getPlatformAccountSession();
        applyAuthenticated(accountSession.user, accountSession.workspace);
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

async function registerWithEmail(input: { name: string; email: string; password: string }) {
  await signUpWithEmail({
    name: String(input.name || "").trim(),
    email: String(input.email || "").trim().toLowerCase(),
    password: String(input.password || ""),
  });
  return refreshSession({ force: true });
}

async function loginWithEmail(input: { email: string; password: string }) {
  await signInWithEmail({
    email: String(input.email || "").trim().toLowerCase(),
    password: String(input.password || ""),
  });
  return refreshSession({ force: true });
}

async function requestLoginOtp(email: string) {
  await sendSignInOtp({
    email: String(email || "").trim().toLowerCase(),
  });
}

async function loginWithOtp(input: { email: string; otp: string }) {
  await signInWithOtp({
    email: String(input.email || "").trim().toLowerCase(),
    otp: String(input.otp || "").trim(),
  });
  return refreshSession({ force: true });
}

async function logout() {
  const pixpaxAuth = usePixpaxAuth();
  try {
    await signOutPlatformSession();
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
    registerWithEmail,
    loginWithEmail,
    requestLoginOtp,
    loginWithOtp,
    logout,
  };
}
