<script setup lang="ts">
import { ref, watch, h, shallowRef, defineComponent } from "vue";
import { useLocalStorage } from "@vueuse/core";
import {
  IdentityAvatar,
  useIdentity,
  impersonateUsers,
} from "@/modules/identity";
import { useLedger } from "@/modules/ledger";
import { IdentityAvatarCell } from "@/modules/table";
import type { IRecord } from "@concords/proof-of-work";

const { ledger, getCollection, addItem } = useLedger();
const { publicKeyPEM } = useIdentity();
const people = ref<Array<IRecord>>([]);

watch(
  ledger,
  () => {
    people.value = [...(getCollection("users")?.data || [])].reverse();
  },
  { immediate: true }
);
const impersonateUserIdentity = useLocalStorage<string>(
  "concords/impersonate",
  null
);

async function addPerson(user: Object) {
  try {
    await addItem(user, "users");
  } catch (e) {}
}

function isActiveUser(identity: string, _people: Array<IRecord>) {
  return _people?.some(
    (person: IRecord): Boolean => person.data?.identity === identity
  );
}

function isMe(identity: string) {
  return identity === publicKeyPEM.value;
}

const publicEncryptionKey = useLocalStorage("concords/encrypt/publicKey", "");
const privateEncryptionKey = useLocalStorage("concords/encrypt/privateKey", "");
const publicIdentityKey = useLocalStorage("concords/identity/publicKey", "");
const privateIdentityKey = useLocalStorage("concords/identity/privateKey", "");

const publicEncryptionKeyB = useLocalStorage(
  "concords/backup/encrypt/publicKey",
  ""
);
const privateEncryptionKeyB = useLocalStorage(
  "concords/backup/encrypt/privateKey",
  ""
);
const publicIdentityKeyB = useLocalStorage(
  "concords/backup/identity/publicKey",
  ""
);
const privateIdentityKeyB = useLocalStorage(
  "concords/backup/identity/privateKey",
  ""
);

function impersonateUser(identity: string) {
  const user = impersonateUsers.find(
    (user: any) => user?.public.identity === identity
  );

  publicEncryptionKeyB.value = publicEncryptionKey.value;
  privateEncryptionKeyB.value = privateEncryptionKey.value;
  publicIdentityKeyB.value = publicIdentityKey.value;
  privateIdentityKeyB.value = privateIdentityKey.value;

  publicEncryptionKey.value = user.public.encryption;
  privateEncryptionKey.value = user.private.encryption;
  publicIdentityKey.value = user.public.identity;
  privateIdentityKey.value = user.private.identity;

  window.location.reload();
}

const columns = shallowRef([
  {
    title: "",
    component: IdentityAvatarCell,
    key: "identity",
  },
  {
    title: "username",
    key: "username",
  },
]);
</script>
<template>
  <table class="text-left">
    <thead>
      <th v-for="(column, i) in columns" :key="`header_${i}`">
        {{ column.title }}
      </th>
    </thead>
    <tbody>
      <tr v-for="{ data: person } in people" :key="person.id">
        <td v-for="(column, k) in columns" :key="`header_${person.id}${k}`">
          <component
            v-if="column.component"
            :is="column.component"
            v-bind="{ item: person[column.key] }"
          ></component>
          <span v-else>{{ person[column.key] }}</span>
        </td>
      </tr>
    </tbody>
  </table>
</template>
