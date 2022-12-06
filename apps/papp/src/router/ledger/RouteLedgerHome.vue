<script setup>
import { shallowRef, watch } from "vue";

import { AddPermissionsDialog } from "@/modules/permissions";
import { IdentityAvatar } from "@/modules/identity";
import { useLedger } from "@/modules/ledger";

const dialog = shallowRef(false);

const { createPermission, addEncrypted, getCollection, ledger } = useLedger();

const users = shallowRef([]);
const permissions = shallowRef([]);
const todos = shallowRef([]);

watch(
  ledger,
  async (_ledger) => {
    users.value = getCollection("users")?.data;
    permissions.value = getCollection("permissions")?.data;
    todos.value = getCollection("todos")?.data;
  },
  { immediate: true }
);

function addPermission(data) {
  createPermission(data);
  dialog.value = false;
}
</script>
<template>
  <div class="px-4">
    <VTextField type="text" v-model="itemTitle" />
    <div class="flex">
      <VBtn variant="flat" color="primary" @click="addItem">Add Item</VBtn>

      <VBtn
        variant="flat"
        color="primary"
        @click="() => addEncrypted({ test: 'testdata' })"
        >Add Encrypted</VBtn
      >
    </div>
    Users
    <div class="flex">
      <IdentityAvatar
        v-for="user in users"
        :key="user.id"
        :identity="user.identity"
      />
    </div>
    Permissions
    <div v-for="permission in permissions" :key="permission.id">
      {{ permission.data.title }}
      <IdentityAvatar :identity="permission.data.user" />
    </div>
    Todos
    <div v-for="item in todos" :key="item.id">{{ item.data }}</div>
  </div>
</template>
