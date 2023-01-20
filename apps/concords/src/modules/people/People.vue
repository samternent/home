<script lang="ts" setup>
import { shallowRef, watch } from "vue";
import { useLedger } from "@/modules/ledger";
import { IdentityAvatar } from "@/modules/identity";
import type { IRecord } from "@concords/proof-of-work";

const { ledger, getCollection, addItem } = useLedger();
const people = shallowRef<Array<IRecord>>([]);

watch(
  ledger,
  () => {
    people.value = getCollection("users")?.data;
    console.log(people.value);
  },
  { immediate: true }
);

const user = shallowRef("");
const encryption = shallowRef("");

async function addPerson() {
  try {
    console.log(JSON.parse(user.value));
    await addItem(JSON.parse(user.value), "users");
    user.value = "";
  } catch (e) {}
}
</script>

<template>
  <div>
    <div v-for="item in people" :key="item.data?.id">
      <IdentityAvatar :identity="item.data?.identity" />
    </div>
    <div>
      <textarea v-model="user" placeholder="Identity" />
      <button @click="addPerson">Add Person</button>
    </div>
  </div>
</template>
