import { shallowRef, provide, inject, onMounted } from "vue";
import { useLocalStorage } from "@vueuse/core";
import { createLedger, useLokiPlugin } from "@concords/ledger";

import { useIdentity } from "../identity";
import { useEncryption, encrypt, generateEncryptionKeys } from "../encryption";

const useLedgerSymbol = Symbol("useLedger");

function generateId() {
  const uint32 = window.crypto.getRandomValues(new Uint32Array(1))[0];
  return uint32.toString(16);
}

function Ledger(tables = ["users", "permissions"]) {
  const ledgerStorage = useLocalStorage("concords/ledger", null);
  const ledger = shallowRef(null);

  const {
    privateKey: privateKeyIdentity,
    publicKey: publicKeyIdentity,
    publicKeyPEM: publicKeyIdentityPEM,
  } = useIdentity();
  const { privateKey: privateKeyEncryption, publicKey: publicKeyEncryption } =
    useEncryption();

  const {
    getCollection,
    plugin: lokiPlugin,
    db,
  } = useLokiPlugin("ledger", privateKeyEncryption.value);

  const ledgerApi = createLedger({
    plugins: [
      lokiPlugin,
      {
        onReady({ ledger: _ledger }) {
          ledgerStorage.value = JSON.stringify(_ledger);
          ledger.value = _ledger;
        },
        onUpdate({ ledger: _ledger }) {
          ledgerStorage.value = JSON.stringify(_ledger);
          ledger.value = _ledger;
        },
      },
    ],
  });

  async function init() {
    await ledgerApi.auth(privateKeyIdentity.value, publicKeyIdentity.value);
    ledgerStorage.value
      ? await ledgerApi.load(JSON.parse(ledgerStorage.value))
      : await ledgerApi.create();
  }

  onMounted(init);

  async function createPermission(title: String) {
    const [encryptionSecret, encryptionPublic] = await generateEncryptionKeys();
    return ledgerApi.add(
      {
        user: publicKeyIdentityPEM.value,
        title,
        public: encryptionPublic,
        secret: await encrypt(publicKeyEncryption.value, encryptionSecret),
        id: generateId(),
      },
      "permissions"
    );
  }
  async function addEncrypted(data: Object) {
    const myKey = publicKeyIdentityPEM.value;
    const permission = getCollection("permissions").findOne({
      "data.user": myKey,
    });
    if (!permission) {
      console.log("No permission");
      return;
    }
    return ledgerApi.add(
      {
        permission: permission.id,
        encrypted: await encrypt(
          permission.data.public,
          JSON.stringify({ ...data, id: generateId() })
        ),
      },
      "items"
    );
  }
  async function addItem(data: Object, collection: String = "items") {
    return ledgerApi.add({ ...data, id: generateId() }, collection);
  }

  return {
    ledger,
    db,
    createPermission,
    addEncrypted,
    addItem,
    getCollection,
  };
}

/**
 * @type {Ledger}
 */
export function provideLedger() {
  const ledger = Ledger();
  provide(useLedgerSymbol, ledger);
  return ledger;
}

/**
 * @type {Ledger}
 */
export function useLedger() {
  return inject(useLedgerSymbol);
}
