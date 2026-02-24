import { computed, inject, provide, shallowRef } from "vue";
import { usePixpaxActivityLock } from "./usePixpaxActivityLock";
import {
  type PixpaxContextStore,
  usePixpaxContextStore,
} from "./usePixpaxContextStore";

const usePixpaxSwitchContextSymbol = Symbol("usePixpaxSwitchContext");

export type SwitchResult = {
  ok: boolean;
  blocked?: boolean;
  warning?: string;
  message?: string;
  error?: string;
};

export type PixpaxSwitchContext = ReturnType<typeof createPixpaxSwitchContext>;

type CreatePixpaxSwitchContextOptions = {
  context?: PixpaxContextStore;
};

function createPixpaxSwitchContext(
  options: CreatePixpaxSwitchContextOptions = {}
) {
  const context = options.context ?? usePixpaxContextStore();
  const activity = usePixpaxActivityLock();

  const switchBusy = shallowRef(false);
  const switchMessage = shallowRef("");
  const switchWarning = shallowRef("");
  const switchError = shallowRef("");

  let inFlight: Promise<SwitchResult> | null = null;

  const isSwitchBlocked = computed(() => activity.isActivityLocked("pack-open"));

  function identityName(identity: { metadata?: Record<string, unknown> } | null) {
    const username = String(identity?.metadata?.username || "").trim();
    return username ? `@${username}` : "Identity";
  }

  async function runSwitch(
    action: () => Promise<void>,
    targetLabel: string
  ): Promise<SwitchResult> {
    if (activity.isActivityLocked("pack-open")) {
      const error =
        "Switching is blocked while a pack-open transaction is in progress.";
      switchError.value = error;
      context.setError(error);
      return {
        ok: false,
        blocked: true,
        error,
      };
    }

    if (switchBusy.value && inFlight) {
      return inFlight;
    }

    const run = (async () => {
      switchBusy.value = true;
      switchMessage.value = "";
      switchWarning.value = "";
      switchError.value = "";

      try {
        if (context.dirty.value) {
          const persisted = await context.persistCurrentPixbookSnapshot();
          if (!persisted) {
            const error =
              "Could not persist the active pixbook locally. Export your pixbook before switching.";
            switchError.value = error;
            context.setError(error);
            return {
              ok: false,
              blocked: true,
              error,
            };
          }
        }

        await action();

        const message = `Switched to ${targetLabel}.`;
        switchMessage.value = message;
        context.setStatus(message);

        return {
          ok: true,
          message,
        };
      } catch (error: unknown) {
        const message = String((error as Error)?.message || "Switch failed.");
        switchError.value = message;
        context.setError(message);
        return {
          ok: false,
          error: message,
        };
      } finally {
        switchBusy.value = false;
        inFlight = null;
      }
    })();

    inFlight = run;
    return run;
  }

  async function switchIdentity(identityId: string) {
    const next = context.identities.value.find((entry) => entry.id === identityId);
    const label = next
      ? `${identityName(next)} · ${context.currentPixbookLabel.value}`
      : context.currentPixbookLabel.value;

    return runSwitch(async () => {
      await context.switchIdentityLocal(identityId);
    }, label);
  }

  async function switchPixbook(pixbookId: string) {
    const next = context.pixbooks.value.find((entry) => entry.id === pixbookId);
    const label = next
      ? `${context.currentIdentityLabel.value} · ${next.name}`
      : context.currentIdentityLabel.value;

    return runSwitch(async () => {
      await context.switchPixbookLocal(pixbookId);
    }, label);
  }

  function clearSwitchFeedback() {
    switchMessage.value = "";
    switchWarning.value = "";
    switchError.value = "";
  }

  return {
    switchBusy,
    switchMessage,
    switchWarning,
    switchError,
    isSwitchBlocked,
    switchIdentity,
    switchPixbook,
    clearSwitchFeedback,
  };
}

export function providePixpaxSwitchContext(
  options: CreatePixpaxSwitchContextOptions = {}
) {
  const switchContext = createPixpaxSwitchContext(options);
  provide(usePixpaxSwitchContextSymbol, switchContext);
  return switchContext;
}

export function usePixpaxSwitchContext() {
  const switchContext = inject<PixpaxSwitchContext>(
    usePixpaxSwitchContextSymbol
  );
  if (!switchContext) {
    throw new Error(
      "usePixpaxSwitchContext() called without providePixpaxSwitchContext()."
    );
  }
  return switchContext;
}
