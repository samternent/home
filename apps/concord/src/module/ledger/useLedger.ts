import {
  shallowRef,
  provide,
  inject,
  watch,
  computed,
  type ComputedRef,
  type ShallowRef,
} from "vue";

import {
  createLedgerRuntime,
  lokiPlugin,
  indexedDbPlugin,
  type EntryWithId,
} from "ternent-ledger";
import {
  createLedgerBridge,
  provideLedgerBridge,
  useLedgerBridge,
} from "ternent-ledger-vue";

import {
  stripIdentityKey,
  stripEncryptionFile,
  formatEncryptionFile,
  generateId,
} from "ternent-utils";

import {
  encrypt,
  decrypt,
  generate as generateEncryptionKeys,
} from "ternent-encrypt";

import {
  sign,
  exportPublicKeyAsPem,
  verify,
  importPublicKeyFromPem,
} from "ternent-identity";
import { getCommitChain, getEntrySigningPayload } from "@ternent/concord-protocol";

import { useEncryption } from "../encryption/useEncryption";
import { useIdentity } from "../identity/useIdentity";
import { useEpochKeys } from "../epoch/useEpochKeys";
import {
  canonicalizeAgeRecipient,
  canonicalizeIdentityKey,
  deriveSignerKeyId,
  deriveEpochId,
  fingerprint,
} from "../epoch/epochUtils";

const useLedgerSymbol = Symbol("useLedger");

type PermissionGroupRecord = {
  id: string;
  title: string;
  public: string;
  createdBy: string;
};

type PermissionGrantRecord = {
  id: string;
  permissionId: string;
  identity: string;
  secret: string;
  encryptionKeyId?: string;
};

type LegacyPermissionRecord = {
  id: string;
  identity: string;
  title: string;
  public: string;
  secret: string;
  encryptionKeyId?: string;
};

type EpochRecord = {
  type: "epoch";
  epochId: string;
  prevEpochId: string | null;
  createdAt: string;
  encryptionPublicKey: string;
  encryptionKeyId: string;
  signerKeyId: string;
};

type PayloadObject = Record<string, any>;

function isPayloadObject(payload: unknown): payload is PayloadObject {
  return !!payload && typeof payload === "object" && !Array.isArray(payload);
}

function getEncryptedPayload(payload: PayloadObject): string | null {
  if (payload.enc === "age" && typeof payload.ct === "string")
    return payload.ct;
  if (typeof payload.encrypted === "string") return payload.encrypted;
  return null;
}

function hasPermissionLink(
  payload: PayloadObject
): payload is PayloadObject & { permission: string; permissionId?: string } {
  return typeof payload.permission === "string";
}

function getPayloadKeyId(payload: PayloadObject): string | null {
  if (typeof payload.encryptionKeyId === "string") return payload.encryptionKeyId;
  if (typeof payload.epochId === "string") return payload.epochId;
  return null;
}

type ProvideLedgerContext = {
  db: any;
  ledger: ComputedRef<any>;
  pending: ComputedRef<any[]>;
  api: ReturnType<typeof createLedgerRuntime>;
  bridge: ReturnType<typeof createLedgerBridge>;
  collections: ReturnType<typeof createLedgerBridge>["collections"];
  compressedBlob: ShallowRef<Blob | undefined>;
  createPermission: (title: string) => Promise<PermissionGroupRecord | void>;
  addUserPermission: (
    permissionId: string,
    identity: string,
    encryptionKey: string
  ) => Promise<any>;
  getPermissionGroups: () => PermissionGroupRecord[];
  getPermissionGrantsByPermissionId: (
    permissionId: string
  ) => PermissionGrantRecord[];
  addItem: (
    data: Record<string, any>,
    collection?: string,
    permissionId?: string
  ) => Promise<void>;
  getCollection: (name: string) => any;
  getCollections: () => Record<string, any>;
};

export function provideLedger({ ledger: _ledger }: { ledger?: any } = {}) {
  const compressedBlob = shallowRef<Blob>();

  const { publicKeyPEM: publicKeyIdentityPEM } = useIdentity();
  const { privateKey: privateKeyEncryption, publicKey: publicKeyEncryption } =
    useEncryption();
  const { getKey: getEpochPrivateKey } = useEpochKeys();

  // Plugins
  async function decryptEntryIfPossible(
    entry: EntryWithId
  ): Promise<EntryWithId | null> {
    if (!isPayloadObject(entry.payload)) return entry;

    const payload = entry.payload;
    const encryptedPayload = getEncryptedPayload(payload);
    const myIdentity = stripIdentityKey(publicKeyIdentityPEM.value);
    const payloadKeyId = getPayloadKeyId(payload);

    if (!encryptedPayload) return entry;

    try {
      if (!hasPermissionLink(payload)) {
        const privateKey = payloadKeyId
          ? getEpochPrivateKey(payloadKeyId) ?? privateKeyEncryption.value
          : privateKeyEncryption.value;

        if (!privateKey) {
          return { ...entry, payload: { ...payload, keyMissing: true } };
        }

        const clear = await decrypt(
          privateKey,
          formatEncryptionFile(encryptedPayload)
        );
        return { ...entry, payload: { ...payload, ...JSON.parse(clear) } };
      }

      let permSecret: string | null = null;
      let grantKeyId: string | null = null;
      let grantKey: string | null = null;
      if (typeof payload.permissionId === "string") {
        const grant = loki.getCollection("permission-grants")?.findOne({
          "payload.permissionId": payload.permissionId,
          "payload.identity": myIdentity,
        });
        permSecret = grant?.payload?.secret ?? null;
        grantKeyId = grant?.payload?.encryptionKeyId ?? null;
      }

      if (!permSecret) {
        const legacy = loki.getCollection("permissions")?.findOne({
          "payload.title": payload.permission,
          "payload.identity": myIdentity,
        });
        permSecret = legacy?.payload?.secret ?? null;
      }

      if (permSecret) {
        grantKey = grantKeyId
          ? getEpochPrivateKey(grantKeyId) ?? privateKeyEncryption.value
          : privateKeyEncryption.value;

        if (!grantKey) {
          return { ...entry, payload: { ...payload, keyMissing: true } };
        }

        const sharedKey = await decrypt(
          grantKey,
          formatEncryptionFile(permSecret)
        );
        const clear = await decrypt(
          sharedKey,
          formatEncryptionFile(encryptedPayload)
        );
        return { ...entry, payload: { ...payload, ...JSON.parse(clear) } };
      }

      const fallbackKey = payloadKeyId
        ? getEpochPrivateKey(payloadKeyId) ?? privateKeyEncryption.value
        : privateKeyEncryption.value;

      if (!fallbackKey) {
        return { ...entry, payload: { ...payload, keyMissing: true } };
      }

      const clear = await decrypt(
        fallbackKey,
        formatEncryptionFile(encryptedPayload)
      );
      return { ...entry, payload: { ...payload, ...JSON.parse(clear) } };
    } catch {
      return { ...entry, payload: { ...payload, keyMissing: true } };
    }
  }

  const loki = lokiPlugin({
    name: "ledger",
    transformEntry: decryptEntryIfPossible,
    bootstrapKinds: ["permissions", "permission-grants"],
  });

  const idb = indexedDbPlugin({
    dbName: "ternent-ledger",
    storeName: "state",
    key: "primary",
  });

  // Projection: for the demo we keep it minimal (your UI reads from Loki)
  type Projection = { lastUpdatedAt: string | null };
  const reducer = (proj: Projection, _entry: any): Projection => ({
    lastUpdatedAt: new Date().toISOString(),
  });

  const api = createLedgerRuntime<Projection>({
    reducer,
    initialProjection: { lastUpdatedAt: null },
    plugins: [
      idb, // storage first
      loki.plugin, // then in-memory DB
    ],
    resolveAuthor: async (publicKey) =>
      stripIdentityKey(await exportPublicKeyAsPem(publicKey)),
    sign: async (signingKey, payload) => {
      return sign(signingKey, payload);
    },
    createGenesisEntries: async ({ now }) => {
      if (!publicKeyEncryption.value || !publicKeyIdentityPEM.value) {
        throw new Error("Genesis epoch requires identity and encryption keys.");
      }
      const timestamp = now();
      const signerKeyId = await deriveSignerKeyId(publicKeyIdentityPEM.value);
      const encryptionPublicKey = canonicalizeAgeRecipient(
        publicKeyEncryption.value
      );
      const epochId = await deriveEpochId({
        signerKeyId,
        encryptionPublicKey,
        prevEpochId: null,
        createdAt: timestamp,
      });
      return [
        {
          kind: "epochs",
          timestamp,
          payload: {
            type: "epoch",
            epochId,
            prevEpochId: null,
            createdAt: timestamp,
            encryptionPublicKey,
            encryptionKeyId: epochId,
            signerKeyId,
          } satisfies EpochRecord,
        },
      ];
    },
    autoPersist: true,
  });

  const bridge = createLedgerBridge(api, { loki });
  const ledger = computed(() => bridge.state.value.ledger);
  const pending = computed(() => bridge.state.value.pending ?? []);

  provideLedgerBridge(bridge);

  async function getCurrentEpochRecord(): Promise<EpochRecord | null> {
    if (!ledger.value) return null;

    const chain = getCommitChain(ledger.value);
    let current: EpochRecord | null = null;

    for (const commitId of chain) {
      const commit = ledger.value.commits?.[commitId];
      for (const entryId of commit?.entries ?? []) {
        const entry = ledger.value.entries?.[entryId] as
          | {
              kind?: string;
              payload?: EpochRecord;
              signature?: string | null;
              author?: string | null;
              timestamp?: string;
            }
          | undefined;
        if (!entry || entry.kind !== "epochs" || entry.payload?.type !== "epoch") {
          continue;
        }
        if (!entry.signature || !entry.author || !entry.payload) continue;
        try {
          const authorKey = await importPublicKeyFromPem(entry.author);
          const payload = getEntrySigningPayload(entry as any);
          const ok = await verify(entry.signature, payload, authorKey);
          const signerKeyId = await deriveSignerKeyId(
            canonicalizeIdentityKey(entry.author)
          );
          if (!entry.payload.encryptionPublicKey || !entry.payload.createdAt) {
            continue;
          }
          const expectedEpochId = await deriveEpochId({
            signerKeyId,
            encryptionPublicKey: entry.payload.encryptionPublicKey,
            prevEpochId: entry.payload.prevEpochId ?? null,
            createdAt: entry.payload.createdAt,
          });
          if (
            ok &&
            entry.payload.signerKeyId === signerKeyId &&
            entry.payload.epochId === expectedEpochId &&
            entry.payload.encryptionKeyId === expectedEpochId
          ) {
            current = entry.payload;
          }
        } catch {
          continue;
        }
      }
    }

    return current;
  }

  async function getCurrentEncryptionContext() {
    const epoch = await getCurrentEpochRecord();
    if (epoch?.encryptionPublicKey) {
      return {
        publicKey: epoch.encryptionPublicKey,
        encryptionKeyId:
          epoch.encryptionKeyId ||
          (await fingerprint(
            canonicalizeAgeRecipient(epoch.encryptionPublicKey)
          )),
      };
    }
    return { publicKey: null, encryptionKeyId: null };
  }

  async function ensureEpochForEncryption() {
    const encryptionContext = await getCurrentEncryptionContext();
    if (!encryptionContext.encryptionKeyId) {
      throw new Error("Create an epoch before encrypting data.");
    }
    return encryptionContext;
  }

  // Keep a compressed blob available (for download/export/share)
  watch(
    ledger,
    async () => {
      if (!ledger.value) return;
      const stream = new Blob([JSON.stringify(ledger.value)], {
        type: "application/json",
      }).stream();

      const compressedReadableStream = stream.pipeThrough(
        new CompressionStream("gzip")
      );
      compressedBlob.value = await new Response(
        compressedReadableStream
      ).blob();
    },
    { immediate: true }
  );

  async function ensureAuthed() {
    if (bridge.flags.value.authed) return;

    // If your app manages keys elsewhere, call api.auth(...) from outside.
    // We keep this guard so helpers throw a sensible error.
    throw new Error(
      "Ledger not authed. Call api.auth(signKey, verifyKey) before writing."
    );
  }

  async function createPermission(title: string) {
    await ensureAuthed();
    const encryptionContext = await ensureEpochForEncryption();

    // Find permission group record (in Loki read model)
    const existingGroup = loki.getCollection("permission-groups")?.findOne({
      "payload.title": title,
      "payload.createdBy": stripIdentityKey(publicKeyIdentityPEM.value),
    })?.payload as PermissionGroupRecord | undefined;

    if (existingGroup) {
      console.log("Permission name already exists");
      return;
    }

    const [encryptionSecret, encryptionPublic] = await generateEncryptionKeys();
    const myEncryptionKey = encryptionContext.publicKey;

    if (!myEncryptionKey) {
      throw new Error("Missing encryption key for permission grant.");
    }

    // Secret is encrypted to *my* encryption public key so I can later re-share it
    const secretForMe = await encrypt(myEncryptionKey, encryptionSecret);

    const permissionGroup = {
      id: generateId(),
      title,
      public: encryptionPublic,
      createdBy: stripIdentityKey(publicKeyIdentityPEM.value),
    } satisfies PermissionGroupRecord;

    await api.addAndStage({
      kind: "permission-groups",
      payload: permissionGroup,
    });

    const permissionGrant = {
      id: generateId(),
      permissionId: permissionGroup.id,
      identity: stripIdentityKey(publicKeyIdentityPEM.value),
      secret: stripEncryptionFile(secretForMe),
      encryptionKeyId: encryptionContext.encryptionKeyId ?? undefined,
    } satisfies PermissionGrantRecord;

    await api.addAndStage({
      kind: "permission-grants",
      payload: permissionGrant,
    });

    await api.addAndStage({
      kind: "permissions",
      payload: {
        id: permissionGrant.id,
        identity: permissionGrant.identity,
        title: permissionGroup.title,
        public: permissionGroup.public,
        secret: permissionGrant.secret,
        encryptionKeyId: permissionGrant.encryptionKeyId,
      } satisfies LegacyPermissionRecord,
    });

    return permissionGroup;
  }

  async function addUserPermission(
    permissionId: string,
    identity: string,
    encryptionKey: string
  ) {
    await ensureAuthed();
    const encryptionContext = await ensureEpochForEncryption();

    const normalizedIdentity = stripIdentityKey(identity);

    const permissionGroup = loki
      .getCollection("permission-groups")
      ?.findOne({ "payload.id": permissionId })?.payload as
      | PermissionGroupRecord
      | undefined;

    if (!permissionGroup) {
      console.log("No permission group");
      return;
    }

    // Find my grant for the group (in Loki read model)
    const myGrant = loki.getCollection("permission-grants")?.findOne({
      "payload.identity": stripIdentityKey(publicKeyIdentityPEM.value),
      "payload.permissionId": permissionId,
    })?.payload as PermissionGrantRecord | undefined;

    if (!myGrant) {
      console.log("No permission");
      return;
    }

    // Decrypt my stored secret -> recover the permission key
    const permissionKey = await decrypt(
      privateKeyEncryption.value,
      formatEncryptionFile(myGrant.secret)
    );

    // Encrypt the permission key for the target user
    const secretForUser = await encrypt(encryptionKey, permissionKey);
    const encryptionKeyId = encryptionContext.encryptionKeyId;

    const permissionGrant = {
      permissionId,
      identity: normalizedIdentity,
      secret: stripEncryptionFile(secretForUser),
      id: generateId(),
      encryptionKeyId,
    } satisfies PermissionGrantRecord;

    await api.addAndStage({
      kind: "permission-grants",
      payload: permissionGrant,
    });

    return api.addAndStage({
      kind: "permissions",
      payload: {
        id: permissionGrant.id,
        identity: normalizedIdentity,
        title: permissionGroup.title,
        public: permissionGroup.public,
        secret: permissionGrant.secret,
        encryptionKeyId: permissionGrant.encryptionKeyId,
      } satisfies LegacyPermissionRecord,
    });
  }

  async function addItem(
    data: Record<string, any>,
    collection = "items",
    permissionId?: string
  ) {
    await ensureAuthed();
    const recordId = data?.id || generateId();
    const {
      permission: dataPermission,
      permissionId: dataPermissionId,
      encrypted,
      enc,
      ct,
      ...payloadData
    } = data || {};
    const permissionHint =
      permissionId ??
      (typeof dataPermissionId === "string" ? dataPermissionId : null) ??
      (typeof dataPermission === "string" ? dataPermission : null);
    const forceEncrypt = Boolean(
      permissionHint || encrypted || enc || ct || dataPermissionId
    );

    // Optional: permission-based encryption
    if (!permissionHint && !forceEncrypt) {
      await api.addAndStage({
        kind: collection,
        payload: { ...payloadData, id: recordId },
        squashKinds: [collection],
      });
    } else {
      const myIdentity = stripIdentityKey(publicKeyIdentityPEM.value);

      const permissionGroup = permissionHint
        ? loki.getCollection("permission-groups")?.findOne({
            "payload.id": permissionHint,
          }) ||
          loki.getCollection("permission-groups")?.findOne({
            "payload.title": permissionHint,
            "payload.createdBy": myIdentity,
          })
        : null;

      const userPermission = permissionGroup
        ? null
        : loki.getCollection("users")?.findOne({
            "payload.identity": permissionHint,
          });

      const legacyPermission =
        permissionGroup || userPermission || !permissionHint
          ? null
          : loki.getCollection("permissions")?.findOne({
              "payload.title": permissionHint,
              "payload.identity": myIdentity,
            }) ||
            loki.getCollection("permissions")?.findOne({
              "payload.id": permissionHint,
              "payload.identity": myIdentity,
            });

      const permissionRecord =
        permissionGroup?.payload ||
        userPermission?.payload ||
        legacyPermission?.payload ||
        null;

      const usePersonalKey = !permissionRecord && forceEncrypt;
      const encryptionContext = forceEncrypt
        ? await ensureEpochForEncryption()
        : null;

      const pub =
        permissionRecord?.public ||
        permissionRecord?.encryption ||
        (forceEncrypt ? encryptionContext?.publicKey : null);

      if (!pub) {
        throw new Error(
          "Encrypted item update requires a permission record or a user encryption key."
        );
      }

      const permissionTitle =
        permissionGroup?.payload.title ||
        legacyPermission?.payload.title ||
        (typeof dataPermission === "string" ? dataPermission : null) ||
        permissionHint;

      const encryptionKeyId = encryptionContext?.encryptionKeyId ?? null;

      if (forceEncrypt && !encryptionKeyId) {
        throw new Error("Create an epoch before encrypting data.");
      }

      await api.addAndStage({
        kind: collection,
        payload: {
          permission: permissionTitle,
          permissionId:
            permissionGroup?.payload.id ??
            (typeof dataPermissionId === "string" ? dataPermissionId : null),
          ...(encryptionKeyId ? { encryptionKeyId } : {}),
          id: recordId,
          encrypted: stripEncryptionFile(
            await encrypt(pub, JSON.stringify({ ...payloadData, id: recordId }))
          ),
        },
        squashKinds: [collection],
      });
    }

    // Always squash pending for this kind so the latest entry wins.
    // Squash runs inside addAndStage to avoid intermediate pending updates.
  }

  const ctx: ProvideLedgerContext = {
    db: loki.db,
    ledger,
    pending,
    api,
    bridge,
    collections: bridge.collections,
    compressedBlob,
    createPermission,
    addUserPermission,
    addItem,
    getPermissionGroups: () =>
      (loki.getCollection("permission-groups")?.find() ??
        []) as PermissionGroupRecord[],
    getPermissionGrantsByPermissionId: (permissionId: string) =>
      (loki.getCollection("permission-grants")?.find({
        "payload.permissionId": permissionId,
      }) ?? []) as PermissionGrantRecord[],
    getCollection: (name: string) => loki.getCollection(name),
    getCollections: () => loki.getCollections(),
  };

  provide(useLedgerSymbol, ctx);
}

export function useLedger(): ProvideLedgerContext {
  const ctx = inject<ProvideLedgerContext>(useLedgerSymbol);
  if (!ctx) throw new Error("useLedger() called without provideLedger()");
  return ctx;
}

export function useBridge() {
  return useLedgerBridge();
}
