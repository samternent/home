import { computed, ref } from "vue";
import { appConfig } from "@/app/config/app.config";
import {
  PixpaxApiError,
  getPlatformAccountSession,
  type PixpaxAdminPermission,
  validatePixpaxAdminSession,
} from "@/modules/api/client";

type AdminAuthStatus = "guest" | "validating" | "authenticated" | "invalid" | "error";
type AdminAuthSource = "guest" | "platform-session" | "bearer-token";

const GUEST_PERMISSIONS: PixpaxAdminPermission[] = ["pixpax.creator.view"];
const tokenStorageKey = `${appConfig.appId}/admin/token`;
const tokenState = ref("");
const statusState = ref<AdminAuthStatus>("guest");
const sourceState = ref<AdminAuthSource>("guest");
const permissionsState = ref<PixpaxAdminPermission[]>([...GUEST_PERMISSIONS]);
const errorState = ref("");
const lastValidatedTokenState = ref("");

let hydrated = false;
let validateInFlight: Promise<boolean> | null = null;

function readTokenFromBrowser() {
  if (typeof window === "undefined") {
    return "";
  }
  const sessionValue = String(window.sessionStorage.getItem(tokenStorageKey) || "").trim();
  if (sessionValue) {
    return sessionValue;
  }
  const legacyValue = String(window.localStorage.getItem(tokenStorageKey) || "").trim();
  if (!legacyValue) {
    return "";
  }
  window.sessionStorage.setItem(tokenStorageKey, legacyValue);
  window.localStorage.removeItem(tokenStorageKey);
  return legacyValue;
}

function writeTokenToBrowser(value: string) {
  if (typeof window === "undefined") {
    return;
  }
  if (!value) {
    window.sessionStorage.removeItem(tokenStorageKey);
    window.localStorage.removeItem(tokenStorageKey);
    return;
  }
  window.sessionStorage.setItem(tokenStorageKey, value);
  window.localStorage.removeItem(tokenStorageKey);
}

function ensureHydrated() {
  if (hydrated) {
    return;
  }
  tokenState.value = readTokenFromBrowser();
  hydrated = true;
}

function toUniquePermissions(input: string[]) {
  const known = new Set<PixpaxAdminPermission>([
    "pixpax.admin.manage",
    "pixpax.analytics.read",
    "pixpax.creator.publish",
    "pixpax.creator.view",
  ]);
  const next = new Set<PixpaxAdminPermission>(GUEST_PERMISSIONS);
  for (const value of input || []) {
    if (known.has(value as PixpaxAdminPermission)) {
      next.add(value as PixpaxAdminPermission);
    }
  }
  return [...next];
}

function applyGuest(nextStatus: AdminAuthStatus = "guest", nextError = "") {
  statusState.value = nextStatus;
  sourceState.value = "guest";
  permissionsState.value = [...GUEST_PERMISSIONS];
  errorState.value = nextError;
  if (!tokenState.value) {
    lastValidatedTokenState.value = "";
  }
}

function applyAuthenticated(nextPermissions: string[], nextSource: AdminAuthSource) {
  statusState.value = "authenticated";
  sourceState.value = nextSource;
  permissionsState.value = toUniquePermissions(nextPermissions);
  errorState.value = "";
  if (nextSource === "bearer-token") {
    lastValidatedTokenState.value = tokenState.value;
  }
}

async function validateToken(options: { force?: boolean; preferToken?: boolean } = {}) {
  ensureHydrated();

  const force = options.force === true;
  const preferToken = options.preferToken === true;
  const normalizedToken = tokenState.value;

  if (
    !force &&
    statusState.value === "authenticated" &&
    (sourceState.value === "platform-session" ||
      (sourceState.value === "bearer-token" &&
        lastValidatedTokenState.value === normalizedToken))
  ) {
    return true;
  }

  if (validateInFlight && !force) {
    return validateInFlight;
  }

  statusState.value = "validating";
  errorState.value = "";

  const currentRun = (async () => {
    let hasPlatformSession = false;
    try {
      if (!preferToken || !normalizedToken) {
        try {
          const accountSession = await getPlatformAccountSession();
          const capabilities = accountSession?.workspace?.capabilities || [];
          if (Array.isArray(capabilities) && capabilities.length > 0) {
            hasPlatformSession = true;
            applyAuthenticated(capabilities, "platform-session");
            if (!normalizedToken) {
              return true;
            }
          }
        } catch (error: unknown) {
          if (!(error instanceof PixpaxApiError) || error.status !== 401) {
            throw error;
          }
        }
      }

      if (normalizedToken) {
        try {
          const response = await validatePixpaxAdminSession(normalizedToken);
          if (response?.authenticated) {
            applyAuthenticated(response.permissions || [], "bearer-token");
            return true;
          }
        } catch (error: unknown) {
          if (!(error instanceof PixpaxApiError) || error.status !== 401) {
            throw error;
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
    } catch (error: unknown) {
      applyGuest("error", String((error as Error)?.message || "Auth request failed."));
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

function hasPermission(permission: PixpaxAdminPermission) {
  return permissionsState.value.includes(permission);
}

async function ensurePermission(permission: PixpaxAdminPermission) {
  if (hasPermission(permission)) {
    return true;
  }
  const ok = await validateToken();
  if (!ok) {
    return false;
  }
  return hasPermission(permission);
}

async function login(nextToken: string) {
  tokenState.value = String(nextToken || "").trim();
  writeTokenToBrowser(tokenState.value);
  return validateToken({ force: true, preferToken: true });
}

function logout() {
  tokenState.value = "";
  writeTokenToBrowser("");
  applyGuest("guest");
}

export function resetPixpaxAdminAuthForTests() {
  tokenState.value = "";
  writeTokenToBrowser("");
  applyGuest("guest");
  validateInFlight = null;
}

export function usePixpaxAdminAuth() {
  ensureHydrated();

  return {
    token: computed({
      get: () => tokenState.value,
      set: (next) => {
        tokenState.value = String(next || "").trim();
        writeTokenToBrowser(tokenState.value);
      },
    }),
    status: computed(() => statusState.value),
    source: computed(() => sourceState.value),
    permissions: computed(() => permissionsState.value),
    error: computed(() => errorState.value),
    isAuthenticated: computed(
      () => statusState.value === "authenticated" && sourceState.value !== "guest",
    ),
    hasPermission,
    validateToken,
    ensurePermission,
    login,
    logout,
  };
}
