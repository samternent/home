<script lang="ts" setup>
import { shallowRef, watch } from "vue";
import { useLedger } from "@/modules/ledger";
import type { IRecord } from "@concords/proof-of-work";
import { stripIdentityKey } from "@concords/utils";

const { ledger, getCollection, addItem } = useLedger();
const people = shallowRef<Array<IRecord>>([]);

watch(
  ledger,
  () => {
    people.value = getCollection("users")?.data;
  },
  { immediate: true }
);

const user = shallowRef("");
const encryption = shallowRef("");

async function addPerson() {
  try {
    await addItem(JSON.parse(user.value), "users");
    user.value = "";
  } catch (e) {}
}
</script>

<template>
  <div>
    <div v-for="item in people" :key="item.id">
      {{ item.data }}
    </div>
    <div>
      <textarea v-model="user" placeholder="Identity" />
      <button @click="addPerson">Add Person</button>
    </div>
  </div>
</template>
