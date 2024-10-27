<script setup>
import { computed } from "vue";
import { useLedger } from "../ledger/useLedger";
import { SButton } from "ternent-ui/components";

const { ledger, compressedBlob } = useLedger();

const ledgerFileName = computed(
  () => `${ledger.value.id.slice(0, 6)}.ledger.json.gz`
);
async function downloadLedger() {
  if (window.navigator.msSaveOrOpenBlob) {
    window.navigator.msSaveBlob(compressedBlob.value, ledgerFileName.value);
  } else {
    const elem = window.document.createElement("a");
    elem.href = window.URL.createObjectURL(compressedBlob.value);
    elem.download = ledgerFileName.value;
    document.body.appendChild(elem);
    elem.click();
    document.body.removeChild(elem);
  }
}

async function encryptLedger() {
  const encrypted = await encrypt(
    permission.data.public || permission.data.encryption,
    JSON.stringify({ ...data, id: generateId() })
  );
}
</script>
<template>
  <div class="flex flex-col flex-1 overflow-y-scroll">
    <div
      class="flex-1 mx-4 border-x border-base-300 flex flex-col bg-base-100 p-4"
    >
      <p class="p-2 text-sm italic">{{ ledgerFileName }}</p>
      <SButton
        type="primary"
        class="btn-outline btn-sm max-w-64"
        @click="downloadLedger"
        >Download</SButton
      >
    </div>
  </div>
</template>
