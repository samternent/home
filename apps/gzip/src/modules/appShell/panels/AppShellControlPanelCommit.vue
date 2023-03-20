<script setup lang="ts">
import { computed, shallowRef } from "vue";
import { useLedger } from "@/modules/ledger";

const { ledger, api } = useLedger();

const commitMessage = shallowRef("");

async function squashCommit() {
  await api.commit(commitMessage.value);
  commitMessage.value = "";
}

const records = computed(() => {
  return ledger.value?.pending_records || [];
});
</script>
<template>
  <div class="flex-1 flex flex-col overflow-y-auto p-4">
    <div class="mb-4">Commit {{ records.length }} change(s)</div>
    <VTextField
      v-model="commitMessage"
      class="mt-2 rounded"
      placeholder="Commit message..."
    />
    <div class="flex justify-end mt-4">
      <VBtn @click="squashCommit" :disabled="!records.length"> Commit </VBtn>
    </div>
  </div>
</template>
