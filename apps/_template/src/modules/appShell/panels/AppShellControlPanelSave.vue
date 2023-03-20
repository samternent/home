<script setup lang="ts">
import { computed, shallowRef } from "vue";
import { useLedger } from "@/modules/ledger";
import { DownloadButton } from "@/modules/system";
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
      <DownloadButton
        :file-name="`${ledger?.id}.ledger`"
        :data="JSON.stringify(ledger, null, 2)"
      >
        <!-- <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg> -->
        <span class="ml-2">Download</span>
      </DownloadButton>
      <!-- <VBtn @click="saveCompressed">
        <span class="ml-2">Download compressed</span>
      </VBtn>
      <VBtn @click="saveCompressed">
        <span class="ml-2">Download Encrypted & compressed</span>
      </VBtn> -->
    </div>
  </div>
</template>
