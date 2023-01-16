<script lang="ts" setup>
import { shallowRef, watch } from "vue";
import { useLedger } from "@/modules/ledger";
import { PeoplePicker } from "@/modules/people";
import type { IRecord } from "@concords/proof-of-work";

interface IUser {
  identity: string;
  encryption: string;
}

const { ledger, getCollection, createPermission, addUserPermission } =
  useLedger();
const permissions = shallowRef<Array<IRecord>>([]);
const title = shallowRef<string>("");
const user = shallowRef<IUser | null>(null);

watch(
  ledger,
  () => {
    permissions.value = getCollection("permissions")?.data;
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
  console.log(identity);
  addUserPermission(title, identity, encryption);
}
</script>

<template>
  <div>
    <div>
      <input v-model="title" placeholder="Permission Name" />
      <button @click="addPermission">Add Permission</button>
    </div>
    <div v-for="item in permissions" :key="item.id">
      <!-- {{ item.data }} -->
      {{ item.data?.title }}
      <PeoplePicker v-model="user" />
      <button class="border" @click="addUserToPermission(item.data?.title)">
        Add To Permission
      </button>
    </div>
  </div>
</template>
