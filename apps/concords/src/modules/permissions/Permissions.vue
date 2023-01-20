<script lang="ts" setup>
import { shallowRef, watch, ref } from "vue";
import { useLedger } from "@/modules/ledger";
import { PeoplePicker } from "@/modules/people";
import type { IRecord } from "@concords/proof-of-work";
import { IdentityAvatar } from "../identity";

interface IUser {
  identity: string;
  encryption: string;
}

const { ledger, getCollection, createPermission, addUserPermission } =
  useLedger();
const permissions = ref<{
  [key: string]: Array<IRecord>;
}>({});
const title = shallowRef<string>("");
const user = shallowRef<IUser | null>(null);

watch(
  ledger,
  () => {
    const collection = getCollection("permissions")?.data;
    if (!collection) return;
    for (let i = 0; i < collection.length; i++) {
      const permission = collection[i];
      if (permission.data?.title) {
        if (!permissions.value[permission.data.title]) {
          permissions.value[permission.data.title] = [];
        }
        permissions.value[permission.data.title].push(permission.data);
      }
    }
  },
  { immediate: true }
);

function addPermission() {
  createPermission(title.value);
}

function addUserToPermission(title: string) {
  if (!user.value) return;
  const { identity, encryption } = user.value;
  if (!identity || !encryption) return;
  addUserPermission(title, identity, encryption);
}
</script>

<template>
  <div>
    <div>
      <input v-model="title" placeholder="Permission Name" />
      <button @click="addPermission">Add Permission</button>
    </div>
    <div
      v-for="permissionType in Object.keys(permissions)"
      :key="permissionType"
    >
      {{ permissionType }}
      <div class="flex">
        <IdentityAvatar
          v-for="person in permissions[permissionType]"
          :key="person.id"
          :identity="person.identity"
          class="mr-2"
        />
      </div>
      <PeoplePicker v-model="user" />
      <button class="border" @click="addUserToPermission(permissionType)">
        Add To Permission
      </button>
    </div>
  </div>
</template>
