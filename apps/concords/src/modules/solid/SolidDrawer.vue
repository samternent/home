<script setup lang="ts">
import { ref, inject, watch } from "vue";
import { useSolid } from "./useSolid";
import solidLogo from "@/assets/solid_logo.png";

const {
  profile,
  logout,
  providers,
  getDataSet,
  login,
  hasSolidSession,
  handleSessionLogin,
  fetch,
  workspace,
  oidcIssuer,
} = useSolid();

const ledgerList = ref([]);
async function fetchLedgers() {
  const list = await getDataSet("ledger");
  ledgerList.value = Object.keys(list.graphs.default)
    .filter((key) => /[^\\]*\.(\w+)$/.test(key))
    .map((str) => str.split("\\").pop().split("/").pop().split(".").shift());
}
async function fetchLedger(_id, b) {
  const { chain, difficulty, id } = await fetch("ledger", _id);
  emit("load", { pending_records: [], chain, difficulty, id });
}
watch(
  [hasSolidSession, workspace],
  ([_hasSolidSession, _workspace]) => {
    console.log(_workspace);
    if (_hasSolidSession && _workspace) {
      fetchLedgers();
    }
  },
  { immediate: true }
);
// handleSessionLogin();
</script>

<template>
  <div class="flex w-full">
    <!-- <img :src="solidLogo" class="mx-3" /> -->
    <div
      v-if="!hasSolidSession"
      class="flex flex-shrink flex-col justify-center w-full"
    >
      <select
        v-model="oidcIssuer"
        class="mx-2 bg-primary-background text-primary-text border-0 flex"
      >
        <option v-for="provider in providers" :key="provider" :value="provider">
          {{ provider }}
        </option>
      </select>
      <button
        @click="login"
        class="shadow-xl truncate inline-flex items-center m-8 justify-center px-5 py-3 border border-transparent text-base font-medium rounded-tl-md rounded-br-md bg-b text-primary-background"
      >
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
      </button>
      <!-- <h3 class="text-3xl font-thin text-center text-sec-text mx-4 my-16 italic">
        “Sir Tim Berners-Lee's vision of a vibrant web, for all.”
      </h3> -->
      <a
        href="https://inrupt.com/solid/"
        target="_blank"
        class="font-medium flex items-center inline-block mx-auto text-a hover:text-c"
      >
        https://inrupt.com/solid/
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="ml-2 h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
          />
        </svg>
      </a>
      <!-- <p class="p-4 my-8 italic text-light">
        “Solid is a technology for organizing data, applications, and identities on the web. Solid enables richer choices for people, organizations and app developers by building on existing web standards.”
      </p> -->
    </div>
    <div v-else class="py-2 w-full h-screen flex justify-top flex-col">
      <a
        class="text-sm truncate my-4 mx-2 hover:text-e underline"
        :href="profile.url"
        >{{ profile.url }}</a
      >
      <div v-if="!ledgerList.length" class="flex flex-1 text-sec-text">
        No Saved Ledgers
      </div>
      <div v-else class="flex-1 p-2">
        <div
          v-for="id of ledgerList"
          :key="id"
          class="font-medium cursor-pointer my-1 rounded hover:text-a group px-4 py-1"
        >
          <div class="flex w-full items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="mr-2 text-yellow-500 group-hover:text-b h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            <span class="block truncate" @click="fetchLedger(id)">{{
              id
            }}</span>
          </div>
        </div>
      </div>
      <button
        @click="logout"
        class="shadow-xl truncate sticky flex items-center m-8 justify-center px-5 py-3 border border-transparent text-base font-medium rounded-tl-md rounded-br-md bg-b text-primary-background"
      >
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
            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
          />
        </svg>
        Logout
      </button>
    </div>
  </div>
</template>
