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
    <div class="flex-1 mx-4 border-x border-base-300 flex flex-col bg-base-100">
      <textarea
        v-model="commitMessage"
        class="textarea textarea-bordered flex-1 resize-none mx-4 mt-4 p-4 border border-base-300 bg-base-200 text-content-base-100 placeholder-content-base-300"
        placeholder="Commit message..."
      />
      <div class="flex w-full justify-end p-4">
        <SButton
          class="btn-sm !font-thin"
          @click="commit"
          :disabled="!ledger.pending_records.length || !commitMessage"
          type="primary"
        >
          Commit {{ ledger.pending_records.length }} records
        </SButton>
      </div>
    </div>
  </div>
</template>
