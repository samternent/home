<script setup>
import { useLocalStorage } from "@vueuse/core";
import { useLedger } from "../ledger/useLedger";
import { SButton } from "ternent-ui/components";

const { ledger, api } = useLedger();

const commitMessage = useLocalStorage(
  "ternentdotdev/LedgerCommit/commitMessage",
  ""
);
async function commit() {
  await api.commit(commitMessage.value);
  commitMessage.value = null;
}
</script>
<template>
  <div class="flex flex-col flex-1 overflow-y-scroll">
    <div
      class="flex-1 mx-4 border-x border-base-300 flex flex-col bg-base-100"
    ></div>
  </div>
</template>
