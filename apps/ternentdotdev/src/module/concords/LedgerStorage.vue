<script setup>
import { computed, shallowRef, nextTick } from "vue";
import { encrypt } from "ternent-encrypt";
import { SButton } from "ternent-ui/components";
import { useLedger } from "../ledger/useLedger";

const { ledger, compressedBlob } = useLedger();

const ledgerFileName = computed(() => ledger.value.id.slice(0, 6));

async function download(filename, blob) {
  if (window.navigator.msSaveOrOpenBlob) {
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

function downloadLedger() {
  download(`${ledgerFileName.value}.ledger.json.gz`, compressedBlob.value);
}

function downloadJsonLedger() {
  download(
    `${ledgerFileName.value}.ledger.json`,
    new Blob([JSON.stringify(ledger.value)], { type: "application/json" })
  );
}

const encryptionKey = shallowRef("");
const encryptionLoading = shallowRef(false);

async function downloadEncryptedLedger() {
  if (!encryptionKey.value) {
    return;
  }

  encryptionLoading.value = true;

  await nextTick();

  try {
    const encrypted = await encrypt(
      encryptionKey.value,
      JSON.stringify(ledger.value)
    );

    const stream = new Blob([encrypted], {
      type: "application/gzip",
    }).stream();
    const compressedReadableStream = stream.pipeThrough(
      new CompressionStream("gzip")
    );
    const encryptedCompressionBlob = await new Response(
      compressedReadableStream
    ).blob();

    download(
      `${ledgerFileName.value}.ledger.json.age.gz`,
      encryptedCompressionBlob
    );
  } catch (e) {
    console.error(e);
  } finally {
    encryptionLoading.value = false;
  }
}
</script>
<template>
  <div class="flex flex-col flex-1 overflow-y-scroll">
    <div
      class="flex-1 mx-4 border-x border-base-300 flex flex-col bg-base-100 p-4 justify-between"
    >
      <p class="p-2 text-sm italic">{{ ledgerFileName }}.ledger.json</p>

      <div class="flex gap-2 text-xs my-6 w-full">
        <div class="flex flex-col flex-1 gap-2">
          <label
            >Encrypt with <a href="https://github.com/str4d/rage">age</a></label
          >
          <input
            v-model="encryptionKey"
            class="input input-sm w-full input-bordered"
            placeholder="Password or age public key"
          />
          <input
            v-model="encryptionKey"
            class="input input-sm w-full input-bordered"
            placeholder="Confirm password or age public key"
          />
        </div>
        <div class="flex flex-col justify-end">
          <SButton
            type="primary"
            :disabled="!encryptionKey"
            class="btn-outline btn-sm max-w-64 w-full"
            @click="downloadEncryptedLedger"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="size-4"
            >
              <path
                v-if="!encryptionKey"
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M13.5 10.5V6.75a4.5 4.5 0 1 1 9 0v3.75M3.75 21.75h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H3.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
              />
              <path
                v-else
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
              />
            </svg>

            <template v-if="encryptionLoading">encrypting...</template>
            <template v-else>Download .age.gz</template>
          </SButton>
        </div>
      </div>
      <div class="flex justify-end gap-2">
        <SButton
          type="primary"
          class="btn-outline btn-sm max-w-64"
          @click="downloadLedger"
          >Download .gz</SButton
        >
        <SButton
          type="primary"
          class="btn-outline btn-sm max-w-64"
          @click="downloadJsonLedger"
          >Download .json</SButton
        >
      </div>
    </div>
  </div>
</template>
