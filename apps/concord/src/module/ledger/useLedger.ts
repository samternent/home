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

import { sign, exportPublicKeyAsPem } from "ternent-identity";

import { useEncryption } from "../encryption/useEncryption";
import { useIdentity } from "../identity/useIdentity";

const useLedgerSymbol = Symbol("useLedger");

type PermissionGroupRecord = {
  id: string;
  title: string;
  public: string;
  createdBy: string;
  scope: string;
};

type PermissionGrantRecord = {
  id: string;
  permissionId: string;
  identity: string;
  secret: string;
};

type LegacyPermissionRecord = {
  id: string;
  identity: string;
  title: string;
  public: string;
  secret: string;
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

type ProvideLedgerContext = {
  db: any;
  ledger: ComputedRef<any>;
  pending: ComputedRef<any[]>;
  api: ReturnType<typeof createLedgerRuntime>;
  bridge: ReturnType<typeof createLedgerBridge>;
  collections: ReturnType<typeof createLedgerBridge>["collections"];
  compressedBlob: ShallowRef<Blob | undefined>;
  createPermission: (
    title: string,
    scope: string
  ) => Promise<PermissionGroupRecord | void>;
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

  // Plugins
  async function decryptEntryIfPossible(
    entry: EntryWithId
  ): Promise<EntryWithId | null> {
    if (!isPayloadObject(entry.payload)) return entry;

    const payload = entry.payload;
    const encryptedPayload = getEncryptedPayload(payload);
    const myIdentity = stripIdentityKey(publicKeyIdentityPEM.value);
    if (!encryptedPayload) return entry;

    try {
      if (!hasPermissionLink(payload)) {
        if (!privateKeyEncryption.value) {
          return { ...entry, payload: { ...payload, keyMissing: true } };
        }

        const clear = await decrypt(
          privateKeyEncryption.value,
          formatEncryptionFile(encryptedPayload)
        );
        return { ...entry, payload: { ...payload, ...JSON.parse(clear) } };
      }

      let permSecret: string | null = null;
      if (typeof payload.permissionId === "string") {
        const grant = loki.getCollection("permission-grants")?.findOne({
          "payload.permissionId": payload.permissionId,
          "payload.identity": myIdentity,
        });
        permSecret = grant?.payload?.secret ?? null;
      }

      if (!permSecret) {
        const legacy = loki.getCollection("permissions")?.findOne({
          "payload.title": payload.permission,
          "payload.identity": myIdentity,
        });
        permSecret = legacy?.payload?.secret ?? null;
      }

      if (permSecret) {
        if (!privateKeyEncryption.value) {
          return { ...entry, payload: { ...payload, keyMissing: true } };
        }

        const sharedKey = await decrypt(
          privateKeyEncryption.value,
          formatEncryptionFile(permSecret)
        );
        const clear = await decrypt(
          sharedKey,
          formatEncryptionFile(encryptedPayload)
        );
        return { ...entry, payload: { ...payload, ...JSON.parse(clear) } };
      }

      if (!privateKeyEncryption.value) {
        return { ...entry, payload: { ...payload, keyMissing: true } };
      }

      const clear = await decrypt(
        privateKeyEncryption.value,
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
    bootstrapKinds: [
      "permissions",
      "permission-grants",
      "board-columns",
      "tasklists",
    ],
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
    autoPersist: true,
  });

  const bridge = createLedgerBridge(api, { loki });
  const ledger = computed(() => bridge.state.value.ledger);
  const pending = computed(() => bridge.state.value.pending ?? []);

  provideLedgerBridge(bridge);

  async function ensureEncryptionReady() {
    if (!publicKeyEncryption.value) {
      throw new Error("Missing encryption key.");
    }
    return publicKeyEncryption.value;
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

  async function createPermission(title: string, scope: string) {
    await ensureAuthed();
    const myEncryptionKey = await ensureEncryptionReady();

    // Find permission group record (in Loki read model)
    const existingGroup = loki.getCollection("permission-groups")?.findOne({
      "payload.title": title,
      "payload.scope": scope,
      "payload.createdBy": stripIdentityKey(publicKeyIdentityPEM.value),
    })?.payload as PermissionGroupRecord | undefined;

    if (existingGroup) {
      console.log("Permission name already exists");
      return;
    }

    const [encryptionSecret, encryptionPublic] = await generateEncryptionKeys();

    // Secret is encrypted to *my* encryption public key so I can later re-share it
    const secretForMe = await encrypt(myEncryptionKey, encryptionSecret);

    const permissionGroup = {
      id: generateId(),
      title,
      public: encryptionPublic,
      createdBy: stripIdentityKey(publicKeyIdentityPEM.value),
      scope,
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
    await ensureEncryptionReady();

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
    if (!privateKeyEncryption.value) {
      throw new Error("Missing encryption key for permission grant.");
    }

    let permissionKey: string;
    try {
      permissionKey = await decrypt(
        privateKeyEncryption.value,
        formatEncryptionFile(myGrant.secret)
      );
    } catch (error) {
      throw new Error("Failed to decrypt permission grant secret.");
    }

    // Encrypt the permission key for the target user
    const secretForUser = await encrypt(encryptionKey, permissionKey);
    const permissionGrant = {
      permissionId,
      identity: normalizedIdentity,
      secret: stripEncryptionFile(secretForUser),
      id: generateId(),
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

      const pub =
        permissionRecord?.public ||
        permissionRecord?.encryption ||
        (forceEncrypt ? await ensureEncryptionReady() : null);

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

      await api.addAndStage({
        kind: collection,
        payload: {
          permission: permissionTitle,
          permissionId:
            permissionGroup?.payload.id ??
            (typeof dataPermissionId === "string" ? dataPermissionId : null),
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
