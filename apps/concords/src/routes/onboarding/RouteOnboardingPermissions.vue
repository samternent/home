<script lang="ts" setup>
import { shallowRef, watch } from "vue";
import { useLedger } from "@/modules/ledger";
import { IdentityAvatar, useIdentity } from "@/modules/identity";
import { LayoutHeaderTitle } from "@/modules/layout";
import type { IRecord } from "@concords/proof-of-work";

const { ledger, createPermission, getCollection, addItem } = useLedger();
const { publicKeyPEM } = useIdentity();

const title = shallowRef<string>("");
const users = shallowRef<Array<IRecord>>([]);
const permissions = shallowRef<Array<IRecord>>([]);

function addPermission() {
  createPermission(title.value);
  title.value = "";
}

function getUserPermissions(userId: string, perms: Array<IRecord>) {
  return perms.filter(({ data }) => {
    return data?.identity === userId;
  });
}

watch(
  ledger,
  () => {
    permissions.value = getCollection("permissions")?.data;
    users.value = getCollection("users")?.data;
  },
  { immediate: true }
);
</script>

<template>
  <LayoutHeaderTitle title="Permissions" />
  <div class="my-3 text-xl font-thin w-full max-w-5xl mt-10">
    <div class="flex items-center" @keyup.enter="addPermission">
      <FormKit type="text" v-model="title" placeholder="Permission Name" />
      <button
        class="px-4 py-2 mb-1 ml-2 bg-green-600 hover:bg-green-700 transition-all rounded flex font-medium"
        @click="addPermission"
      >
        Add Permission
      </button>
    </div>
  </div>
  <div class="flex w-full flex-1 pt-8">
    <div class="my-6">
      <ul>
        <li v-for="user in users" :key="user.id" class="flex">
          <div class="flex flex-col">
            <IdentityAvatar :identity="user.data?.identity" size="md" />
            {{ user.data?.username }}
            <span v-if="user.data?.identity === publicKeyPEM">(you)</span>
          </div>
          <p
            v-for="permission in getUserPermissions(
              user.data?.identity,
              permissions
            )"
            :key="permission.id"
          >
            {{ permission.data?.title }}
          </p>
        </li>
      </ul>
    </div>
  </div>
  <div class="mt-12 mb-8 flex text-2xl justify-end items-center w-full">
    <RouterLink
      to="/ledger/form"
      class="px-4 py-2 text-lg bg-pink-600 hover:bg-pink-700 transition-all rounded-full flex items-center font-medium"
    >
      Add more data
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke-width="1.5"
        stroke="currentColor"
        class="w-5 h-5 ml-2"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M8.25 4.5l7.5 7.5-7.5 7.5"
        />
      </svg>
    </RouterLink>
  </div>
</template>
