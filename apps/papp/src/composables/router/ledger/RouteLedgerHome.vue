<script setup>
import { useLocalStorage } from "@vueuse/core";
import { shallowRef, onMounted } from "vue";
import {
  generate,
  exportPrivateKeyAsPem,
  exportPublicKeyAsPem,
  importPrivateKeyFromPem,
  importPublicKeyFromPem,
} from "@concords/identity";
import { encrypt, generate as generateEncryptionKeys } from "@concords/encrypt";
import { useLedger, useLokiPlugin } from "@concords/ledger";

function generateId() {
  const uint32 = window.crypto.getRandomValues(new Uint32Array(1))[0];
  return uint32.toString(16);
}

const publicIdentity = useLocalStorage("concords/identity/publicKey", "");
const privateIdentity = useLocalStorage("concords/identity/privateKey", "");

const publicEncryption = useLocalStorage("concords/encrypt/publicKey", "");
const privateEncryption = useLocalStorage("concords/encrypt/privateKey", "");

const ledgerStorage = useLocalStorage("concords/ledger", null);
const ledger = shallowRef(null);
const todos = shallowRef([]);
const permissions = shallowRef([]);

const {
  getCollection,
  plugin: lokiPlugin,
  db,
} = useLokiPlugin("ledger", privateEncryption.value);

const { auth, load, create, replay, commit, add, destroy, squashRecords } =
  useLedger({
    plugins: [
      lokiPlugin,
      {
        onReady({ ledger: _ledger }) {
          ledgerStorage.value = JSON.stringify(_ledger);
          ledger.value = _ledger;

          todos.value = getCollection("todos")?.data;
          permissions.value = getCollection("permissions")?.data;
        },
        onUpdate({ ledger: _ledger }) {
          ledgerStorage.value = JSON.stringify(_ledger);
          ledger.value = _ledger;

          todos.value = getCollection("todos")?.data;
          permissions.value = getCollection("permissions")?.data;
        },
      },
    ],
  });

onMounted(async () => {
  let keys = {};
  if (!privateIdentity.value || !publicIdentity.value) {
    keys = await generate();
    publicIdentity.value = await exportPublicKeyAsPem(keys.publicKey);
    privateIdentity.value = await exportPrivateKeyAsPem(keys.privateKey);
  } else {
    keys.publicKey = await importPublicKeyFromPem(publicIdentity.value);
    keys.privateKey = await importPrivateKeyFromPem(privateIdentity.value);
  }

  if (!privateEncryption.value || !publicEncryption.value) {
    const [_publicEncryption, _privateEncryption] =
      await generateEncryptionKeys();
    publicEncryption.value = _privateEncryption;
    privateEncryption.value = _publicEncryption;
  }

  await auth(keys.privateKey, keys.publicKey);
  ledgerStorage.value
    ? await load(JSON.parse(ledgerStorage.value))
    : await create();
});

const itemTitle = shallowRef("");

async function createPermission() {
  const [encryptionSecret, encryptionPublic] = await generateEncryptionKeys();
  await add(
    {
      user: publicIdentity.value,
      public: encryptionPublic,
      secret: await encrypt(publicEncryption.value, encryptionSecret),
      id: generateId(),
    },
    "permissions"
  );
}
async function addUserPermission() {}

async function addEncrypted() {
  const myKey = publicIdentity.value;
  const permission = getCollection("permissions").findOne({
    "data.user": myKey,
  });
  if (!permission) {
    console.log("No permission");
    return;
  }
  await add(
    {
      permission: permission.id,
      encrypted: await encrypt(
        permission.data.public,
        JSON.stringify({ title: itemTitle.value, id: generateId() })
      ),
    },
    "todos"
  );
  itemTitle.value = "";
}
async function addItem() {
  await add({ title: itemTitle.value, id: generateId() }, "todos");
  itemTitle.value = "";
}
</script>
<template>
  <div>
    <header class="p-4">
      <h1 class="text-3xl font-light">Ledger</h1>
    </header>
    <div class="px-4">
      <input type="text" v-model="itemTitle" />
      <button @click="addItem">Add Item</button>
      <button @click="createPermission('read')">Add Permission</button>
      <button @click="addEncrypted">Add Encrypted</button>
    </div>
    Todos
    <ul>
      <li v-for="todo in todos" :key="todo.id">
        {{ todo.data }}
      </li>
    </ul>
    Permissions
    <ul>
      <li v-for="permission in permissions" :key="permission.id">
        {{ permission.data }}
      </li>
    </ul>
  </div>
</template>
