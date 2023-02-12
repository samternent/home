<script setup lang="ts">
import { ref, watch, h, shallowRef } from "vue";
import { useLocalStorage } from "@vueuse/core";
import { NDataTable, NButton } from "naive-ui";
import {
  IdentityAvatar,
  useIdentity,
  impersonateUsers,
} from "@/modules/identity";
import { useLedger } from "@/modules/ledger";
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

const createColumns = ({ play }: { play: (row: IRecord) => void }) => {
  return [
    {
      title: "",
      key: "identity",
      render(row: IRecord) {
        return h(IdentityAvatar, {
          identity: row.data?.identity,
          size: "sm",
        });
      },
      width: 50,
    },
    {
      title: "Username",
      key: "username",
      render(row: IRecord) {
        return h(
          "div",
          {
            strong: true,
            tertiary: true,
            size: "small",
          },
          row.data?.username
        );
      },
    },
    {
      key: "actions",
      fixed: "right",
      width: 50,
      render(row: IRecord) {
        return isMe(row.data?.identity)
          ? ""
          : h(
              NButton,
              {
                onClick: () => impersonateUser(row.data?.identity),
              },
              "..."
            );
      },
    },
  ];
};

const columns = createColumns({
  play: () => "hi",
});
</script>
<template>
  <NDataTable
    :columns="columns"
    :data="people"
    :pagination="false"
    :bordered="false"
  />

  <div class="w-full flex-1 mx-auto max-w-6xl px-8 flex flex-col">
    <div class="mt-4">
      <p class="my-3 text-2xl font-thin max-w-5xl mx-auto mt-10">
        And here are some dummy users to add... (these can be impersonated for
        testing)
      </p>
      <div v-for="user in impersonateUsers" :key="user.public.identity">
        <div
          class="flex my-3 items-center bg-[#1c1c1c] p-3 rounded"
          v-if="!isActiveUser(user.public.identity, people)"
        >
          <div class="flex flex-1">
            <IdentityAvatar :identity="user.public.identity" size="md" />
            <span class="text-5xl font-thin ml-3">{{
              user.public.username
            }}</span>
          </div>
          <button
            @click="addPerson(user.public)"
            class="px-4 py-2 text-lg bg-green-600 hover:bg-green-700 transition-all rounded-full flex items-center font-medium"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="w-6 h-6"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
