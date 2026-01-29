import { computed, shallowRef, watch } from "vue";
import { useLedger } from "../ledger/useLedger";
import { useIdentity } from "../identity/useIdentity";
import { useEncryption } from "../encryption/useEncryption";
import { generate as generateEncryptionKeys } from "ternent-encrypt";
import { verify, importPublicKeyFromPem } from "ternent-identity";
import { formatIdentityKey } from "ternent-utils";
import { getEntrySigningPayload } from "@ternent/concord-protocol";
import { getDefaultSession } from "@inrupt/solid-client-authn-browser";
import {
  createContainerAt,
  getPodUrlAll,
  overwriteFile,
} from "@inrupt/solid-client";
import { canonicalizeAgeRecipient, deriveEpochId, deriveSignerKeyId } from "./epochUtils";
import { useEpochKeys, type EpochKeyRecord } from "./useEpochKeys";
import {
  validateEpochLedger,
  type EpochValidationResult,
  type EpochValidationError,
} from "./epochValidator";

export type EpochRecord = {
  type: "epoch";
  epochId: string;
  prevEpochId: string | null;
  createdAt: string;
  encryptionPublicKey: string;
  signerKeyId: string;
  encryptionKeyId: string;
};

export type EpochStatus = {
  record: EpochRecord;
  isValid: boolean;
  warnings: string[];
};

type PendingKeypair = {
  privateKey: string;
  publicKey: string;
};

async function ensureContainer(url: string, fetcher: typeof fetch) {
  try {
    await createContainerAt(url, { fetch: fetcher });
  } catch (err: any) {
    const status = err?.statusCode ?? err?.status ?? "";
    if (status === 409 || String(err ?? "").includes("409")) return;
    throw err;
  }
}

export function useEpochs() {
  const { ledger, api, bridge } = useLedger();
  const { publicKeyPEM, privateKey } = useIdentity();
  const {
    publicKey: encryptionPublicKey,
    privateKey: encryptionPrivateKey,
  } = useEncryption();
  const epochKeys = useEpochKeys();
  const session = getDefaultSession();

  const epochs = shallowRef<EpochStatus[]>([]);
  const isLoading = shallowRef(false);
  const lastError = shallowRef("");
  const lastPersistWarning = shallowRef("");
  const lastWarning = shallowRef("");
  const validation = shallowRef<EpochValidationResult | null>(null);

  const hasSolidSession = computed(() => session.info.isLoggedIn === true);
  const canSign = computed(() => !!privateKey.value && !!publicKeyPEM.value);

  async function listEpochs(): Promise<EpochStatus[]> {
    if (!ledger.value) return [];

    const entries = Object.values(ledger.value.entries || {}) as Array<{
      kind?: string;
      payload?: EpochRecord;
      signature?: string | null;
      author?: string | null;
    }>;

    const epochEntries = entries.filter(
      (entry) =>
        entry.kind === "epochs" && entry.payload?.type === "epoch"
    );

    const epochIds = new Set(
      epochEntries.map((entry) => entry.payload?.epochId).filter(Boolean)
    );

    const results = await Promise.all(
      epochEntries.map(async (entry) => {
        const record = entry.payload as EpochRecord;
        const warnings: string[] = [];
        let isValid = true;

        if (!entry.signature || !entry.author) {
          isValid = false;
          warnings.push("Entry signature missing.");
        }

        if (record.epochId !== record.encryptionKeyId) {
          isValid = false;
          warnings.push("EpochId does not match encryptionKeyId.");
        }

        if (!record.encryptionPublicKey) {
          isValid = false;
          warnings.push("Missing encryption public key.");
        } else {
          const expectedEpochId = await deriveEpochId({
            signerKeyId: record.signerKeyId,
            encryptionPublicKey: record.encryptionPublicKey,
            prevEpochId: record.prevEpochId ?? null,
            createdAt: record.createdAt,
          });
          if (expectedEpochId !== record.epochId) {
            isValid = false;
            warnings.push("EpochId mismatch.");
          }
        }

        const authorKeyString = entry.author ? entry.author : "";
        const expectedSignerKeyId = await deriveSignerKeyId(authorKeyString);
        if (record.signerKeyId !== expectedSignerKeyId) {
          isValid = false;
          warnings.push("Signer key id mismatch.");
        }

        if (record.prevEpochId && !epochIds.has(record.prevEpochId)) {
          warnings.push("Previous epoch missing from ledger.");
        }

        if (entry.signature && entry.author) {
          try {
            const authorKey = await importPublicKeyFromPem(
              formatIdentityKey(entry.author)
            );
            const payload = getEntrySigningPayload(entry as any);
            const ok = await verify(entry.signature, payload, authorKey);
            if (!ok) {
              isValid = false;
              warnings.push("Entry signature invalid.");
            }
          } catch (err) {
            isValid = false;
            warnings.push(`Entry signature error: ${String(err)}`);
          }
        }

        if (record.createdAt !== entry.timestamp) {
          warnings.push("CreatedAt does not match entry timestamp.");
        }

        return {
          record,
          isValid,
          warnings,
        };
      })
    );

    const validEpochs = results.filter((epoch) => epoch.isValid);
    const children = new Map<string, string[]>();
    for (const epoch of validEpochs) {
      const prev = epoch.record.prevEpochId;
      if (!prev) continue;
      const list = children.get(prev) ?? [];
      list.push(epoch.record.epochId);
      children.set(prev, list);
    }
    const headCandidates = validEpochs.filter(
      (epoch) => !children.has(epoch.record.epochId)
    );
    if (headCandidates.length > 1) {
      for (const epoch of headCandidates) {
        epoch.warnings.push("Epoch fork detected.");
      }
    }

    return results.sort((a, b) =>
      a.record.createdAt.localeCompare(b.record.createdAt)
    );
  }

  async function refresh() {
    isLoading.value = true;
    lastError.value = "";
    try {
      epochs.value = await listEpochs();
      validation.value = ledger.value
        ? await validateEpochLedger(ledger.value as any)
        : null;
    } catch (err) {
      lastError.value = String(err);
    } finally {
      isLoading.value = false;
    }
  }

  watch(
    () => ledger.value?.head,
    () => {
      refresh();
    },
    { immediate: true }
  );

  const currentEpoch = computed(() => {
    if (validation.value && !validation.value.ok) return null;
    return getCurrentEpoch(epochs.value);
  });

  const legacyEpochPlacement = computed(
    () => validation.value?.legacyEpochPlacement ?? false
  );

  const activeEpochResult = computed(() => {
    if (!validation.value) {
      return {
        ok: false,
        errors: [
          {
            code: "EPOCH_VALIDATION_PENDING",
            message: "Epoch validation pending.",
          } satisfies EpochValidationError,
        ],
      };
    }
    if (!validation.value.ok) {
      const legacyEpoch = getCurrentEpoch(epochs.value);
      return {
        ok: false,
        errors: validation.value.errors,
        legacyEpochPlacement: validation.value.legacyEpochPlacement,
        epoch: legacyEpoch ?? undefined,
      };
    }
    const active = getCurrentEpoch(epochs.value);
    if (!active) {
      return {
        ok: false,
        errors: [
          {
            code: "EPOCH_ACTIVE_MISSING",
            message: "No active epoch found.",
          } satisfies EpochValidationError,
        ],
      };
    }
    return {
      ok: true,
      epoch: active,
      legacyEpochPlacement: validation.value.legacyEpochPlacement,
    };
  });

  function getActiveEpoch() {
    return activeEpochResult.value;
  }

  function getCurrentEpoch(list: EpochStatus[]) {
    const validEpochs = list.filter((epoch) => epoch.isValid);
    if (!validEpochs.length) return null;

    const children = new Map<string, string[]>();
    for (const epoch of validEpochs) {
      const prev = epoch.record.prevEpochId;
      if (!prev) continue;
      const list = children.get(prev) ?? [];
      list.push(epoch.record.epochId);
      children.set(prev, list);
    }

    const heads = validEpochs.filter(
      (epoch) => !children.has(epoch.record.epochId)
    );
    if (!heads.length) return null;
    if (heads.length === 1) return heads[0];

    return heads
      .slice()
      .sort((a, b) =>
        a.record.createdAt.localeCompare(b.record.createdAt)
      )
      .at(-1) ?? null;
  }

  async function generatePendingKeypair(): Promise<PendingKeypair> {
    const [nextPrivate, nextPublic] = await generateEncryptionKeys();
    return {
      privateKey: nextPrivate,
      publicKey: nextPublic,
    };
  }

  async function persistKeyToSolid(record: EpochKeyRecord) {
    if (!session.info.isLoggedIn || !session.info.webId) {
      throw new Error("Solid session not available.");
    }
    const pods = await getPodUrlAll(session.info.webId, {
      fetch: session.fetch,
    });
    const pod = pods[0];
    if (!pod) {
      throw new Error("No Solid pod found.");
    }
    const containerUrl = new URL("concord/wallet/private/", pod).toString();
    await ensureContainer(containerUrl, session.fetch);

    const fileUrl = new URL(
      `epoch-${record.encryptionKeyId}.json`,
      containerUrl
    ).toString();

    await overwriteFile(
      fileUrl,
      new Blob([JSON.stringify(record, null, 2)], {
        type: "application/json",
      }),
      {
        contentType: "application/json",
        fetch: session.fetch,
      }
    );

    return fileUrl;
  }

  async function commitEpoch(params: {
    keypair: PendingKeypair;
    allowUnpersisted?: boolean;
  }) {
    if (bridge.flags.value.pendingCount > 0) {
      throw new Error("Commit or discard pending changes before rotating epoch.");
    }
    if (!privateKey.value || !publicKeyPEM.value) {
      throw new Error("Signing key is missing.");
    }
    if (!bridge.flags.value.authed) {
      throw new Error("Ledger not authenticated.");
    }

    lastPersistWarning.value = "";
    lastWarning.value = "";

    const epochList = await listEpochs();
    const resolvedCurrent = getCurrentEpoch(epochList);
    if (!resolvedCurrent) {
      throw new Error("Active epoch missing or ledger invalid.");
    }
    const prevEpochId = resolvedCurrent.record.epochId;
    const createdAt = new Date().toISOString();
    const signerKeyId = await deriveSignerKeyId(publicKeyPEM.value);

    const encryptionPublicKeyValue = canonicalizeAgeRecipient(
      params.keypair.publicKey
    );
    const epochId = await deriveEpochId({
      signerKeyId,
      encryptionPublicKey: encryptionPublicKeyValue,
      prevEpochId,
      createdAt,
    });
    const body = {
      type: "epoch" as const,
      epochId,
      prevEpochId,
      createdAt,
      encryptionPublicKey: encryptionPublicKeyValue,
      encryptionKeyId: epochId,
      signerKeyId,
    };

    const record: EpochRecord = {
      ...body,
    };

    const keyRecord: EpochKeyRecord = {
      encryptionKeyId: record.encryptionKeyId,
      createdAt: record.createdAt,
      label: `Epoch ${epochs.value.length + 1}`,
      privateKey: params.keypair.privateKey,
    };

    epochKeys.storeKey(keyRecord);

    if (session.info.isLoggedIn) {
      try {
        await persistKeyToSolid(keyRecord);
      } catch (err) {
        if (!params.allowUnpersisted) {
          throw err;
        }
        lastPersistWarning.value = String(err);
      }
    } else if (!params.allowUnpersisted) {
      throw new Error("Solid session required to persist private key.");
    } else {
      lastPersistWarning.value = "Solid session not available for key backup.";
    }

    encryptionPublicKey.value = params.keypair.publicKey;
    encryptionPrivateKey.value = params.keypair.privateKey;

    await api.addAndStage({
      kind: "epochs",
      payload: record,
      timestamp: createdAt,
    });

    await api.commit("rotate epoch", {
      message: "rotate epoch",
    });

    const headCommit = ledger.value?.commits?.[ledger.value?.head ?? ""];
    if (headCommit && headCommit.entries.length !== 1) {
      lastWarning.value =
        "Rotation commit should include only the epoch entry.";
    } else if (headCommit) {
      const entryId = headCommit.entries[0];
      const entry = ledger.value?.entries?.[entryId];
      if (entry?.kind !== "epochs") {
        lastWarning.value =
          "Rotation commit should include only the epoch entry.";
      }
    }

    await refresh();

    return record;
  }

  return {
    epochs,
    currentEpoch,
    isLoading,
    lastError,
    lastPersistWarning,
    lastWarning,
    validation,
    legacyEpochPlacement,
    activeEpochResult,
    getActiveEpoch,
    hasSolidSession,
    canSign,
    refresh,
    listEpochs,
    getCurrentEpoch,
    generatePendingKeypair,
    commitEpoch,
  };
}
