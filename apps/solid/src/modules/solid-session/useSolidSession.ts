import {
  computed,
  ref,
  shallowRef,
  type ComputedRef,
} from "vue";
import {
  getDefaultSession,
  handleIncomingRedirect,
  type Session,
} from "@inrupt/solid-client-authn-browser";
import { appConfig } from "@/app/config/app.config";

export type SolidSessionStatus =
  | "idle"
  | "restoring"
  | "ready"
  | "redirecting"
  | "error";

export type SolidSessionController = {
  session: ComputedRef<Session | null>;
  status: ComputedRef<SolidSessionStatus>;
  isAuthenticated: ComputedRef<boolean>;
  webId: ComputedRef<string | null>;
  issuer: ComputedRef<string>;
  error: ComputedRef<string | null>;
  providers: readonly string[];
  setIssuer(next: string): void;
  login(nextIssuer?: string): Promise<void>;
  logout(): Promise<void>;
  restore(): Promise<void>;
  completeRedirect(): Promise<void>;
};

const defaultProviders = [
  "https://login.inrupt.com",
  "https://inrupt.net",
  "https://solidcommunity.net",
  "https://solidweb.me",
] as const;

const issuerStorageKey = `${appConfig.appId}/solid-issuer`;
const providerList = [...defaultProviders];
const stateSession = shallowRef<Session | null>(null);
const stateIsAuthenticated = ref(false);
const stateStatus = ref<SolidSessionStatus>("idle");
const stateIssuer = ref(defaultProviders[0]);
const stateError = ref<string | null>(null);
const stateWebId = ref<string | null>(null);
let restorePromise: Promise<void> | null = null;

function canUseBrowser(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function normalizeMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return String(error || "Unknown Solid session error.");
}

function getSession(): Session {
  return getDefaultSession();
}

function loadStoredIssuer(): string {
  if (!canUseBrowser()) {
    return defaultProviders[0];
  }

  try {
    const stored = localStorage.getItem(issuerStorageKey)?.trim();
    return stored || defaultProviders[0];
  } catch {
    return defaultProviders[0];
  }
}

function persistIssuer(next: string) {
  stateIssuer.value = next;
  if (!canUseBrowser()) {
    return;
  }

  try {
    localStorage.setItem(issuerStorageKey, next);
  } catch {
    return;
  }
}

function syncSession() {
  if (!canUseBrowser()) {
    stateSession.value = null;
    stateIsAuthenticated.value = false;
    stateWebId.value = null;
    return;
  }

  const session = getSession();
  stateSession.value = session;
  stateIsAuthenticated.value = Boolean(session.info.isLoggedIn);
  stateWebId.value = session.info.webId ?? null;
}

function redirectUrl(): string {
  if (!canUseBrowser()) {
    return "";
  }

  return new URL("/auth/redirect", window.location.origin).toString();
}

async function restoreInternal() {
  if (!canUseBrowser()) {
    stateStatus.value = "ready";
    return;
  }

  stateStatus.value = "restoring";
  stateError.value = null;
  syncSession();

  try {
    await handleIncomingRedirect({
      restorePreviousSession: true,
    });
    syncSession();
    stateStatus.value = "ready";
  } catch (error) {
    syncSession();
    stateStatus.value = "error";
    stateError.value = `Solid sign-in could not be restored: ${normalizeMessage(error)}`;
    throw error;
  }
}

async function restore() {
  if (restorePromise) {
    return await restorePromise;
  }

  restorePromise = restoreInternal().finally(() => {
    restorePromise = null;
  });

  return await restorePromise;
}

async function completeRedirect() {
  await restore();
}

async function login(nextIssuer?: string) {
  if (!canUseBrowser()) {
    return;
  }

  const issuer = String(nextIssuer ?? stateIssuer.value).trim();
  if (!issuer) {
    stateStatus.value = "error";
    stateError.value = "Enter a Solid OIDC issuer to continue.";
    return;
  }

  persistIssuer(issuer);
  stateStatus.value = "redirecting";
  stateError.value = null;
  syncSession();

  await getSession().login({
    oidcIssuer: issuer,
    redirectUrl: redirectUrl(),
    clientName: appConfig.appTitle,
  });
}

async function logout() {
  if (!canUseBrowser()) {
    return;
  }

  stateError.value = null;
  await getSession().logout();
  syncSession();
  stateStatus.value = "ready";
}

stateIssuer.value = loadStoredIssuer();
syncSession();

const singleton: SolidSessionController = {
  session: computed(() => stateSession.value),
  status: computed(() => stateStatus.value),
  isAuthenticated: computed(() => stateIsAuthenticated.value),
  webId: computed(() => stateWebId.value),
  issuer: computed(() => stateIssuer.value),
  error: computed(() => stateError.value),
  providers: providerList,
  setIssuer(next: string) {
    persistIssuer(String(next || "").trim());
  },
  login,
  logout,
  restore,
  completeRedirect,
};

export function createSolidSessionController(): SolidSessionController {
  return singleton;
}

export function getSolidSessionController(): SolidSessionController {
  return singleton;
}
