import { computed, ref, watch } from "vue";
import { useRunCoreRuntime } from "@/modules/run/core";
import { useAppShellState } from "@/modules/ui/useAppShellState";

let singleton: ReturnType<typeof createAppShellIdentityModel> | null = null;

function createAppShellIdentityModel() {
  const runtime = useRunCoreRuntime();
  const shellState = useAppShellState();

  const identityTab = ref("create");
  const createIdentityLabel = ref("");
  const importMnemonicLabel = ref("");
  const importMnemonicValue = ref("");
  const importJsonLabel = ref("");
  const importJsonValue = ref("");
  const createdMnemonic = ref<string | null>(null);
  const createdIdentityLabel = ref<string | null>(null);
  const identityMessage = ref<string | null>(null);
  const identityError = ref<string | null>(null);
  const exportedIdentity = ref<string | null>(null);

  const identityTabs = computed(() => {
    const recoverTab = {
      value: "recover",
      label: "Recover",
      disabled: runtime.identity.bootstrapCandidates.value.length === 0,
    };

    return runtime.identity.ready.value
      ? [
          recoverTab,
          { value: "create", label: "Create" },
          { value: "mnemonic", label: "Import Mnemonic" },
          { value: "json", label: "Import JSON" },
        ]
      : [
          recoverTab,
          { value: "mnemonic", label: "Import Mnemonic" },
          { value: "json", label: "Import JSON" },
          { value: "create", label: "Create" },
        ];
  });

  const activeIdentity = computed(() => runtime.identity.activeIdentity.value);
  const activeIdentityLabel = computed(
    () => activeIdentity.value?.profile.label ?? "Inspect only",
  );
  const showIdentityBanner = computed(
    () =>
      Boolean(
        createdMnemonic.value ||
          identityError.value ||
          runtime.identity.error.value ||
          identityMessage.value,
      ),
  );
  const validBootstrapCandidates = computed(() =>
    runtime.identity.bootstrapCandidates.value.filter((candidate) => candidate.valid),
  );
  const suggestedBootstrapCandidate = computed(() => validBootstrapCandidates.value[0] ?? null);
  const matchingBootstrapCandidate = computed(() => {
    const keyId = activeIdentity.value?.identity.keyId;
    return (
      runtime.identity.bootstrapCandidates.value.find(
        (candidate) => candidate.valid && candidate.keyId === keyId,
      ) ?? null
    );
  });
  const connectIntro = computed(() => {
    if (shellState.connectIntent.value === "create" && !activeIdentity.value) {
      return {
        title: "Create or load an identity",
        body: "You need an identity before you can create a ledger or save task changes.",
      };
    }

    if (shellState.connectIntent.value === "recover") {
      return {
        title: "Recover an identity",
        body: "Use a saved provider identity or import one you already trust.",
      };
    }

    if (activeIdentity.value) {
      return {
        title: "Manage identity",
        body: "Switch identities, export the active signer, or recover another one when you need it.",
      };
    }

    return {
      title: "Create or load identity",
      body: "Inspect first if you want. Come here when you need to create, import, or recover an identity.",
    };
  });

  watch(
    () => [shellState.activePanel.value, shellState.connectIntent.value] as const,
    ([panel, intent]) => {
      if (panel !== "connect") {
        return;
      }

      if (intent === "recover" && runtime.identity.bootstrapCandidates.value.length > 0) {
        identityTab.value = "recover";
        return;
      }

      if (intent === "mnemonic") {
        identityTab.value = "mnemonic";
        return;
      }

      if (intent === "json") {
        identityTab.value = "json";
        return;
      }

      if (intent === "create") {
        identityTab.value = "create";
      }
    },
    { immediate: true },
  );

  function clearIdentityMessages() {
    identityError.value = null;
    identityMessage.value = null;
  }

  function acknowledgeMnemonic() {
    createdMnemonic.value = null;
    createdIdentityLabel.value = null;
  }

  async function handleCreateIdentity() {
    clearIdentityMessages();

    try {
      const result = await runtime.identity.createMnemonicIdentity({
        label: createIdentityLabel.value.trim() || undefined,
      });
      createdMnemonic.value = result.mnemonic;
      createdIdentityLabel.value = result.record.profile.label;
      createIdentityLabel.value = "";
      identityMessage.value = `Created ${result.record.profile.label}.`;
      shellState.clearConnectIntent();
    } catch (error) {
      identityError.value = error instanceof Error ? error.message : String(error);
    }
  }

  async function handleImportMnemonic() {
    clearIdentityMessages();

    try {
      const record = await runtime.identity.importMnemonic({
        label: importMnemonicLabel.value.trim() || undefined,
        mnemonic: importMnemonicValue.value.trim(),
      });
      importMnemonicLabel.value = "";
      importMnemonicValue.value = "";
      identityMessage.value = `Imported ${record.profile.label}.`;
      shellState.clearConnectIntent();
    } catch (error) {
      identityError.value = error instanceof Error ? error.message : String(error);
    }
  }

  async function handleImportJson() {
    clearIdentityMessages();

    try {
      const record = await runtime.identity.importSerializedIdentity({
        label: importJsonLabel.value.trim() || undefined,
        serializedIdentity: importJsonValue.value.trim(),
      });
      importJsonLabel.value = "";
      importJsonValue.value = "";
      identityMessage.value = `Imported ${record.profile.label}.`;
      shellState.clearConnectIntent();
    } catch (error) {
      identityError.value = error instanceof Error ? error.message : String(error);
    }
  }

  async function handleAdoptCandidate(candidateId: string) {
    clearIdentityMessages();

    try {
      const record = await runtime.identity.adoptBootstrapCandidate(candidateId);
      identityMessage.value = `Recovered ${record.profile.label}.`;
      shellState.clearConnectIntent();
    } catch (error) {
      identityError.value = error instanceof Error ? error.message : String(error);
    }
  }

  async function handleSwitchIdentity(identityId: string) {
    clearIdentityMessages();

    try {
      const record = await runtime.identity.switchIdentity(identityId);
      exportedIdentity.value = null;
      identityMessage.value = `Switched to ${record.profile.label}.`;
    } catch (error) {
      identityError.value = error instanceof Error ? error.message : String(error);
    }
  }

  async function handleRemoveIdentity(identityId: string) {
    clearIdentityMessages();

    try {
      await runtime.identity.removeIdentity(identityId);
      exportedIdentity.value = null;
      identityMessage.value = "Identity removed.";
    } catch (error) {
      identityError.value = error instanceof Error ? error.message : String(error);
    }
  }

  async function handleExportActiveIdentity() {
    clearIdentityMessages();

    try {
      exportedIdentity.value = await runtime.identity.exportActiveIdentity();
      identityMessage.value = "Active identity exported.";
    } catch (error) {
      identityError.value = error instanceof Error ? error.message : String(error);
    }
  }

  async function refreshRecoveryOptions() {
    clearIdentityMessages();

    try {
      await runtime.identity.refreshBootstrapCandidates();
      identityMessage.value = "Recovery options refreshed.";
    } catch (error) {
      identityError.value = error instanceof Error ? error.message : String(error);
    }
  }

  return {
    runtime,
    shellState,
    identityTab,
    createIdentityLabel,
    importMnemonicLabel,
    importMnemonicValue,
    importJsonLabel,
    importJsonValue,
    createdMnemonic,
    createdIdentityLabel,
    identityMessage,
    identityError,
    exportedIdentity,
    identityTabs,
    activeIdentity,
    activeIdentityLabel,
    showIdentityBanner,
    suggestedBootstrapCandidate,
    matchingBootstrapCandidate,
    connectIntro,
    acknowledgeMnemonic,
    handleCreateIdentity,
    handleImportMnemonic,
    handleImportJson,
    handleAdoptCandidate,
    handleSwitchIdentity,
    handleRemoveIdentity,
    handleExportActiveIdentity,
    refreshRecoveryOptions,
  };
}

export function useAppShellIdentityModel() {
  if (!singleton) {
    singleton = createAppShellIdentityModel();
  }

  return singleton;
}
