import {
  computed,
  inject,
  onMounted,
  provide,
  shallowRef,
  watch,
  type Ref,
} from "vue";
import { useLocalStorage } from "@vueuse/core";
import {
  createIdentity,
  exportPrivateKeyAsPem,
  exportPublicKeyAsPem,
} from "ternent-identity";
import { generate as generateEncryptionKeys } from "ternent-encrypt";
import { hashData, stripIdentityKey } from "ternent-utils";
import { useEncryption } from "../../encryption/useEncryption";
import { useIdentity } from "../../identity/useIdentity";
import { useLedger } from "../../ledger/useLedger";
import {
  type PrivateProfile,
  type PublicProfile,
  useProfile,
} from "../../profile/useProfile";

const usePixpaxContextStoreSymbol = Symbol("usePixpaxContextStore");

export type PixbookExport =
  | {
      format: "pixpax-pixbook";
      version: "1.0";
      kind: "public";
      profile: PublicProfile;
      ledger: any;
    }
  | {
      format: "pixpax-pixbook";
      version: "1.0";
      kind: "private";
      profile: PrivateProfile;
      ledger: any;
    };

export type PixpaxIdentityRecord = {
  id: string;
  label: string;
  fingerprint: string;
  profileId: string;
  publicKeyPEM: string;
  privateKeyPEM: string;
  encryptionPublicKey: string;
  encryptionPrivateKey: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type PixpaxPixbookRecord = {
  id: string;
  identityId: string;
  collectionId?: string;
  name: string;
  isDefault: boolean;
  snapshot: string;
  lastPersistHead: string;
  createdAt: string;
  updatedAt: string;
};

export type CandidateIdentity = {
  id: string;
  label: string;
  fingerprint: string;
  publicKeyPEM: string;
  privateKeyPEM: string;
  encryptionPublicKey: string;
  encryptionPrivateKey: string;
  createdAt: string;
};

export type PixpaxContextStore = ReturnType<typeof createPixpaxContextStore>;

const PIXBOOK_FORMAT = "pixpax-pixbook";
const PIXBOOK_VERSION = "1.0";

const CORE_LEDGER_KEY = "concord:ledger:core";
const TAMPER_LEDGER_KEY = "concord:ledger:tamper";
const TAMPER_ACTIVE_KEY = "concord:ledger:tampered";

const IDENTITIES_KEY = "pixpax/context/identities/v1";
const CURRENT_IDENTITY_KEY = "pixpax/context/currentIdentityId/v1";
const PIXBOOKS_KEY = "pixpax/context/pixbooks/v1";
const CURRENT_PIXBOOK_KEY = "pixpax/context/currentPixbookId/v1";
const CURRENT_COLLECTION_KEY = "pixpax/context/currentCollectionId/v1";
const DEFAULT_COLLECTION_ID = "primary";

function nowIso() {
  return new Date().toISOString();
}

function makeId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 11)}`;
}

function shortFingerprint(publicKeyPem: string) {
  const stripped = stripIdentityKey(String(publicKeyPem || "")).trim();
  if (!stripped) return "";
  if (stripped.length <= 12) return stripped;
  return `${stripped.slice(0, 6)}${stripped.slice(-6)}`;
}

function copyObject(input: unknown) {
  if (!input || typeof input !== "object") return {};
  return { ...(input as Record<string, unknown>) };
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function usernameFromMetadata(input: unknown) {
  if (!input || typeof input !== "object") return "";
  const username = (input as { username?: unknown }).username;
  return typeof username === "string" ? username.trim() : "";
}

function hasMetadata(input: unknown) {
  return Object.keys(copyObject(input)).length > 0;
}

function normalizeCollectionId(value: unknown) {
  const normalized = String(value || "").trim();
  return normalized || DEFAULT_COLLECTION_ID;
}

async function deriveProfileId(publicKeyPem: string) {
  return hashData({
    type: "concord-profile-id",
    v: 1,
    identityPublicKeyPem: publicKeyPem,
  });
}

function createPixpaxContextStore() {
  const { ledger, pending, api } = useLedger();
  const identity = useIdentity() as any;
  const encryption = useEncryption() as any;
  const profile = useProfile();

  const publicKeyPEM = identity.publicKeyPEM as Ref<string>;
  const privateKeyPEM = identity.privateKeyPEM as Ref<string>;
  const publicKey = identity.publicKey as Ref<CryptoKey | null>;
  const privateKey = identity.privateKey as Ref<CryptoKey | null>;
  const initIdentity = identity.init as () => Promise<void>;
  const impersonateIdentity = identity.impersonate as (
    profile: PrivateProfile
  ) => Promise<void>;

  const encryptionPublicKey = encryption.publicKey as Ref<string>;
  const encryptionPrivateKey = encryption.privateKey as Ref<string>;
  const impersonateEncryption = encryption.impersonate as (
    profile: PrivateProfile
  ) => Promise<void>;

  const pixbookReadOnly = useLocalStorage("pixpax/pixbook/readOnly", false);
  const viewedPixbookProfileJson = useLocalStorage(
    "pixpax/pixbook/viewProfileJson",
    ""
  );
  const publicLedgerSnapshot = useLocalStorage("pixpax/pixbook/publicLedger", "");
  const privateLedgerSnapshot = useLocalStorage("pixpax/pixbook/privateLedger", "");

  const identities = useLocalStorage<PixpaxIdentityRecord[]>(IDENTITIES_KEY, []);
  const currentIdentityId = useLocalStorage(CURRENT_IDENTITY_KEY, "");
  const pixbooks = useLocalStorage<PixpaxPixbookRecord[]>(PIXBOOKS_KEY, []);
  const currentPixbookId = useLocalStorage(CURRENT_PIXBOOK_KEY, "");
  const currentCollectionId = useLocalStorage(
    CURRENT_COLLECTION_KEY,
    DEFAULT_COLLECTION_ID
  );

  const creatingPixbook = shallowRef(false);
  const shouldAutoCreatePixbook = shallowRef(true);
  const storageChecked = shallowRef(false);

  const statusMessage = shallowRef("");
  const errorMessage = shallowRef("");

  const uploadError = shallowRef("");
  const uploadStatus = shallowRef("");

  const candidateIdentities = shallowRef<CandidateIdentity[]>([]);

  const viewedPixbookProfile = computed<PublicProfile | null>({
    get() {
      if (!viewedPixbookProfileJson.value) return null;
      try {
        return JSON.parse(viewedPixbookProfileJson.value) as PublicProfile;
      } catch {
        viewedPixbookProfileJson.value = "";
        return null;
      }
    },
    set(value) {
      viewedPixbookProfileJson.value = value ? JSON.stringify(value) : "";
    },
  });

  const profileUsername = computed(() => {
    const meta = profile.meta.value as { username?: string };
    return typeof meta.username === "string" ? meta.username : "";
  });

  const hasProfile = computed(() => Boolean(profileUsername.value));

  const viewingIdentityKey = computed(() => {
    return viewedPixbookProfile.value?.identity?.publicKey || "";
  });

  const viewingLabel = computed(() => {
    const meta = viewedPixbookProfile.value?.metadata as { username?: string };
    if (meta?.username) return `@${meta.username}`;
    const id = viewedPixbookProfile.value?.profileId || "";
    return id ? `Pixbook ${id.slice(0, 6)}` : "Pixbook";
  });

  const hasPublicView = computed(() => {
    return (
      pixbookReadOnly.value &&
      Boolean(viewedPixbookProfile.value) &&
      Boolean(publicLedgerSnapshot.value)
    );
  });

  const pixbookHead = computed(() => ledger.value?.head?.slice(0, 7) || "new");

  const activeIdentity = computed(() => {
    if (!currentIdentityId.value) return null;
    return (
      identities.value.find((entry) => entry.id === currentIdentityId.value) ||
      null
    );
  });

  const currentIdentityFingerprint = computed(
    () => shortFingerprint(publicKeyPEM.value) || "unknown"
  );

  const currentIdentityLabel = computed(() => {
    const username =
      String(profileUsername.value || "").trim() ||
      usernameFromMetadata(activeIdentity.value?.metadata);
    if (username) return `@${username}`;
    return "Identity";
  });

  const currentIdentityUsername = computed(() => {
    const fromProfile = String(profileUsername.value || "").trim();
    if (fromProfile) return fromProfile;
    return usernameFromMetadata(activeIdentity.value?.metadata);
  });

  const activeCollectionId = computed(() =>
    normalizeCollectionId(currentCollectionId.value)
  );

  const activeIdentityCollectionPixbooks = computed(() => {
    if (!currentIdentityId.value) return [];
    return pixbooks.value.filter(
      (entry) =>
        entry.identityId === currentIdentityId.value &&
        normalizeCollectionId(entry.collectionId) === activeCollectionId.value
    );
  });

  const activeIdentityPixbooks = computed(() => {
    const collectionBooks = activeIdentityCollectionPixbooks.value;
    if (collectionBooks.length === 0) return [];
    const currentMatch = collectionBooks.find(
      (entry) => entry.id === currentPixbookId.value
    );
    if (currentMatch) return [currentMatch];
    const defaultMatch = collectionBooks.find((entry) => entry.isDefault);
    return [defaultMatch || collectionBooks[0]];
  });

  const activePixbook = computed(() => {
    if (!currentPixbookId.value) return null;
    return (
      activeIdentityPixbooks.value.find(
        (entry) => entry.id === currentPixbookId.value
      ) || null
    );
  });

  const currentPixbookLabel = computed(() => {
    return activePixbook.value?.name || "My Pixbook";
  });

  const disabled = computed(
    () => !profile.ready.value || !profile.profileId.value
  );

  const dirty = computed(() => {
    if (pixbookReadOnly.value) return false;
    if ((pending.value || []).length > 0) return true;
    const head = String(ledger.value?.head || "").trim();
    const lastPersistHead = String(activePixbook.value?.lastPersistHead || "").trim();
    if (!head) return false;
    return head !== lastPersistHead;
  });

  function setStatus(message = "") {
    statusMessage.value = message;
  }

  function setError(message = "") {
    errorMessage.value = message;
  }

  async function reauthAndReplay() {
    if (!publicKey.value || !privateKey.value) return;
    await api.auth(privateKey.value, publicKey.value);
    await api.replay();
  }

  function toIdentityRecordId(publicPem: string, profileId: string) {
    const normalizedProfileId = String(profileId || "").trim();
    if (normalizedProfileId) {
      return `identity_${normalizedProfileId}`;
    }
    const fingerprint = shortFingerprint(publicPem) || "identity";
    return `identity_${fingerprint}`;
  }

  function updateIdentityRecords(next: PixpaxIdentityRecord[]) {
    identities.value = [...next];
  }

  function updatePixbooks(next: PixpaxPixbookRecord[]) {
    pixbooks.value = [...next];
  }

  function upsertIdentityRecord(next: PixpaxIdentityRecord) {
    const normalizedPublicKey = String(next.publicKeyPEM || "").trim();

    const matching = identities.value.filter((entry) => {
      if (entry.id === next.id) return true;
      return String(entry.publicKeyPEM || "").trim() === normalizedPublicKey;
    });

    const obsoleteIds = matching
      .map((entry) => String(entry.id || "").trim())
      .filter((id) => id && id !== next.id);

    let merged = { ...next };
    for (const entry of matching) {
      const entryCreatedAt = String(entry.createdAt || "").trim();
      if (entryCreatedAt) {
        const mergedCreatedAt = String(merged.createdAt || "").trim();
        if (!mergedCreatedAt || entryCreatedAt < mergedCreatedAt) {
          merged.createdAt = entryCreatedAt;
        }
      }

      if (!hasMetadata(merged.metadata) && hasMetadata(entry.metadata)) {
        merged.metadata = copyObject(entry.metadata);
      }

      if (
        (!String(merged.label || "").trim() ||
          String(merged.label || "").trim() === "Identity") &&
        String(entry.label || "").trim()
      ) {
        merged.label = String(entry.label || "").trim();
      }
    }

    updateIdentityRecords([
      ...identities.value.filter(
        (entry) => entry.id !== merged.id && !obsoleteIds.includes(entry.id)
      ),
      merged,
    ]);

    if (obsoleteIds.length > 0) {
      updatePixbooks(
        pixbooks.value.map((entry) =>
          obsoleteIds.includes(String(entry.identityId || "").trim())
            ? { ...entry, identityId: merged.id, updatedAt: nowIso() }
            : entry
        )
      );
      if (obsoleteIds.includes(String(currentIdentityId.value || "").trim())) {
        currentIdentityId.value = merged.id;
      }
    }

    return merged;
  }

  async function upsertRecoveredIdentityMaterial(input: {
    label?: string;
    profileId?: string;
    publicKeyPEM: string;
    privateKeyPEM: string;
    encryptionPublicKey: string;
    encryptionPrivateKey: string;
    metadata?: Record<string, unknown>;
  }) {
    const publicKeyPEM = String(input.publicKeyPEM || "").trim();
    const privateKeyPEM = String(input.privateKeyPEM || "").trim();
    const encryptionPublicKey = String(input.encryptionPublicKey || "").trim();
    const encryptionPrivateKey = String(input.encryptionPrivateKey || "").trim();
    if (!publicKeyPEM || !privateKeyPEM || !encryptionPublicKey || !encryptionPrivateKey) {
      throw new Error("Recovered identity payload is missing required key material.");
    }

    const profileId =
      String(input.profileId || "").trim() || (await deriveProfileId(publicKeyPEM));
    const id = toIdentityRecordId(publicKeyPEM, profileId);
    const existing = identities.value.find((entry) => entry.id === id) || null;
    const now = nowIso();
    const metadata = hasMetadata(input.metadata)
      ? copyObject(input.metadata)
      : copyObject(existing?.metadata);
    const username = usernameFromMetadata(metadata);
    const label =
      String(input.label || existing?.label || "").trim() ||
      (username ? `@${username}` : "Identity");

    const next: PixpaxIdentityRecord = {
      id,
      label,
      fingerprint: shortFingerprint(publicKeyPEM),
      profileId,
      publicKeyPEM,
      privateKeyPEM,
      encryptionPublicKey,
      encryptionPrivateKey,
      metadata,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };

    const merged = upsertIdentityRecord(next);
    ensurePixbookRecord(merged.id, {
      collectionId: activeCollectionId.value,
    });
    return merged;
  }

  async function registerCurrentIdentity(label?: string) {
    const publicPem = String(publicKeyPEM.value || "").trim();
    const privatePem = String(privateKeyPEM.value || "").trim();
    const encryptPub = String(encryptionPublicKey.value || "").trim();
    const encryptPriv = String(encryptionPrivateKey.value || "").trim();
    if (!publicPem || !privatePem || !encryptPub || !encryptPriv) {
      return null;
    }

    const profileId = await deriveProfileId(publicPem);
    if (String(profile.profileId.value || "").trim() !== profileId) {
      profile.setProfileId(profileId);
    }

    const id = toIdentityRecordId(publicPem, profileId);
    const now = nowIso();
    const existing = identities.value.find((entry) => entry.id === id);
    const nextMetadata = hasMetadata(profile.meta.value)
      ? copyObject(profile.meta.value)
      : copyObject(existing?.metadata);

    if (!hasMetadata(profile.meta.value) && hasMetadata(existing?.metadata)) {
      profile.replaceProfileMeta(nextMetadata);
    }

    const username = usernameFromMetadata(nextMetadata);

    const next: PixpaxIdentityRecord = {
      id,
      label: String(label || existing?.label || (username ? `@${username}` : "Identity")),
      fingerprint: shortFingerprint(publicPem),
      profileId,
      publicKeyPEM: publicPem,
      privateKeyPEM: privatePem,
      encryptionPublicKey: encryptPub,
      encryptionPrivateKey: encryptPriv,
      metadata: nextMetadata,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };

    const merged = upsertIdentityRecord(next);
    currentIdentityId.value = merged.id;
    return merged;
  }

  function ensurePixbookRecord(
    identityId: string,
    options: { forceNew?: boolean; collectionId?: string } = {}
  ) {
    const collectionId = normalizeCollectionId(options.collectionId);
    const existing = pixbooks.value.filter(
      (entry) =>
        entry.identityId === identityId &&
        normalizeCollectionId(entry.collectionId) === collectionId
    );
    if (existing.length > 0 && !options.forceNew) {
      return existing.find((entry) => entry.isDefault) || existing[0];
    }

    const now = nowIso();
    const id = makeId("pixbook");
    const record: PixpaxPixbookRecord = {
      id,
      identityId,
      collectionId,
      name: "My Pixbook",
      isDefault: true,
      snapshot: "",
      lastPersistHead: "",
      createdAt: now,
      updatedAt: now,
    };

    updatePixbooks([
      ...pixbooks.value.map((entry) =>
        entry.identityId === identityId &&
        normalizeCollectionId(entry.collectionId) === collectionId
          ? { ...entry, isDefault: false }
          : entry
      ),
      record,
    ]);

    return record;
  }

  async function ensureCurrentPixbookRecord() {
    if (!currentIdentityId.value) return null;
    const match = activeIdentityCollectionPixbooks.value.find(
      (entry) => entry.id === currentPixbookId.value
    );
    if (match) return match;

    const fallback =
      activeIdentityCollectionPixbooks.value.find((entry) => entry.isDefault) ||
      activeIdentityCollectionPixbooks.value[0] ||
      ensurePixbookRecord(currentIdentityId.value, {
        collectionId: activeCollectionId.value,
      });

    if (fallback) currentPixbookId.value = fallback.id;
    return fallback;
  }

  async function ensurePixbook() {
    if (creatingPixbook.value || ledger.value) return;
    if (!publicKey.value || !privateKey.value) return;

    pixbookReadOnly.value = false;
    viewedPixbookProfile.value = null;
    publicLedgerSnapshot.value = "";
    privateLedgerSnapshot.value = "";

    creatingPixbook.value = true;
    try {
      await api.auth(privateKey.value, publicKey.value);
      await api.create();
    } finally {
      creatingPixbook.value = false;
    }
  }

  async function persistCurrentPixbookSnapshot() {
    if (pixbookReadOnly.value) return true;
    if (!currentIdentityId.value) return false;
    if (!currentPixbookId.value) return false;
    if (!ledger.value) return true;

    try {
      const snapshot = JSON.stringify(ledger.value);
      privateLedgerSnapshot.value = snapshot;

      updatePixbooks(
        pixbooks.value.map((entry) => {
          if (entry.id !== currentPixbookId.value) return entry;
          return {
            ...entry,
            snapshot,
            lastPersistHead: String(ledger.value?.head || "").trim(),
            updatedAt: nowIso(),
          };
        })
      );

      return true;
    } catch {
      setError("Failed to persist your current pixbook locally.");
      return false;
    }
  }

  async function applyPrivateProfile(
    privateProfile: PrivateProfile,
    nextLedger: any | null,
    successMessage?: string
  ) {
    pixbookReadOnly.value = false;
    viewedPixbookProfile.value = null;
    publicLedgerSnapshot.value = "";

    await impersonateIdentity(privateProfile);
    await impersonateEncryption(privateProfile);

    profile.replaceProfileMeta(copyObject(privateProfile.metadata));
    const canonicalProfileId = await deriveProfileId(
      String(privateProfile?.identity?.publicKey || "").trim()
    );
    profile.setProfileId(canonicalProfileId);

    if (nextLedger) {
      await api.load(nextLedger, [], true, true);
    } else {
      await api.loadFromStorage();
      await ensurePixbook();
    }
    await reauthAndReplay();

    const registered = await registerCurrentIdentity();
    if (registered) {
      ensurePixbookRecord(registered.id, {
        collectionId: activeCollectionId.value,
      });
      await ensureCurrentPixbookRecord();
    }

    if (successMessage) setStatus(successMessage);
  }

  async function applyPublicPixbook(publicProfile: PublicProfile, nextLedger: any) {
    pixbookReadOnly.value = true;
    viewedPixbookProfile.value = publicProfile;
    publicLedgerSnapshot.value = JSON.stringify(nextLedger);
    await api.load(nextLedger, [], true, true);
    await api.replay();
    setStatus("Public pixbook loaded (read-only).");
  }

  async function importPrivatePixbookAsIdentity(
    privateProfile: PrivateProfile,
    nextLedger: any
  ) {
    const importedPublicPem = stripIdentityKey(
      String(privateProfile?.identity?.publicKey || "").trim()
    );
    const importedPrivatePem = String(
      privateProfile?.identity?.privateKey?.payload || ""
    ).trim();
    const importedEncryptionPublicKey = String(
      privateProfile?.encryption?.publicKey || ""
    ).trim();
    const importedEncryptionPrivateKey = String(
      privateProfile?.encryption?.privateKey?.payload || ""
    ).trim();
    if (
      !importedPublicPem ||
      !importedPrivatePem ||
      !importedEncryptionPublicKey ||
      !importedEncryptionPrivateKey
    ) {
      throw new Error("Imported private pixbook profile is missing identity keys.");
    }

    const profileId = await deriveProfileId(importedPublicPem);
    const identityId = toIdentityRecordId(importedPublicPem, profileId);
    const existingIdentity = identities.value.find((entry) => entry.id === identityId) || null;
    const metadata = copyObject(privateProfile.metadata);
    const username = usernameFromMetadata(metadata);
    const now = nowIso();

    const importedIdentity: PixpaxIdentityRecord = {
      id: identityId,
      label:
        String(existingIdentity?.label || "").trim() ||
        (username ? `@${username}` : "Imported Identity"),
      fingerprint: shortFingerprint(importedPublicPem),
      profileId,
      publicKeyPEM: importedPublicPem,
      privateKeyPEM: importedPrivatePem,
      encryptionPublicKey: importedEncryptionPublicKey,
      encryptionPrivateKey: importedEncryptionPrivateKey,
      metadata,
      createdAt: existingIdentity?.createdAt || now,
      updatedAt: now,
    };

    const mergedIdentity = upsertIdentityRecord(importedIdentity);

    const snapshot = JSON.stringify(nextLedger);
    const importedHead = String(nextLedger?.head || "").trim();
    const existingPixbook =
      pixbooks.value.find(
        (entry) =>
          entry.identityId === mergedIdentity.id &&
          normalizeCollectionId(entry.collectionId) === activeCollectionId.value
      ) || null;

    const importedPixbook: PixpaxPixbookRecord = {
      id: existingPixbook?.id || makeId("pixbook"),
      identityId: mergedIdentity.id,
      collectionId: activeCollectionId.value,
      name: existingPixbook?.name || "Imported Pixbook",
      isDefault: true,
      snapshot,
      lastPersistHead: importedHead,
      createdAt: existingPixbook?.createdAt || now,
      updatedAt: now,
    };

    const withoutCurrentCollectionBooks = pixbooks.value.filter(
      (entry) =>
        !(
          entry.identityId === mergedIdentity.id &&
          normalizeCollectionId(entry.collectionId) === activeCollectionId.value
        )
    );
    updatePixbooks([...withoutCurrentCollectionBooks, importedPixbook]);
  }

  async function loadPixbookRecord(record: PixpaxPixbookRecord) {
    pixbookReadOnly.value = false;
    viewedPixbookProfile.value = null;
    publicLedgerSnapshot.value = "";

    if (record.snapshot) {
      try {
        await api.load(JSON.parse(record.snapshot), [], true, true);
      } catch {
        if (privateKey.value && publicKey.value) {
          await api.auth(privateKey.value, publicKey.value);
        }
        await api.create();
      }
    } else {
      if (privateKey.value && publicKey.value) {
        await api.auth(privateKey.value, publicKey.value);
      }
      await api.create();
    }

    await reauthAndReplay();
  }

  async function loadPersistedLedgerSnapshot(snapshot: unknown) {
    if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) {
      throw new Error("Persisted ledger snapshot is invalid.");
    }

    shouldAutoCreatePixbook.value = false;
    try {
      pixbookReadOnly.value = false;
      viewedPixbookProfile.value = null;
      publicLedgerSnapshot.value = "";

      if (privateKey.value && publicKey.value) {
        await api.auth(privateKey.value, publicKey.value);
      }

      await api.load(cloneJson(snapshot), [], true, true);
      await reauthAndReplay();
      await ensureCurrentPixbookRecord();
      await persistCurrentPixbookSnapshot();
    } finally {
      shouldAutoCreatePixbook.value = true;
    }
  }

  async function switchIdentityLocal(identityId: string) {
    const next = identities.value.find((entry) => entry.id === identityId);
    if (!next) {
      throw new Error("Identity not found on this device.");
    }
    const canonicalProfileId = await deriveProfileId(next.publicKeyPEM);
    const canonicalIdentityId = toIdentityRecordId(
      next.publicKeyPEM,
      canonicalProfileId
    );

    const privateProfile: PrivateProfile = {
      format: "concord-profile-private",
      version: "1.0",
      profileId: canonicalProfileId,
      identity: {
        type: "ecdsa-p256",
        publicKey: next.publicKeyPEM,
        privateKey: {
          format: "pkcs8-pem",
          encrypted: false,
          payload: next.privateKeyPEM,
        },
      },
      encryption: {
        type: "age",
        publicKey: next.encryptionPublicKey,
        privateKey: {
          format: "age-secret",
          encrypted: false,
          payload: next.encryptionPrivateKey,
        },
      },
      metadata: copyObject(next.metadata),
    };

    await applyPrivateProfile(privateProfile, null);
    currentIdentityId.value = canonicalIdentityId;

    const defaultBook =
      pixbooks.value.find(
        (entry) =>
          entry.identityId === canonicalIdentityId &&
          normalizeCollectionId(entry.collectionId) === activeCollectionId.value &&
          entry.isDefault
      ) ||
      ensurePixbookRecord(canonicalIdentityId, {
        collectionId: activeCollectionId.value,
      });

    if (defaultBook) {
      await switchPixbookLocal(defaultBook.id);
    }
  }

  async function switchPixbookLocal(pixbookId: string) {
    const next = pixbooks.value.find((entry) => entry.id === pixbookId);
    if (!next) {
      throw new Error("Pixbook not found on this device.");
    }
    if (normalizeCollectionId(next.collectionId) !== activeCollectionId.value) {
      throw new Error("Pixbook is not part of the active collection.");
    }
    const identityOwned = identities.value.some(
      (entry) => entry.id === next.identityId
    );
    if (!identityOwned) {
      throw new Error("Pixbook identity is not owned on this device.");
    }
    if (next.identityId !== currentIdentityId.value) {
      throw new Error("Pixbook does not belong to the active identity.");
    }

    currentPixbookId.value = next.id;
    await loadPixbookRecord(next);
  }

  async function createIdentityCandidate() {
    const keys = await createIdentity();
    const publicPem = stripIdentityKey(await exportPublicKeyAsPem(keys.publicKey));
    const privatePem = await exportPrivateKeyAsPem(keys.privateKey);
    const [nextPrivateEncryption, nextPublicEncryption] = await generateEncryptionKeys();

    const candidate: CandidateIdentity = {
      id: makeId("identity_candidate"),
      label: "Identity",
      fingerprint: shortFingerprint(publicPem),
      publicKeyPEM: publicPem,
      privateKeyPEM: privatePem,
      encryptionPublicKey: nextPublicEncryption,
      encryptionPrivateKey: nextPrivateEncryption,
      createdAt: nowIso(),
    };

    candidateIdentities.value = [candidate];
    return candidate;
  }

  async function confirmIdentityCandidate(candidateId: string) {
    const candidate = candidateIdentities.value.find((entry) => entry.id === candidateId);
    if (!candidate) {
      throw new Error("Identity candidate not found.");
    }

    const profileId = await deriveProfileId(candidate.publicKeyPEM);
    const id = toIdentityRecordId(candidate.publicKeyPEM, profileId);
    const existing = identities.value.find((entry) => entry.id === id);
    const now = nowIso();

    const next: PixpaxIdentityRecord = {
      id,
      label: existing?.label || "Identity",
      fingerprint: shortFingerprint(candidate.publicKeyPEM),
      profileId,
      publicKeyPEM: candidate.publicKeyPEM,
      privateKeyPEM: candidate.privateKeyPEM,
      encryptionPublicKey: candidate.encryptionPublicKey,
      encryptionPrivateKey: candidate.encryptionPrivateKey,
      metadata: copyObject(existing?.metadata),
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };

    const mergedIdentity = upsertIdentityRecord(next);

    const hasCollectionBook = pixbooks.value.some(
      (entry) =>
        entry.identityId === mergedIdentity.id &&
        normalizeCollectionId(entry.collectionId) === activeCollectionId.value
    );
    if (!hasCollectionBook) {
      const record: PixpaxPixbookRecord = {
        id: makeId("pixbook"),
        identityId: mergedIdentity.id,
        collectionId: activeCollectionId.value,
        name: "My Pixbook",
        isDefault: true,
        snapshot: "",
        lastPersistHead: "",
        createdAt: now,
        updatedAt: now,
      };
      updatePixbooks([...pixbooks.value, record]);
    }

    discardIdentityCandidate(candidateId);
    setStatus("New identity saved. Switch identity when you are ready.");
    return mergedIdentity;
  }

  function discardIdentityCandidate(candidateId: string) {
    candidateIdentities.value = candidateIdentities.value.filter(
      (entry) => entry.id !== candidateId
    );
  }

  function renameIdentityLabel(identityId: string, label: string) {
    const normalized = String(label || "").trim();
    if (!normalized) return;
    updateIdentityRecords(
      identities.value.map((entry) =>
        entry.id === identityId
          ? { ...entry, label: normalized, updatedAt: nowIso() }
          : entry
      )
    );
  }

  function setIdentityUsername(identityId: string, username: string) {
    const normalized = String(username || "").trim();
    updateIdentityRecords(
      identities.value.map((entry) => {
        if (entry.id !== identityId) return entry;
        return {
          ...entry,
          label: normalized ? `@${normalized}` : "Identity",
          metadata: {
            ...copyObject(entry.metadata),
            username: normalized,
          },
          updatedAt: nowIso(),
        };
      })
    );

    if (identityId === currentIdentityId.value) {
      profile.setProfileMeta({ username: normalized });
    }
  }

  async function removeIdentityLocal(identityId: string) {
    if (identities.value.length <= 1) {
      throw new Error("At least one local identity must remain on this device.");
    }

    const removingCurrent = identityId === currentIdentityId.value;

    updateIdentityRecords(identities.value.filter((entry) => entry.id !== identityId));
    updatePixbooks(pixbooks.value.filter((entry) => entry.identityId !== identityId));

    if (removingCurrent) {
      const fallback = identities.value[0] || null;
      if (fallback) {
        await switchIdentityLocal(fallback.id);
      }
    }
  }

  async function createPixbook(name: string) {
    const identityId = currentIdentityId.value;
    if (!identityId) throw new Error("No active identity.");
    if (activeIdentityCollectionPixbooks.value.length > 0) {
      throw new Error(
        "Only one pixbook is supported per identity for the active collection."
      );
    }

    const normalized = String(name || "").trim() || "My Pixbook";
    const now = nowIso();

    const hasDefault = pixbooks.value.some(
      (entry) =>
        entry.identityId === identityId &&
        normalizeCollectionId(entry.collectionId) === activeCollectionId.value &&
        entry.isDefault
    );

    const next: PixpaxPixbookRecord = {
      id: makeId("pixbook"),
      identityId,
      collectionId: activeCollectionId.value,
      name: normalized,
      isDefault: !hasDefault,
      snapshot: "",
      lastPersistHead: "",
      createdAt: now,
      updatedAt: now,
    };

    updatePixbooks([...pixbooks.value, next]);
    return next;
  }

  function renamePixbook(pixbookId: string, name: string) {
    const normalized = String(name || "").trim();
    if (!normalized) return;

    updatePixbooks(
      pixbooks.value.map((entry) =>
        entry.id === pixbookId
          ? { ...entry, name: normalized, updatedAt: nowIso() }
          : entry
      )
    );
  }

  function setDefaultPixbook(pixbookId: string) {
    const target = pixbooks.value.find((entry) => entry.id === pixbookId);
    if (!target) return;
    const collectionId = normalizeCollectionId(target.collectionId);

    updatePixbooks(
      pixbooks.value.map((entry) => {
        if (
          entry.identityId !== target.identityId ||
          normalizeCollectionId(entry.collectionId) !== collectionId
        ) {
          return entry;
        }
        return {
          ...entry,
          isDefault: entry.id === pixbookId,
          updatedAt: nowIso(),
        };
      })
    );
  }

  async function removePixbookLocal(pixbookId: string) {
    const target = pixbooks.value.find((entry) => entry.id === pixbookId);
    if (!target) return;

    const identityBooks = pixbooks.value.filter(
      (entry) =>
        entry.identityId === target.identityId &&
        normalizeCollectionId(entry.collectionId) ===
          normalizeCollectionId(target.collectionId)
    );
    if (identityBooks.length <= 1) {
      throw new Error(
        "This identity has one pixbook for the active collection and cannot remove it."
      );
    }

    const wasCurrent = target.id === currentPixbookId.value;

    updatePixbooks(pixbooks.value.filter((entry) => entry.id !== pixbookId));

    if (wasCurrent) {
      const fallback =
        pixbooks.value.find(
          (entry) =>
            entry.identityId === target.identityId &&
            normalizeCollectionId(entry.collectionId) ===
              normalizeCollectionId(target.collectionId) &&
            entry.isDefault
        ) ||
        pixbooks.value.find(
          (entry) =>
            entry.identityId === target.identityId &&
            normalizeCollectionId(entry.collectionId) ===
              normalizeCollectionId(target.collectionId)
        );
      if (fallback) {
        await switchPixbookLocal(fallback.id);
      }
    }
  }

  function buildPixbook(kind: "public" | "private") {
    if (!ledger.value) {
      throw new Error("Pixbook ledger not available.");
    }

    if (kind === "public") {
      return {
        format: PIXBOOK_FORMAT,
        version: PIXBOOK_VERSION,
        kind,
        profile: profile.getPublicProfile(),
        ledger: ledger.value,
      };
    }

    return {
      format: PIXBOOK_FORMAT,
      version: PIXBOOK_VERSION,
      kind,
      profile: profile.getPrivateProfile(),
      ledger: ledger.value,
    };
  }

  function downloadText(filename: string, content: string, mime = "application/json") {
    const blob = new Blob([content], { type: `${mime};charset=utf-8` });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.rel = "noopener";

    document.body.appendChild(a);
    a.click();
    a.remove();

    setTimeout(() => URL.revokeObjectURL(url), 250);
  }

  async function downloadPixbook(kind: "public" | "private") {
    uploadError.value = "";
    uploadStatus.value = "";

    if (kind === "private" && pixbookReadOnly.value) {
      uploadError.value = "Private pixbook export requires the signing keys.";
      return;
    }

    await profile.ensureProfileId();
    if (!ledger.value) {
      await ensurePixbook();
    }

    if (!ledger.value) {
      uploadError.value = "Pixbook ledger not available yet.";
      return;
    }

    const pixbook = buildPixbook(kind);
    const filename = `pixbook.${kind}.${pixbookHead.value}.json`;
    downloadText(filename, JSON.stringify(pixbook, null, 2));
    uploadStatus.value = `${kind === "private" ? "Private" : "Public"} pixbook exported.`;
  }

  async function importPixbookFile(
    file: File,
    options: { confirm?: boolean } = {}
  ) {
    uploadError.value = "";
    uploadStatus.value = "";

    let parsed: PixbookExport;
    try {
      parsed = JSON.parse(await file.text()) as PixbookExport;
    } catch {
      uploadError.value = "Invalid pixbook JSON.";
      return false;
    }

    if (parsed?.format !== PIXBOOK_FORMAT || parsed?.version !== PIXBOOK_VERSION) {
      uploadError.value = "Not a pixbook export.";
      return false;
    }

    const shouldConfirm = options.confirm !== false;
    if (shouldConfirm) {
      const confirmed = window.confirm(
        "Import this pixbook as a new local identity and pixbook for the current collection?"
      );
      if (!confirmed) return false;
    }

    shouldAutoCreatePixbook.value = false;
    try {
      if (parsed.kind === "public") {
        await applyPublicPixbook(parsed.profile as PublicProfile, parsed.ledger);
        uploadStatus.value = "Public pixbook loaded (read-only).";
        return true;
      }

      const privateProfile = parsed.profile as PrivateProfile;
      if (privateProfile?.format !== "concord-profile-private") {
        uploadError.value = "Missing private profile in pixbook.";
        return false;
      }
      if (!parsed.ledger || typeof parsed.ledger !== "object") {
        uploadError.value = "Private pixbook is missing ledger data.";
        return false;
      }

      await importPrivatePixbookAsIdentity(privateProfile, parsed.ledger);
      const importedUsername = usernameFromMetadata(privateProfile.metadata);
      const label = importedUsername ? `@${importedUsername}` : "imported identity";
      setStatus(`Private pixbook imported under ${label}. Switch identity when ready.`);
      uploadStatus.value =
        "Private pixbook imported as a separate local identity. Your current identity was unchanged.";
      return true;
    } finally {
      shouldAutoCreatePixbook.value = true;
    }
  }

  async function createNewPixbook(confirm = true) {
    if (confirm) {
      const confirmed = window.confirm(
        "Start a new pixbook? This will replace your current pixbook."
      );
      if (!confirmed) return;
    }

    pixbookReadOnly.value = false;
    viewedPixbookProfile.value = null;
    publicLedgerSnapshot.value = "";
    privateLedgerSnapshot.value = "";

    shouldAutoCreatePixbook.value = false;
    if (privateKey.value && publicKey.value) {
      await api.auth(privateKey.value, publicKey.value);
    }
    await api.create();
    shouldAutoCreatePixbook.value = true;

    await persistCurrentPixbookSnapshot();
    setStatus("Started a new pixbook.");
  }

  async function returnToMyPixbook() {
    shouldAutoCreatePixbook.value = false;

    pixbookReadOnly.value = false;
    viewedPixbookProfile.value = null;
    publicLedgerSnapshot.value = "";

    if (privateLedgerSnapshot.value) {
      try {
        await api.load(JSON.parse(privateLedgerSnapshot.value), [], true, true);
      } catch {
        privateLedgerSnapshot.value = "";
        await api.loadFromStorage();
      }
    } else {
      await api.loadFromStorage();
    }

    shouldAutoCreatePixbook.value = true;
    await ensurePixbook();
    setStatus("Returned to your local pixbook.");
  }

  async function eraseLocalPixbook() {
    const confirmed = window.confirm(
      "Erase this pixbook from this browser? This cannot be undone."
    );
    if (!confirmed) return;

    pixbookReadOnly.value = false;
    viewedPixbookProfile.value = null;
    publicLedgerSnapshot.value = "";
    privateLedgerSnapshot.value = "";

    await api.destroy();
    window.localStorage.removeItem(CORE_LEDGER_KEY);
    window.localStorage.removeItem(TAMPER_LEDGER_KEY);
    window.localStorage.removeItem(TAMPER_ACTIVE_KEY);

    await ensurePixbook();
    await persistCurrentPixbookSnapshot();
    setStatus("Local pixbook erased from this browser.");
  }

  function setProfileHandle(handle: string) {
    const normalized = String(handle || "").trim();
    profile.setProfileMeta({ username: normalized });
    void registerCurrentIdentity();
  }

  onMounted(async () => {
    if (pixbookReadOnly.value && (!viewedPixbookProfile.value || !publicLedgerSnapshot.value)) {
      pixbookReadOnly.value = false;
      viewedPixbookProfile.value = null;
    }

    if (hasPublicView.value) {
      try {
        await api.load(JSON.parse(publicLedgerSnapshot.value), [], true, true);
        await api.replay();
      } catch {
        publicLedgerSnapshot.value = "";
        await api.loadFromStorage();
      }
    } else {
      await api.loadFromStorage();
    }

    storageChecked.value = true;

    if (!publicKeyPEM.value || !privateKeyPEM.value) {
      await identity.createIdentity();
      await initIdentity();
    }

    await profile.ensureProfileId();
    const registered = await registerCurrentIdentity();
    if (registered) {
      ensurePixbookRecord(registered.id, {
        collectionId: activeCollectionId.value,
      });
      await ensureCurrentPixbookRecord();
    }
  });

  watch(
    () => [ledger.value, publicKey.value, privateKey.value, storageChecked.value] as const,
    async ([currentLedger, pubKey, privKey, checked]) => {
      if (!checked) return;
      if (hasPublicView.value) return;
      if (!shouldAutoCreatePixbook.value) return;
      if (currentLedger) return;
      if (!pubKey || !privKey) return;
      await ensurePixbook();
    },
    { immediate: true }
  );

  watch(
    () => [ledger.value, pixbookReadOnly.value] as const,
    ([currentLedger, readOnly]) => {
      if (!currentLedger || readOnly) return;
      try {
        privateLedgerSnapshot.value = JSON.stringify(currentLedger);
      } catch {
        privateLedgerSnapshot.value = "";
      }
    },
    { immediate: true }
  );

  watch(
    () => [publicKeyPEM.value, profile.profileId.value] as const,
    async ([nextPem, nextProfileId]) => {
      if (!nextPem || !nextProfileId) return;
      await registerCurrentIdentity();
      await ensureCurrentPixbookRecord();
    }
  );

  watch(
    () => normalizeCollectionId(currentCollectionId.value),
    async () => {
      if (pixbookReadOnly.value) return;
      const next = await ensureCurrentPixbookRecord();
      if (!next) return;
      await switchPixbookLocal(next.id);
    }
  );

  watch(
    () => profile.meta.value,
    async () => {
      if (!publicKeyPEM.value || !profile.profileId.value) return;
      await registerCurrentIdentity();
    },
    { deep: true }
  );

  return {
    profile,
    ledger,
    pending,
    api,
    publicKeyPEM,

    pixbookReadOnly,
    viewedPixbookProfile,
    publicLedgerSnapshot,
    privateLedgerSnapshot,
    hasPublicView,

    profileUsername,
    hasProfile,
    disabled,

    currentIdentityFingerprint,
    currentIdentityLabel,
    currentIdentityUsername,
    currentPixbookLabel,
    currentCollectionId,

    identities,
    currentIdentityId,
    activeIdentity,
    activeIdentityPixbooks,
    pixbooks,
    currentPixbookId,
    activePixbook,

    candidateIdentities,

    viewingIdentityKey,
    viewingLabel,

    pixbookHead,
    dirty,

    statusMessage,
    errorMessage,
    uploadError,
    uploadStatus,

    setStatus,
    setError,

    registerCurrentIdentity,
    upsertRecoveredIdentityMaterial,
    switchIdentityLocal,
    switchPixbookLocal,

    createIdentityCandidate,
    confirmIdentityCandidate,
    discardIdentityCandidate,
    renameIdentityLabel,
    setIdentityUsername,
    removeIdentityLocal,

    createPixbook,
    renamePixbook,
    setDefaultPixbook,
    removePixbookLocal,

    ensurePixbook,
    ensureCurrentPixbookRecord,
    persistCurrentPixbookSnapshot,
    loadPersistedLedgerSnapshot,

    buildPixbook,
    downloadPixbook,
    importPixbookFile,

    setProfileHandle,

    createNewPixbook,
    returnToMyPixbook,
    eraseLocalPixbook,
  };
}

export function providePixpaxContextStore() {
  const store = createPixpaxContextStore();
  provide(usePixpaxContextStoreSymbol, store);
  return store;
}

export function usePixpaxContextStore() {
  const store = inject<PixpaxContextStore>(usePixpaxContextStoreSymbol);
  if (!store) {
    throw new Error(
      "usePixpaxContextStore() called without providePixpaxContextStore()."
    );
  }
  return store;
}
