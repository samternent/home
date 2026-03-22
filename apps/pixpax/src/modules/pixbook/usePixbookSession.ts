import { computed, ref, shallowRef } from "vue";
import type { ConcordApp } from "@ternent/concord";
import type {
  PixbookClaimVerificationState,
  PixbookReplayState,
  PixpaxCollectionCatalog,
  PixpaxPackIssuance,
  PixpaxSignedArtifact,
  PixpaxTransferAcceptance,
  PixpaxTransferOffer,
} from "@ternent/pixpax-core";
import { appConfig } from "@/app/config/app.config";
import { canonicalizeClaimantIdentity, createInitialPixbookReplayState } from "@ternent/pixpax-core";
import { useIdentitySession } from "@/modules/identity";

type LedgerContainer = Awaited<ReturnType<ConcordApp["exportLedger"]>>;

const catalogRegistry: PixpaxCollectionCatalog[] = [];
const appRef = shallowRef<ConcordApp | null>(null);
const activeKeyIdRef = ref("");
const readyRef = ref(false);
const loadingRef = ref(false);
const errorRef = ref<string | null>(null);
const replayRef = ref<PixbookReplayState>(createInitialPixbookReplayState());
let initPromise: Promise<ConcordApp> | null = null;
let runtimePromise: Promise<{
  createConcordApp: typeof import("@ternent/concord").createConcordApp;
  createPixbookPlugin: typeof import("@ternent/pixpax-concord").createPixbookPlugin;
}> | null = null;
let verificationPromise: Promise<
  typeof import("@ternent/pixpax-issuer").verifyPackIssuanceProof
> | null = null;
let transferRuntimePromise: Promise<{
  signTransferOffer: typeof import("@ternent/pixpax-issuer").signTransferOffer;
  verifyTransferProof: typeof import("@ternent/pixpax-issuer").verifyTransferProof;
  signTransferAcceptance: typeof import("@ternent/pixpax-issuer").signTransferAcceptance;
  verifyTransferAcceptanceProof: typeof import("@ternent/pixpax-issuer").verifyTransferAcceptanceProof;
}> | null = null;

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function toPlainJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function createStorageKey(keyId: string) {
  return `${appConfig.appId}/pixbook-ledger/${keyId}`;
}

async function clearPersistedLedger(keyId: string) {
  const storageKey = createStorageKey(keyId);
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(storageKey);
  }
  await idbDelete(storageKey);
}

async function loadPixbookRuntime() {
  if (!runtimePromise) {
    runtimePromise = Promise.all([
      import("@ternent/concord"),
      import("@ternent/pixpax-concord"),
    ]).then(([concord, pixpaxConcord]) => ({
      createConcordApp: concord.createConcordApp,
      createPixbookPlugin: pixpaxConcord.createPixbookPlugin,
    }));
  }
  return runtimePromise;
}

async function loadPackVerification() {
  if (!verificationPromise) {
    verificationPromise = import("@ternent/pixpax-issuer").then(
      (module) => module.verifyPackIssuanceProof,
    );
  }
  return await verificationPromise;
}

async function loadTransferRuntime() {
  if (!transferRuntimePromise) {
    transferRuntimePromise = import("@ternent/pixpax-issuer").then((module) => ({
      signTransferOffer: module.signTransferOffer,
      verifyTransferProof: module.verifyTransferProof,
      signTransferAcceptance: module.signTransferAcceptance,
      verifyTransferAcceptanceProof: module.verifyTransferAcceptanceProof,
    }));
  }
  return await transferRuntimePromise;
}

function createIndexedDbName() {
  return `${appConfig.appId}-pixbook`;
}

function openPixbookDb() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = window.indexedDB.open(createIndexedDbName(), 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("ledgers")) {
        db.createObjectStore("ledgers");
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function idbGet<T>(key: string): Promise<T | null> {
  const db = await openPixbookDb();
  return await new Promise((resolve, reject) => {
    const tx = db.transaction("ledgers", "readonly");
    const store = tx.objectStore("ledgers");
    const request = store.get(key);
    request.onsuccess = () => resolve((request.result as T) ?? null);
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}

async function idbSet<T>(key: string, value: T): Promise<void> {
  const db = await openPixbookDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction("ledgers", "readwrite");
    const store = tx.objectStore("ledgers");
    const request = store.put(value as never, key);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}

async function idbDelete(key: string): Promise<void> {
  const db = await openPixbookDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction("ledgers", "readwrite");
    const store = tx.objectStore("ledgers");
    const request = store.delete(key);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}

function createBrowserLedgerStorage(keyId: string) {
  const storageKey = createStorageKey(keyId);
  const legacyStorageKey = storageKey;

  return {
    name: "browser-indexeddb",
    async load() {
      if (typeof window === "undefined") {
        return null;
      }
      try {
        const indexed = await idbGet<{
          container: unknown;
          staged: unknown[];
        }>(storageKey);
        if (indexed) {
          return indexed;
        }
      } catch {
        // Fall through to legacy migration path.
      }
      const raw = window.localStorage.getItem(legacyStorageKey);
      if (!raw) {
        return null;
      }
      try {
        const parsed = JSON.parse(raw) as {
          container: unknown;
          staged: unknown[];
        };
        await idbSet(storageKey, parsed);
        window.localStorage.removeItem(legacyStorageKey);
        return parsed;
      } catch {
        return null;
      }
    },
    async save(snapshot: unknown) {
      if (typeof window === "undefined") {
        return;
      }
      await idbSet(storageKey, snapshot);
      window.localStorage.removeItem(legacyStorageKey);
    },
    async clear() {
      if (typeof window === "undefined") {
        return;
      }
      await idbDelete(storageKey);
      window.localStorage.removeItem(legacyStorageKey);
    },
  };
}

function createTransferId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `transfer-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

function syncReplayState(app: ConcordApp | null) {
  replayRef.value = app
    ? clone(app.getReplayState<PixbookReplayState>("pixbook"))
    : createInitialPixbookReplayState();
}

function findClaimEntryIdByPackId(packId: string) {
  const normalizedPackId = String(packId || "").trim();
  if (!normalizedPackId) {
    return "";
  }

  const match = Object.values(replayRef.value.claimedPacksByEntryId).find(
    (claim) => claim.artifact.payload.packId === normalizedPackId,
  );
  return match?.claimEntryId || "";
}

async function destroyCurrentApp() {
  if (!appRef.value) {
    readyRef.value = false;
    syncReplayState(null);
    return;
  }

  await appRef.value.destroy();
  appRef.value = null;
  activeKeyIdRef.value = "";
  readyRef.value = false;
  syncReplayState(null);
}

async function ensurePixbookApp() {
  const { identity } = useIdentitySession();
  const currentIdentity = identity.value?.serializedIdentity;
  if (!currentIdentity) {
    throw new Error("A local identity is required.");
  }
  if (typeof window === "undefined") {
    throw new Error("Pixbook session is only available in the browser.");
  }

  if (appRef.value && activeKeyIdRef.value === currentIdentity.keyId) {
    return appRef.value;
  }

  if (!initPromise) {
    initPromise = (async () => {
      loadingRef.value = true;
      errorRef.value = null;
      await destroyCurrentApp();
      const runtime = await loadPixbookRuntime();

      const app = await runtime.createConcordApp({
        identity: currentIdentity,
        storage: createBrowserLedgerStorage(currentIdentity.keyId),
        plugins: [
          runtime.createPixbookPlugin({
            catalogs: catalogRegistry,
            getCatalogs: () => catalogRegistry,
          }),
        ],
      });
      await app.load();
      app.subscribe(() => {
        syncReplayState(app);
      });

      appRef.value = app;
      activeKeyIdRef.value = currentIdentity.keyId;
      readyRef.value = true;
      syncReplayState(app);
      return app;
    })()
      .catch((error: unknown) => {
        errorRef.value =
          error instanceof Error ? error.message : "Failed to initialize Pixbook.";
        throw error;
      })
      .finally(() => {
        loadingRef.value = false;
        initPromise = null;
      });
  }

  return initPromise;
}

export function usePixbookSession() {
  const registerCatalogs = async (catalogs: PixpaxCollectionCatalog[]) => {
    if (catalogs.length === 0) {
      return;
    }

    const nextByKey = new Map<string, PixpaxCollectionCatalog>();
    for (const catalog of catalogRegistry) {
      nextByKey.set(`${catalog.collectionId}::${catalog.collectionVersion}`, catalog);
    }
    for (const catalog of catalogs) {
      nextByKey.set(`${catalog.collectionId}::${catalog.collectionVersion}`, catalog);
    }

    catalogRegistry.splice(0, catalogRegistry.length, ...nextByKey.values());
    if (appRef.value) {
      await appRef.value.recompute();
      syncReplayState(appRef.value);
    }
  };

  const claimIssuedPack = async (input: {
    artifact: PixpaxSignedArtifact<PixpaxPackIssuance>;
    claimedAt?: string;
    verification?: PixbookClaimVerificationState | null;
  }) => {
    const app = await ensurePixbookApp();
    const runtime = await loadPixbookRuntime();
    const artifact = toPlainJson(input.artifact);
    const verificationState = input.verification
      ? toPlainJson(input.verification)
      : null;
    const existingClaimEntryId = findClaimEntryIdByPackId(artifact.payload.packId);
    if (existingClaimEntryId) {
      return existingClaimEntryId;
    }
    const verifyPackIssuanceProof = await loadPackVerification();
    const proofVerification = await verifyPackIssuanceProof({
      artifact,
    });
    if (!proofVerification.ok) {
      throw new Error(proofVerification.errors.join(", "));
    }

    const result = await app.command("pixbook.claim-pack", {
      artifact,
      claimedAt: input.claimedAt,
      verification:
        verificationState || {
          proofValidLocal: true,
          policyConfirmed: null,
          verifiedAt: new Date().toISOString(),
          source: "local-proof",
          reason: null,
        },
    });
    await app.commit({
      metadata: {
        message: `Claim pack ${artifact.payload.packId}`,
      },
    });
    syncReplayState(app);
    return result.entryIds[0];
  };

  const recordPackOpened = async (input: {
    claimEntryId: string;
    packId: string;
    openedAt?: string;
  }) => {
    const app = await ensurePixbookApp();
    if (replayRef.value.openedPacksByClaimEntryId[input.claimEntryId]) {
      return;
    }
    await app.command("pixbook.record-pack-opened", input);
    await app.commit({
      metadata: {
        message: `Open pack ${input.packId}`,
      },
    });
    syncReplayState(app);
  };

  const claimAndOpenIssuedPack = async (input: {
    artifact: PixpaxSignedArtifact<PixpaxPackIssuance>;
    claimedAt?: string;
    openedAt?: string;
    verification?: PixbookClaimVerificationState | null;
  }) => {
    const claimEntryId = await claimIssuedPack(input);
    await recordPackOpened({
      claimEntryId,
      packId: input.artifact.payload.packId,
      openedAt: input.openedAt,
    });
    return claimEntryId;
  };

  const createTransferOffer = async (input: {
    cardInstanceId: string;
    recipientPublicKey: string;
  }) => {
    await ensurePixbookApp();
    const { identity } = useIdentitySession();
    const currentIdentity = identity.value?.serializedIdentity;
    if (!currentIdentity) {
      throw new Error("A local identity is required.");
    }

    const cardInstance = replayRef.value.ownedCardInstancesById[String(input.cardInstanceId || "").trim()];
    if (!cardInstance) {
      throw new Error("Card instance is not owned in this Pixbook.");
    }

    const transferRuntime = await loadTransferRuntime();
    const offeredAt = new Date().toISOString();
    const offer: PixpaxTransferOffer = {
      version: "1",
      type: "pixpax-transfer-offer",
      proofScheme: "seal",
      transferId: createTransferId(),
      offeredAt,
      collectionId: cardInstance.collectionId,
      collectionVersion: cardInstance.collectionVersion,
      cardInstanceId: cardInstance.cardInstanceId,
      cardId: cardInstance.cardId,
      sourceClaimEntryId: cardInstance.claimEntryId,
      sourcePackId: cardInstance.packId,
      seriesId: cardInstance.seriesId ?? null,
      slotIndex: cardInstance.slotIndex,
      role: cardInstance.role ?? null,
      fromClaimant: await canonicalizeClaimantIdentity({
        type: "identity-public-key",
        value: currentIdentity.publicKey,
      }),
      toClaimant: await canonicalizeClaimantIdentity({
        type: "identity-public-key",
        value: String(input.recipientPublicKey || "").trim(),
      }),
    };

    return await transferRuntime.signTransferOffer({
      identity: currentIdentity,
      offer,
      createdAt: offeredAt,
    });
  };

  const recordTransfer = async (input: {
    offerArtifact: PixpaxSignedArtifact<PixpaxTransferOffer>;
    acceptanceArtifact: PixpaxSignedArtifact<PixpaxTransferAcceptance>;
  }) => {
    const app = await ensurePixbookApp();
    const transferRuntime = await loadTransferRuntime();
    const offerVerification = await transferRuntime.verifyTransferProof({
      artifact: input.offerArtifact,
    });
    if (!offerVerification.ok) {
      throw new Error(offerVerification.errors.join(", "));
    }
    const acceptanceVerification = await transferRuntime.verifyTransferAcceptanceProof({
      artifact: input.acceptanceArtifact,
    });
    if (!acceptanceVerification.ok) {
      throw new Error(acceptanceVerification.errors.join(", "));
    }

    const result = await app.command("pixbook.record-transfer", input);
    await app.commit({
      metadata: {
        message: `Record transfer ${input.offerArtifact.payload.transferId}`,
      },
    });
    syncReplayState(app);
    return result.entryIds[0];
  };

  const acceptTransferOffer = async (input: {
    offerArtifact: PixpaxSignedArtifact<PixpaxTransferOffer>;
  }) => {
    const { identity } = useIdentitySession();
    const currentIdentity = identity.value?.serializedIdentity;
    if (!currentIdentity) {
      throw new Error("A local identity is required.");
    }

    const transferRuntime = await loadTransferRuntime();
    const offerVerification = await transferRuntime.verifyTransferProof({
      artifact: input.offerArtifact,
    });
    if (!offerVerification.ok) {
      throw new Error(offerVerification.errors.join(", "));
    }
    const offer = input.offerArtifact.payload;
    if (String(currentIdentity.publicKey || "").trim() !== String(offer.toClaimant.normalizedValue || "").trim()) {
      throw new Error("This offer is addressed to a different identity.");
    }

    const acceptedAt = new Date().toISOString();
    const acceptance: PixpaxTransferAcceptance = {
      version: "1",
      type: "pixpax-transfer-acceptance",
      proofScheme: "seal",
      transferId: offer.transferId,
      acceptedAt,
      offerProofHash: input.offerArtifact.proof.subject.hash,
      collectionId: offer.collectionId,
      collectionVersion: offer.collectionVersion,
      cardInstanceId: offer.cardInstanceId,
      cardId: offer.cardId,
      sourceClaimEntryId: offer.sourceClaimEntryId,
      sourcePackId: offer.sourcePackId,
      seriesId: offer.seriesId ?? null,
      slotIndex: offer.slotIndex,
      role: offer.role ?? null,
      fromClaimant: offer.fromClaimant,
      toClaimant: offer.toClaimant,
    };
    const acceptanceArtifact = await transferRuntime.signTransferAcceptance({
      identity: currentIdentity,
      acceptance,
      createdAt: acceptedAt,
    });

    await recordTransfer({
      offerArtifact: input.offerArtifact,
      acceptanceArtifact,
    });

    return acceptanceArtifact;
  };

  const exportLedger = async () => {
    const app = await ensurePixbookApp();
    return await app.exportLedger();
  };

  const getLedgerHead = async () => {
    const container = await exportLedger();
    return String(container?.head || "").trim();
  };

  const importLedger = async (container: LedgerContainer) => {
    const app = await ensurePixbookApp();
    await app.importLedger(container);
    syncReplayState(app);
  };

  const resetPixbook = async () => {
    const currentKeyId = activeKeyIdRef.value;
    await destroyCurrentApp();
    if (currentKeyId) {
      await clearPersistedLedger(currentKeyId);
    }
    await ensurePixbookApp();
  };

  return {
    ready: computed(() => readyRef.value),
    loading: computed(() => loadingRef.value),
    error: computed(() => errorRef.value),
    replayState: computed(() => replayRef.value),
    ensureReady: ensurePixbookApp,
    registerCatalogs,
    claimIssuedPack,
    recordPackOpened,
    claimAndOpenIssuedPack,
    createTransferOffer,
    acceptTransferOffer,
    recordTransfer,
    exportLedger,
    getLedgerHead,
    importLedger,
    resetPixbook,
  };
}
