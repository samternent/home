import { shallowRef, provide, inject, watch, computed } from "vue";

import {
  createLedgerRuntime,
  lokiPlugin,
  indexedDbPlugin,
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

type PermissionRecord = {
  id: string;
  identity: string;
  title: string;
  public: string;
  secret: string;
};

type ProvideLedgerContext = {
  db: any;
  ledger: ReturnType<typeof computed<any>>;
  pending: ReturnType<typeof computed<any[]>>;
  api: ReturnType<typeof createLedgerRuntime<any>>;
  bridge: ReturnType<typeof createLedgerBridge<any>>;
  collections: ReturnType<typeof createLedgerBridge<any>>["collections"];
  compressedBlob: ReturnType<typeof shallowRef<Blob | undefined>>;
  createPermission: (title: string) => Promise<any>;
  addUserPermission: (
    title: string,
    identity: string,
    encryptionKey: string
  ) => Promise<any>;
  addItem: (
    data: Record<string, any>,
    collection?: string,
    permissionTitle?: string
  ) => Promise<void>;
  getCollection: (name: string) => any;
  getCollections: () => Record<string, any>;
};

export function provideLedger({
  ledger: initialLedger,
}: { ledger?: any } = {}) {
  const compressedBlob = shallowRef<Blob>();

  const { publicKeyPEM: publicKeyIdentityPEM } = useIdentity();
  const { privateKey: privateKeyEncryption, publicKey: publicKeyEncryption } =
    useEncryption();

  // Plugins
  const loki = lokiPlugin({
    name: "ledger",
    myPublicIdentityPem: stripIdentityKey(publicKeyIdentityPEM.value),
    myPrivateEncryptionKey: privateKeyEncryption.value,
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
    sign: async (signingKey, payload) => sign(signingKey, payload),
    autoPersist: true,
  });

  const bridge = createLedgerBridge(api, { loki });
  const ledger = computed(() => bridge.state.value.ledger);
  const pending = computed(() => bridge.state.value.pending ?? []);

  provideLedgerBridge(bridge);

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

    const [encryptionSecret, encryptionPublic] = await generateEncryptionKeys();

    // Secret is encrypted to *my* encryption public key so I can later re-share it
    const secretForMe = await encrypt(
      publicKeyEncryption.value,
      encryptionSecret
    );

    return api.addAndStage({
      kind: "permissions",
      payload: {
        identity: stripIdentityKey(publicKeyIdentityPEM.value),
        title,
        public: encryptionPublic,
        secret: stripEncryptionFile(secretForMe),
        id: generateId(),
      } satisfies PermissionRecord,
    });
  }

  async function addUserPermission(
    title: string,
    identity: string,
    encryptionKey: string
  ) {
    await ensureAuthed();

    // Find my permission record (in Loki read model)
    const permission = loki.getCollection("permissions")?.findOne({
      "payload.identity": stripIdentityKey(publicKeyIdentityPEM.value),
      "payload.title": title,
    })?.payload as PermissionRecord | undefined;

    if (!permission) {
      console.log("No permission");
      return;
    }

    // Decrypt my stored secret -> recover the permission key
    const permissionKey = await decrypt(
      privateKeyEncryption.value,
      formatEncryptionFile(permission.secret)
    );

    // Encrypt the permission key for the target user
    const secretForUser = await encrypt(encryptionKey, permissionKey);

    return api.addAndStage({
      kind: "permissions",
      payload: {
        identity,
        title,
        public: permission.public,
        secret: stripEncryptionFile(secretForUser),
        id: generateId(),
      } satisfies PermissionRecord,
    });
  }

  async function addItem(
    data: Record<string, any>,
    collection = "items",
    permissionTitle?: string
  ) {
    await ensureAuthed();

    // Optional: permission-based encryption
    if (!permissionTitle) {
      await api.addAndStage({
        kind: collection,
        payload: { ...data, id: data?.id || generateId() },
      });
    } else {
      const myIdentity = stripIdentityKey(publicKeyIdentityPEM.value);

      const permission =
        loki.getCollection("permissions")?.findOne({
          "payload.identity": myIdentity,
          "payload.title": permissionTitle,
        }) ||
        loki.getCollection("users")?.findOne({
          "payload.identity": permissionTitle,
        });

      if (!permission) {
        await api.addAndStage({
          kind: collection,
          payload: { ...data, id: data?.id || generateId() },
        });
      } else {
        const pub = permission.payload.public || permission.payload.encryption;

        await api.addAndStage({
          kind: collection,
          payload: {
            permission: permissionTitle,
            encrypted: stripEncryptionFile(
              await encrypt(pub, JSON.stringify({ ...data, id: generateId() }))
            ),
          },
        });
      }
    }

    // // Squash pending (git-style) and re-sign rewritten entries
    // await api.squash(
    //   squashByIdAndKindAndResign({
    //     // which kinds should be squashed (optional filter)
    //     kinds: [collection],
    //   })
    // );
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
