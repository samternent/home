<script setup lang="ts">
import { computed, shallowRef } from "vue";
import { useLedger } from "@/modules/ledger";
import { useSolid } from "@/modules/solid";
import { compress, decompress } from "@/utils/compress";
import { useToast } from "vue-toastification";
const toast = useToast();

const { ledger, api } = useLedger();
const { write, hasSolidSession } = useSolid();

const commitMessage = shallowRef("");

async function squashCommit() {
  await api.commit(commitMessage.value);
  commitMessage.value = "";
}

const records = computed(() => {
  return ledger.value?.pending_records || [];
});

async function saveCompressed() {
  const filename = `${ledger.value.id}.ledger.json.gz`;
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

async function saveSolid() {
  try {
    await write(
      `${ledger.value.id}.ledger.json`,
      "ledger",
      JSON.stringify(ledger.value)
    );
    toast.success(
      `Successfully saved ${ledger.value.id}.ledger.json to Solid Pod.`,
      {
        position: "bottom-right",
        timeout: 1000,
        closeOnClick: true,
        pauseOnFocusLoss: false,
        pauseOnHover: true,
        draggable: true,
        draggablePercent: 0.6,
        showCloseButtonOnHover: true,
        hideProgressBar: true,
        closeButton: "button",
        icon: true,
        rtl: false,
      }
    );
  } catch (e) {
    toast.error("Whoops, something went wrong.", {
      position: "bottom-right",
      timeout: 5000,
      closeOnClick: true,
      pauseOnFocusLoss: false,
      pauseOnHover: true,
      draggable: true,
      draggablePercent: 0.6,
      showCloseButtonOnHover: true,
      hideProgressBar: true,
      closeButton: "button",
      icon: true,
      rtl: false,
    });
  }
}
</script>
<template>
  <div class="flex-1 flex flex-col p-4">
    <div class="flex mt-4">
      <VBtn @click="saveCompressed" class="mx-1" variant="flat">
        <span class="ml-2">Download</span>
      </VBtn>
      <VBtn
        @click="saveSolid"
        v-if="hasSolidSession"
        class="mx-1"
        variant="outlined"
      >
        <span class="ml-2">Save to Solid Pod</span>
      </VBtn>
    </div>
  </div>
</template>
