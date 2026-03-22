import { computed } from "vue";
import { useLocalStorage } from "@vueuse/core";
import { appConfig } from "@/app/config/app.config";
import { normalizeRedeemCode } from "@/modules/redeem/code-format";

export type PendingRedeemIntent = {
  id: string;
  code: string;
  createdAt: string;
  lastAttemptAt: string | null;
  lastError: string | null;
};

const storageKey = `${appConfig.appId}/pending-redeems`;
const state = useLocalStorage<PendingRedeemIntent[]>(storageKey, []);

export function usePendingRedeems() {
  const pendingRedeems = computed(() =>
    [...(state.value || [])].sort((left, right) =>
      String(right.createdAt).localeCompare(String(left.createdAt)),
    ),
  );

  const addPendingRedeem = (rawCode: string) => {
    const code = normalizeRedeemCode(rawCode);
    if (!code) {
      throw new Error("Redeem code is required.");
    }

    const existing = state.value.find((item) => item.code === code);
    if (existing) {
      return existing;
    }

    const next: PendingRedeemIntent = {
      id: `pending-${code}`,
      code,
      createdAt: new Date().toISOString(),
      lastAttemptAt: null,
      lastError: null,
    };
    state.value = [next, ...(state.value || [])];
    return next;
  };

  const markPendingAttempt = (rawCode: string, error: string | null = null) => {
    const code = normalizeRedeemCode(rawCode);
    state.value = (state.value || []).map((item) =>
      item.code === code
        ? {
            ...item,
            lastAttemptAt: new Date().toISOString(),
            lastError: error,
          }
        : item,
    );
  };

  const clearPendingRedeem = (rawCode: string) => {
    const code = normalizeRedeemCode(rawCode);
    state.value = (state.value || []).filter((item) => item.code !== code);
  };

  const clearAllPendingRedeems = () => {
    state.value = [];
  };

  return {
    pendingRedeems,
    addPendingRedeem,
    markPendingAttempt,
    clearPendingRedeem,
    clearAllPendingRedeems,
  };
}
