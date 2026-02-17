import { computed, shallowRef } from "vue";
import { useLocalStorage } from "@vueuse/core";
import { PixPaxApiError, validateAdminSession } from "../api/client";

export type PixPaxPermission =
  | "pixpax.admin.manage"
  | "pixpax.analytics.read"
  | "pixpax.creator.publish"
  | "pixpax.creator.view";

type AuthStatus = "guest" | "validating" | "authenticated" | "invalid" | "error";

const GUEST_PERMISSIONS: PixPaxPermission[] = ["pixpax.creator.view"];

const token = useLocalStorage("pixpax/admin/token", "");
const status = shallowRef<AuthStatus>("guest");
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
  permissions.value = [...GUEST_PERMISSIONS];
  error.value = nextError;
  if (!token.value) {
    lastValidatedToken.value = "";
  }
}

function applyAuthenticated(nextPermissions: string[]) {
  status.value = "authenticated";
  permissions.value = toUniquePermissions(nextPermissions);
  error.value = "";
  lastValidatedToken.value = String(token.value || "").trim();
}

async function validateToken(options: { force?: boolean } = {}) {
  const force = options.force === true;
  const normalizedToken = String(token.value || "").trim();
  if (!normalizedToken) {
    applyGuest("guest");
    return false;
  }

  if (
    !force &&
    status.value === "authenticated" &&
    lastValidatedToken.value === normalizedToken
  ) {
    return true;
  }

  if (validateInFlight && !force) {
    return validateInFlight;
  }

  status.value = "validating";
  error.value = "";
  const currentRun = (async () => {
    try {
      const response = await validateAdminSession(normalizedToken);
      if (!response?.authenticated) {
        applyGuest("invalid", "Unauthorized.");
        return false;
      }
      applyAuthenticated(response.permissions || []);
      return true;
    } catch (nextError: unknown) {
      if (nextError instanceof PixPaxApiError && nextError.status === 401) {
        applyGuest("invalid", "Unauthorized.");
        return false;
      }
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
  return validateToken({ force: true });
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
    permissions: computed(() => permissions.value),
    error: computed(() => error.value),
    isAuthenticated: computed(() => status.value === "authenticated"),
    hasPermission,
    validateToken,
    ensurePermission,
    login,
    logout,
  };
}
