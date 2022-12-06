<script setup>
// import {
//   getSolidDataset,
//   getThing,
//   setThing,
//   getStringNoLocale,
//   setStringNoLocale,
//   saveSolidDatasetAt,
// } from "@inrupt/solid-client";
// import { Session } from "@inrupt/solid-client-authn-browser";
// import { VCARD } from "@inrupt/vocab-common-rdf";
import { shallowRef, watch } from "vue";
import { useSolid } from "@/modules/solid";

const { hasSolidSession, login, profile, store, getDataSet, workspace } =
  useSolid();
const ledgerList = shallowRef([]);

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
    console.log(hasSolidSession.value, workspace.value);
    if (_hasSolidSession && _workspace) {
      console.log("fetch");
      fetchLedgers();
    }
  },
  { immediate: true }
);
</script>
<template>
  <h1>SOLID</h1>
  <VBtn @click="login" v-if="!hasSolidSession">Login</VBtn>
  <div v-else class="text-xs">
    {{ profile.url }}
    {{ store }}
    <div>
      {{ ledgerList }}
    </div>
  </div>
</template>
