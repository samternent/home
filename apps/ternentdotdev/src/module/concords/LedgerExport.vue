<script setup>
import { computed, shallowRef, nextTick } from "vue";
import { encrypt } from "concords-encrypt";
import { SButton } from "ternent-ui/components";
import { useLedger } from "../ledger/useLedger";
import { compressStream } from "../compress";

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

    // Use your compress module for consistency
    const stream = new Blob([encrypted], {
      type: "application/gzip",
    }).stream();
    const compressedResponse = await compressStream(stream);
    const encryptedCompressionBlob = await compressedResponse.blob();

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
    <div class="flex-1 mx-4 border-x border-base-300 flex flex-col bg-base-100 p-6">
      <div class="text-center mb-6">
        <h3 class="text-lg font-semibold mb-2">📥 Export Ledger</h3>
        <p class="text-sm text-base-content/70">Download your ledger in various formats for sharing or backup</p>
      </div>

      <div class="space-y-6">
        <!-- Current ledger info -->
        <div class="card bg-base-200">
          <div class="card-body p-4">
            <div class="flex items-center justify-between">
              <div>
                <div class="font-medium">{{ ledgerFileName }}.ledger.json</div>
                <div class="text-sm text-base-content/60">
                  {{ ledger.records?.length || 0 }} records
                </div>
              </div>
              <div class="badge badge-outline">
                ID: {{ ledger.id?.slice(0, 8) }}...
              </div>
            </div>
          </div>
        </div>

        <!-- Quick download options -->
        <div>
          <label class="block text-sm font-medium mb-3">Quick Download</label>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <SButton
              type="primary"
              class="btn-outline flex items-center justify-center"
              @click="downloadJsonLedger"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-4 mr-2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Download JSON
            </SButton>
            <SButton
              type="primary"
              class="btn-outline flex items-center justify-center"
              @click="downloadLedger"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-4 mr-2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Download Compressed
            </SButton>
          </div>
        </div>

        <!-- Encrypted download -->
        <div>
          <label class="block text-sm font-medium mb-3">
            Encrypted Download
            <span class="text-xs font-normal text-base-content/60 ml-2">
              (using <a href="https://github.com/str4d/rage" class="link">age</a> encryption)
            </span>
          </label>
          
          <div class="space-y-3">
            <div>
              <input
                v-model="encryptionKey"
                class="input input-bordered w-full"
                placeholder="Password or age public key"
              />
            </div>
            <div>
              <input
                v-model="encryptionKey"
                class="input input-bordered w-full"
                placeholder="Confirm password or age public key"
              />
            </div>
            <SButton
              type="primary"
              :disabled="!encryptionKey || encryptionLoading"
              class="w-full"
              @click="downloadEncryptedLedger"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                class="size-4 mr-2"
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

              <template v-if="encryptionLoading">Encrypting...</template>
              <template v-else>Download Encrypted</template>
            </SButton>
          </div>
        </div>

        <!-- Info section -->
        <div class="alert alert-info">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <div class="text-sm">
            <div class="font-medium mb-1">Export Options:</div>
            <ul class="text-xs space-y-1">
              <li>• <strong>JSON:</strong> Human-readable format, larger file size</li>
              <li>• <strong>Compressed:</strong> Smaller file size, good for sharing</li>
              <li>• <strong>Encrypted:</strong> Password/key protected, secure sharing</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
