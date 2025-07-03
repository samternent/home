import { shallowRef, provide, inject, watch } from "vue";
import { createLedger, useLokiPlugin } from "ternent-ledger";
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
import { useEncryption } from "../encryption/useEncryption";
import { useIdentity } from "../identity/useIdentity";

const useLedgerSymbol = Symbol("useLedger");

export function provideLedger() {
  const ledger = shallowRef();

  const { publicKeyPEM: publicKeyIdentityPEM } = useIdentity();
  const { privateKey: privateKeyEncryption, publicKey: publicKeyEncryption } =
    useEncryption();

  const {
    getCollection,
    plugin: lokiPlugin,
    getCollections,
    db,
  } = useLokiPlugin(
    "ledger",
    stripIdentityKey(publicKeyIdentityPEM.value),
    privateKeyEncryption.value
  );

  const ledgerApi = createLedger(
    {
      plugins: [
        lokiPlugin,
        {
          onReady({ ledger: _ledger }) {
            ledger.value = _ledger;
          },
          onUpdate({ ledger: _ledger }) {
            ledger.value = _ledger;
          },
          onDestroy({ ledger: _ledger }) {
            ledger.value = _ledger;
          },
        },
      ],
    },
    0
  );

  const compressedBlob = shallowRef();

  watch(
    ledger,
    async () => {
      if (!ledger.value) return;

      const stream = new Blob([JSON.stringify(ledger.value)], {
        type: "application/gzip",
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

  async function createPermission(title) {
    const [encryptionSecret, encryptionPublic] = await generateEncryptionKeys();
    return ledgerApi.add(
      {
        identity: stripIdentityKey(publicKeyIdentityPEM.value),
        title,
        public: encryptionPublic,
        secret: stripEncryptionFile(
          await encrypt(publicKeyEncryption.value, encryptionSecret)
        ),
        id: generateId(),
      },
      "permissions"
    );
  }

  async function addUserPermission(title, identity, encryptionKey) {
    // get permission by title
    const permission = getCollection("permissions").findOne({
      "data.identity": publicKeyIdentityPEM.value,
      "data.title": title,
    })?.data;

    // decrypt permission with my key
    if (!permission) {
      console.log("No permission");
      return;
    }

    const permissionKey = await decrypt(
      privateKeyEncryption.value,
      formatEncryptionFile(permission.secret)
    );

    // encrypt permission for users key
    return ledgerApi.add(
      {
        identity,
        title,
        public: permission.public,
        secret: stripEncryptionFile(
          await encrypt(encryptionKey, permissionKey)
        ),
        id: generateId(),
      },
      "permissions"
    );
  }

  async function addItem(data, collection = "items", permissionTitle) {
    // This needs some reworking to support multiple permissions
    const myKey = publicKeyIdentityPEM.value;
    const permission =
      getCollection("permissions").findOne({
        "data.identity": stripIdentityKey(myKey),
        "data.title": permissionTitle,
      }) ||
      getCollection("users").findOne({
        "data.identity": permissionTitle,
      });

    if (!permission) {
      await ledgerApi.add(
        { ...data, id: data?.id || generateId() },
        collection
      );
    } else {
      await ledgerApi.add(
        {
          permission: permissionTitle,
          encrypted: stripEncryptionFile(
            await encrypt(
              permission.data.public || permission.data.encryption,
              JSON.stringify({ ...data, id: generateId() })
            )
          ),
        },
        collection
      );
    }

    ledgerApi.squashRecords();
  }

  provide(useLedgerSymbol, {
    db,
    ledger,
    api: ledgerApi,
    compressedBlob,
    createPermission,
    addUserPermission,
    addItem,
    getCollection,
    getCollections,
  });
}

export function useLedger() {
  return inject(useLedgerSymbol);
}
