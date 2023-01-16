import { shallowRef, provide, inject, onMounted } from "vue";
import { useLocalStorage } from "@vueuse/core";
import { createLedger, useLokiPlugin } from "@concords/ledger";
import {
  stripIdentityKey,
  stripEncryptionFile,
  formatEncryptionFile,
  generateId,
} from "@concords/utils";

import {
  encrypt,
  decrypt,
  generate as generateEncryptionKeys,
} from "@concords/encrypt";
import { useEncryption } from "../encryption";
import { useIdentity } from "../identity";

import type { ILedger } from "@concords/proof-of-work";

const useLedgerSymbol = Symbol("useLedger");

function Ledger() {
  const ledgerStorage = useLocalStorage<string>("concords/ledger", "");
  const ledger = shallowRef<ILedger | null>(null);

  const {
    privateKey: privateKeyIdentity,
    publicKey: publicKeyIdentity,
    publicKeyPEM: publicKeyIdentityPEM,
  } = useIdentity();
  const { privateKey: privateKeyEncryption, publicKey: publicKeyEncryption } =
    useEncryption();

  const { getCollection, plugin: lokiPlugin } = useLokiPlugin(
    "ledger",
    stripIdentityKey(publicKeyIdentityPEM.value),
    privateKeyEncryption.value
  );

  const ledgerApi = createLedger({
    plugins: [
      lokiPlugin,
      {
        onReady({ ledger: _ledger }: { ledger: ILedger }) {
          ledgerStorage.value = JSON.stringify(_ledger);
          ledger.value = _ledger;
        },
        onUpdate({ ledger: _ledger }: { ledger: ILedger }) {
          ledgerStorage.value = JSON.stringify(_ledger);
          ledger.value = _ledger;
        },
      },
    ],
  });

  async function init() {
    if (!privateKeyIdentity.value || !publicKeyIdentity.value) return;
    await ledgerApi.auth(privateKeyIdentity.value, publicKeyIdentity.value);
    ledgerStorage.value
      ? await ledgerApi.load(JSON.parse(ledgerStorage.value))
      : await ledgerApi.create({
          identity: stripIdentityKey(publicKeyIdentityPEM.value),
          encryption: publicKeyEncryption.value,
          id: generateId(),
        });
  }

  onMounted(init);

  async function createPermission(title: String) {
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

  async function addUserPermission(
    title: string,
    identity: string,
    encryptionKey: string
  ) {
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

  async function addItem(
    data: Object,
    collection: string = "items",
    permissionTitle: string
  ) {
    // This needs some reworking to support multiple permissions
    const myKey = publicKeyIdentityPEM.value;
    const permission = getCollection("permissions").findOne({
      "data.identity": stripIdentityKey(myKey),
      "data.title": permissionTitle,
    });

    if (!permission) {
      return ledgerApi.add({ ...data, id: generateId() }, collection);
    }

    return ledgerApi.add(
      {
        permission: permissionTitle,
        encrypted: stripEncryptionFile(
          await encrypt(
            permission.data.public,
            JSON.stringify({ ...data, id: generateId() })
          )
        ),
      },
      collection
    );
  }

  return {
    ledger,
    createPermission,
    addUserPermission,
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
