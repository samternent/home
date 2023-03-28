import { shallowRef, provide, inject, watchEffect } from "vue";
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

import type { Ref } from "vue";
import type { ILedger } from "@concords/proof-of-work";
import type { ILedgerAPI } from "@concords/ledger";

const useLedgerSymbol = Symbol("useLedger");

interface IUseLedger {
  ledger: Ref<ILedger | null>;
  createPermission: Function;
  addUserPermission: Function;
  addItem: Function;
  getCollection: Function;
  getCollections: Function;
  api: ILedgerAPI;
}

function Ledger(): IUseLedger {
  const ledger = shallowRef<ILedger | null>(null);

  const { publicKeyPEM: publicKeyIdentityPEM } = useIdentity();
  const { privateKey: privateKeyEncryption, publicKey: publicKeyEncryption } =
    useEncryption();

  const {
    getCollection,
    plugin: lokiPlugin,
    getCollections,
  } = useLokiPlugin(
    "ledger",
    stripIdentityKey(publicKeyIdentityPEM.value),
    privateKeyEncryption.value
  );

  const ledgerApi = createLedger({
    plugins: [
      lokiPlugin,
      {
        onReady({ ledger: _ledger }: { ledger: ILedger }) {
          ledger.value = _ledger;
        },
        onUpdate({ ledger: _ledger }: { ledger: ILedger }) {
          ledger.value = _ledger;
        },
      },
    ],
  });

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
    const permission =
      getCollection("permissions").findOne({
        "data.identity": stripIdentityKey(myKey),
        "data.title": permissionTitle,
      }) ||
      getCollection("users").findOne({
        "data.identity": permissionTitle,
      });

    if (!permission) {
      return ledgerApi.add(
        { ...data, id: data?.id || generateId() },
        collection
      );
    }

    return ledgerApi.add(
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

  watchEffect(async () => {
    if (ledger.value?.pending_records > 1) {
      await ledgerApi.squashRecords();
    }
  });

  return {
    ledger,
    api: ledgerApi,
    createPermission,
    addUserPermission,
    addItem,
    getCollection,
    getCollections,
  };
}

/**
 * @type {Ledger}
 */
export function provideLedger(): ILedgerAPI {
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
