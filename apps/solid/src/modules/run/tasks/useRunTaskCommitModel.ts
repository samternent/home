import { computed, ref, watch } from "vue";
import { useRunTaskActions } from "@/modules/run/services";
import { useAppShellState } from "@/modules/ui/useAppShellState";
import { useRunTasksRuntime } from "./useRunTasksRuntime";

export type RunTaskCommitBusyState = "commit" | "discard" | null;

let singleton: ReturnType<typeof createRunTaskCommitModel> | null = null;

function createRunTaskCommitModel() {
  const runtime = useRunTasksRuntime();
  const actions = useRunTaskActions();
  const shellState = useAppShellState();
  const messageState = ref("");
  const errorState = ref<string | null>(null);
  const busyState = ref<RunTaskCommitBusyState>(null);

  const stagedCount = computed(() => runtime.state.value?.stagedCount ?? 0);

  watch(stagedCount, (nextCount) => {
    if (nextCount === 0) {
      errorState.value = null;
    }
  });

  watch(
    () => runtime.activeLedgerId.value,
    () => {
      messageState.value = "";
      errorState.value = null;
    },
  );

  function clearMessage() {
    messageState.value = "";
  }

  function handleFailure(error: string) {
    if (error.includes("Add identity") || error.includes("read-only")) {
      shellState.openConnect("create");
      return;
    }

    errorState.value = error;
  }

  async function commitStaged() {
    errorState.value = null;

    if (stagedCount.value === 0) {
      errorState.value = "No staged changes to commit.";
      return { ok: false as const, error: "No staged changes to commit." };
    }

    busyState.value = "commit";
    try {
      const result = await actions.commitStaged(messageState.value);
      if (!result.ok) {
        handleFailure(result.error);
        return result;
      }

      clearMessage();
      return result;
    } finally {
      busyState.value = null;
    }
  }

  async function discardStaged() {
    errorState.value = null;

    if (stagedCount.value === 0) {
      return {
        ok: true as const,
        value: {
          stagedCount: 0,
        },
      };
    }

    busyState.value = "discard";
    try {
      const result = await actions.discardStaged();
      if (!result.ok) {
        handleFailure(result.error);
        return result;
      }

      clearMessage();
      return result;
    } finally {
      busyState.value = null;
    }
  }

  return {
    mode: computed(() => runtime.mode.value),
    stagedCount,
    hasStagedChanges: computed(() => stagedCount.value > 0),
    commitMessage: computed({
      get: () => messageState.value,
      set: (next: string) => {
        messageState.value = next;
      },
    }),
    busy: computed(() => busyState.value),
    error: computed(() => errorState.value),
    canCommit: computed(
      () =>
        runtime.mode.value === "interactive"
        && stagedCount.value > 0
        && messageState.value.trim().length > 0
        && busyState.value === null,
    ),
    commitStaged,
    discardStaged,
    clearMessage,
  };
}

export function useRunTaskCommitModel() {
  if (!singleton) {
    singleton = createRunTaskCommitModel();
  }

  return singleton;
}
