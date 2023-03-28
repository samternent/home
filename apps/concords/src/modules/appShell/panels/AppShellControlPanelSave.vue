<script setup lang="ts">
import { computed, shallowRef } from "vue";
import { useLedger } from "@/modules/ledger";
import { compress, decompress } from "@/utils/compress";

const { ledger, api } = useLedger();

const commitMessage = shallowRef("");

async function squashCommit() {
  await api.commit(commitMessage.value);
  commitMessage.value = "";
}

const records = computed(() => {
  return ledger.value?.pending_records || [];
});

async function saveCompressed() {
  const filename = `${ledger.value.id}.concord.json.gz`;
  const { blob } = await compress(ledger.value);
  if (window.navigator?.msSaveOrOpenBlob) {
    window.navigator.msSaveBlob(blob, filename);
  } else {
    const elem = window.document.createElement("a");
    elem.href = window.URL.createObjectURL(blob);
    elem.download = filename;
    document.body.appendChild(elem);
    elem.click();
    document.body.removeChild(elem);
  }
}

async function saveEncryptCompressed() {
  const filename = ledger.value.id;
  const { blob } = await compress(ledger.value);
  if (window.navigator?.msSaveOrOpenBlob) {
    window.navigator.msSaveBlob(blob, filename);
  } else {
    const elem = window.document.createElement("a");
    elem.href = window.URL.createObjectURL(blob);
    elem.download = filename;
    document.body.appendChild(elem);
    elem.click();
    document.body.removeChild(elem);
  }
}
</script>
<template>
  <div class="flex-1 flex flex-col p-4">
    <div class="flex mt-4">
      <VBtn @click="saveCompressed">
        <span class="ml-2">Download</span>
      </VBtn>
      <!-- <VBtn @click="saveCompressed">
        <span class="ml-2">Download Encrypted & compressed</span>
      </VBtn> -->
    </div>
  </div>
</template>
