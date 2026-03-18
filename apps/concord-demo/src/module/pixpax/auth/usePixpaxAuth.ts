import { computed, shallowRef } from "vue";
import { useLocalStorage } from "@vueuse/core";
import {
  PixPaxApiError,
  getPlatformAccountSession,
  getPlatformAuthSession,
  validateAdminSession,
} from "../api/client";

export type PixPaxPermission =
  | "pixpax.admin.manage"
  | "pixpax.analytics.read"
  | "pixpax.creator.publish"
  | "pixpax.creator.view";

type AuthStatus = "guest" | "validating" | "authenticated" | "invalid" | "error";
type AuthSource = "guest" | "platform-session" | "bearer-token";

const GUEST_PERMISSIONS: PixPaxPermission[] = ["pixpax.creator.view"];

const token = useLocalStorage("pixpax/admin/token", "");
const status = shallowRef<AuthStatus>("guest");
const source = shallowRef<AuthSource>("guest");
const permissions = shallowRef<PixPaxPermission[]>([...GUEST_PERMISSIONS]);
const error = shallowRef("");
const lastValidatedToken = shallowRef("");

let validateInFlight: Promise<boolean> | null = null;

function toUniquePermissions(input: string[]) {
  const known = new Set<PixPaxPermission>([
    "pixpax.admin.manage",
    "pixpax.analytics.read",
    "pixpax.creator.publish",
    "pixpax.creator.view",
  ]);
  const next = new Set<PixPaxPermission>(GUEST_PERMISSIONS);
  for (const value of input || []) {
    if (known.has(value as PixPaxPermission)) {
      next.add(value as PixPaxPermission);
    }
  }
  return [...next];
}

function applyGuest(nextStatus: AuthStatus = "guest", nextError = "") {
  status.value = nextStatus;
  source.value = "guest";
  permissions.value = [...GUEST_PERMISSIONS];
  error.value = nextError;
  if (!token.value) {
    lastValidatedToken.value = "";
  }
}

function applyAuthenticated(nextPermissions: string[], nextSource: AuthSource) {
  status.value = "authenticated";
  source.value = nextSource;
  permissions.value = toUniquePermissions(nextPermissions);
  error.value = "";
  if (nextSource === "bearer-token") {
    lastValidatedToken.value = String(token.value || "").trim();
  }
}

async function validateToken(options: { force?: boolean; preferToken?: boolean } = {}) {
  const force = options.force === true;
  const preferToken = options.preferToken === true;
  const normalizedToken = String(token.value || "").trim();

  if (
    !force &&
    status.value === "authenticated" &&
    (source.value === "platform-session" ||
      (source.value === "bearer-token" && lastValidatedToken.value === normalizedToken))
  ) {
    return true;
  }

  if (validateInFlight && !force) {
    return validateInFlight;
  }

  status.value = "validating";
  error.value = "";
  const currentRun = (async () => {
    let hasPlatformSession = false;

    try {
      if (!preferToken || !normalizedToken) {
        try {
          const authSession = await getPlatformAuthSession();
          if (authSession?.authenticated) {
            try {
              const accountSession = await getPlatformAccountSession();
              hasPlatformSession = true;
              applyAuthenticated(accountSession?.workspace?.capabilities || [], "platform-session");
              if (!normalizedToken) {
                return true;
              }
            } catch (accountError: unknown) {
              if (!(accountError instanceof PixPaxApiError) || accountError.status !== 401) {
                throw accountError;
              }
            }
          }
        } catch (sessionError: unknown) {
          if (!(sessionError instanceof PixPaxApiError) || sessionError.status !== 401) {
            throw sessionError;
          }
        }
      }

      if (normalizedToken) {
        try {
          const response = await validateAdminSession(normalizedToken);
          if (response?.authenticated) {
            applyAuthenticated(response.permissions || [], "bearer-token");
            return true;
          }
        } catch (tokenError: unknown) {
          if (!(tokenError instanceof PixPaxApiError) || tokenError.status !== 401) {
            throw tokenError;
          }
          if (!hasPlatformSession) {
            applyGuest("invalid", "Unauthorized.");
            return false;
          }
          return true;
        }
      }

      if (hasPlatformSession) {
        return true;
      }

      applyGuest("guest");
      return false;
    } catch (nextError: unknown) {
      applyGuest("error", String((nextError as Error)?.message || "Auth request failed."));
      return false;
    } finally {
      if (validateInFlight === currentRun) {
        validateInFlight = null;
      }
    }
  })();

  validateInFlight = currentRun;
  return currentRun;
}

function hasPermission(permission: PixPaxPermission) {
  return permissions.value.includes(permission);
}

async function ensurePermission(permission: PixPaxPermission) {
  if (hasPermission(permission)) return true;
  const ok = await validateToken();
  if (!ok) return false;
  return hasPermission(permission);
}

async function login(nextToken: string) {
  token.value = String(nextToken || "").trim();
  return validateToken({ force: true, preferToken: true });
}

function logout() {
  token.value = "";
  applyGuest("guest");
}

export function resetPixPaxAuthForTests() {
  token.value = "";
  applyGuest("guest");
  validateInFlight = null;
}

export function usePixpaxAuth() {
  return {
    token,
    status: computed(() => status.value),
    source: computed(() => source.value),
    permissions: computed(() => permissions.value),
    error: computed(() => error.value),
    isAuthenticated: computed(
      () => status.value === "authenticated" && source.value !== "guest"
    ),
    hasPermission,
    validateToken,
    ensurePermission,
    login,
    logout,
  };
}
