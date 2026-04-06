import { computed, ref, watch } from "vue";
import { appConfig } from "@/app/config/app.config";
import { useRunCoreRuntime } from "@/modules/run/core";
import { useRunProjectionState } from "@/modules/run/replay";
import { useRunLedgerFileActions, useRunWorkspaceActions } from "@/modules/run/services";

export type RunDemoBootstrapStatus = "idle" | "loading" | "ready" | "error";

const demoLedgerStorageKey = `${appConfig.appId}/demo-ledger-url/v1`;

let singleton: ReturnType<typeof createRunDemoIdentityModel> | null = null;

function canUseBrowser() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function loadStoredDemoLedgerUrl(): string | null {
  if (!canUseBrowser()) {
    return null;
  }

  const raw = localStorage.getItem(demoLedgerStorageKey);
  return raw?.trim() || null;
}

function persistDemoLedgerUrl(url: string | null) {
  if (!canUseBrowser()) {
    return;
  }

  if (!url) {
    localStorage.removeItem(demoLedgerStorageKey);
    return;
  }

  localStorage.setItem(demoLedgerStorageKey, url);
}

function normalizeMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return String(error || "Unknown demo bootstrap error.");
}

function nextDemoIdentityLabel(existingLabels: string[]): string {
  const used = new Set(existingLabels.map((label) => label.trim().toLowerCase()));

  for (let index = 1; index < 10_000; index += 1) {
    const candidate = `Demo user ${index}`;
    if (!used.has(candidate.toLowerCase())) {
      return candidate;
    }
  }

  return `Demo user ${Date.now()}`;
}

function createRunDemoIdentityModel() {
  const runtime = useRunCoreRuntime();
  const projection = useRunProjectionState();
  const ledgerFiles = useRunLedgerFileActions();
  const workspaceActions = useRunWorkspaceActions();
  const bootstrapStatusState = ref<RunDemoBootstrapStatus>("idle");
  const errorState = ref<string | null>(null);
  let bootstrapPromise: Promise<boolean> | null = null;

  async function createDemoIdentity() {
    errorState.value = null;
    const label = nextDemoIdentityLabel(
      runtime.identity.identities.value.map((record) => record.profile.label),
    );
    return await runtime.identity.createMnemonicIdentity({
      label,
    });
  }

  async function ensureDemoBootstrapped(): Promise<boolean> {
    if (!runtime.boot.ready.value) {
      return false;
    }

    if (bootstrapPromise) {
      return await bootstrapPromise;
    }

    bootstrapPromise = (async () => {
      bootstrapStatusState.value = "loading";
      errorState.value = null;

      try {
        if (!runtime.identity.identities.value.length) {
          await createDemoIdentity();
        }

        if (projection.activeProjection.value.ledgerId) {
          bootstrapStatusState.value = "ready";
          return true;
        }

        const storedDemoLedgerUrl = loadStoredDemoLedgerUrl();
        if (storedDemoLedgerUrl) {
          const selected = await workspaceActions.selectEntryByUrl(storedDemoLedgerUrl);
          if (selected.ok) {
            bootstrapStatusState.value = "ready";
            return true;
          }
          persistDemoLedgerUrl(null);
        }

        const created = await ledgerFiles.createLocalLedger();
        if (!created.ok) {
          throw new Error(created.error);
        }

        persistDemoLedgerUrl(created.value.entry.url);
        bootstrapStatusState.value = "ready";
        return true;
      } catch (error) {
        errorState.value = normalizeMessage(error);
        bootstrapStatusState.value = "error";
        return false;
      } finally {
        bootstrapPromise = null;
      }
    })();

    return await bootstrapPromise;
  }

  async function switchIdentity(identityId: string) {
    errorState.value = null;
    try {
      return await runtime.identity.switchIdentity(identityId);
    } catch (error) {
      errorState.value = normalizeMessage(error);
      throw error;
    }
  }

  watch(
    () => runtime.boot.ready.value,
    (ready) => {
      if (ready) {
        void ensureDemoBootstrapped();
      }
    },
    { immediate: true },
  );

  watch(
    () => projection.activeProjection.value.openContext?.resourceUrl ?? null,
    (resourceUrl) => {
      if (resourceUrl) {
        persistDemoLedgerUrl(resourceUrl);
      }
    },
    { immediate: true },
  );

  return {
    bootstrapStatus: computed(() => bootstrapStatusState.value),
    error: computed(() => errorState.value),
    identities: computed(() => runtime.identity.identities.value),
    activeIdentity: computed(() => runtime.identity.activeIdentity.value),
    hasBootstrapped: computed(() => bootstrapStatusState.value === "ready"),
    ensureDemoBootstrapped,
    createDemoIdentity,
    switchIdentity,
  };
}

export function useRunDemoIdentityModel() {
  if (!singleton) {
    singleton = createRunDemoIdentityModel();
  }

  return singleton;
}
