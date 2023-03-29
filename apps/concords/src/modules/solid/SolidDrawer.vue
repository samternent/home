<script setup lang="ts">
import { ref, inject, watch } from "vue";
import { useSolid } from "./useSolid";
import solidLogo from "@/assets/solid_logo.png";

const emit = defineEmits(["load"]);
const {
  profile,
  logout,
  providers,
  getDataSet,
  login,
  hasSolidSession,
  deleteLedger,
  fetch,
  workspace,
  oidcIssuer,
} = useSolid();

const ledgerList = ref([]);
async function fetchLedgers() {
  const list = await getDataSet("ledger");
  ledgerList.value = Object.keys(list.graphs.default)
    .filter((key) => /[^\\]*\.(\w+)$/.test(key))
    .map((str) => str.split("\\").pop().split("/").pop());
}
async function fetchLedger(_id, b) {
  const ledger = await fetch("ledger", _id);
  emit("load", JSON.parse(ledger));
}
watch(
  [hasSolidSession, workspace],
  ([_hasSolidSession, _workspace]) => {
    if (_hasSolidSession && _workspace) {
      fetchLedgers();
    }
  },
  { immediate: true }
);
</script>

<template>
  <div class="flex w-full">
    <div
      v-if="!hasSolidSession"
      class="flex flex-shrink flex-col justify-center w-full"
    >
      <div class="flex flex-row">
        <img :src="solidLogo" class="mx-3 h-16" />
        <VSelect v-model="oidcIssuer" :items="providers" class="p-2 w-full" />
      </div>

      <VBtn @click="login">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-6 w-6 inline mx-2"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
          />
        </svg>
        Connect to Solid Pod
      </VBtn>
    </div>
    <div v-else class="py-2 w-full h-screen flex justify-top flex-col">
      <div class="flex flex-row items-center justify-between">
        <img :src="solidLogo" class="mx-3 w-12" />
        <a
          class="text-sm truncate my-4 mx-2 hover:text-e underline"
          :href="profile.url"
          >{{ profile.url }}</a
        >
        <VBtn @click="logout" size="x-small" variant="plain">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6 mx-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          Logout
        </VBtn>
      </div>

      <div v-if="!ledgerList.length" class="flex flex-1 text-sec-text">
        No Saved Ledgers
      </div>
      <div v-else class="flex-1 p-2 mt-4">
        <strong>Documents</strong>
        <div
          v-for="id of ledgerList"
          :key="id"
          class="font-light my-1 rounded hover:text-a group px-4 py-1"
        >
          <div class="flex w-full items-center justify-between">
            <span class="truncate">{{ id }}</span>
            <div class="flex-1 flex-grow flex min-w-64">
              <VBtn variant="plain" @click="fetchLedger(id)">Open</VBtn>
              <VBtn variant="plain" color="error" @click="deleteLedger(id)"
                >delete</VBtn
              >
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
