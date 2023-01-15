<script lang="ts" setup>
import { shallowRef, watch } from "vue";
import { useLedger } from "@/modules/ledger";
import type { IRecord } from "@concords/proof-of-work";

interface dynamicObject {
  [key: string]: string | number;
}

const { ledger, getCollection, createPermission } = useLedger();
const permissions = shallowRef<Array<IRecord>>([]);
const title = shallowRef<string>("");

watch(
  ledger,
  () => {
    permissions.value = getCollection("permissions")?.data;
    console.log(getCollection("permissions")?.data);
  },
  { immediate: true }
);

function addPermission() {
  createPermission(title.value);
}
</script>

<template>
  <div>
    <div>
      <input v-model="title" placeholder="Permission Name" />
      <button @click="addPermission">Add Permission</button>
    </div>
    <div v-for="item in permissions" :key="item.id">
      {{ item.data }}
    </div>
  </div>
</template>
