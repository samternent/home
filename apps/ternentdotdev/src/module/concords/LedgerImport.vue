<script setup>
import { shallowRef } from "vue";
import { decrypt } from "concords-encrypt";
import { SButton } from "ternent-ui/components";
import { useLedger } from "../ledger/useLedger";
import { decompressStream } from "../compress";

const { ledger, api } = useLedger();

// Upload functionality
const fileInput = shallowRef();
const uploadMode = shallowRef("replace"); // "replace" or "merge"
const decryptionKey = shallowRef("");
const uploadLoading = shallowRef(false);
const uploadError = shallowRef("");
const uploadSuccess = shallowRef("");

function triggerFileUpload() {
  fileInput.value?.click();
}

async function handleFileUpload(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  uploadLoading.value = true;
  uploadError.value = "";
  uploadSuccess.value = "";

  try {
    let ledgerData;
    const fileName = file.name.toLowerCase();

    if (fileName.endsWith('.age.gz')) {
      // Encrypted and compressed file
      if (!decryptionKey.value) {
        throw new Error("Decryption key required for .age.gz files");
      }

      // First decompress using your compress module
      const compressedData = await file.arrayBuffer();
      const stream = new Response(compressedData).body;
      const decompressedResponse = await decompressStream(stream);
      const decompressedData = await decompressedResponse.text();

      // Then decrypt
      const decryptedData = await decrypt(decryptionKey.value, decompressedData);
      ledgerData = JSON.parse(decryptedData);
    } else if (fileName.endsWith('.gz')) {
      // Compressed JSON file using your compress module
      const compressedData = await file.arrayBuffer();
      const stream = new Response(compressedData).body;
      const decompressedResponse = await decompressStream(stream);
      ledgerData = JSON.parse(await decompressedResponse.text());
    } else if (fileName.endsWith('.json')) {
      // Plain JSON file
      const jsonData = await file.text();
      ledgerData = JSON.parse(jsonData);
    } else {
      throw new Error("Unsupported file format. Please upload .json, .gz, or .age.gz files");
    }

    // Validate ledger structure
    if (!ledgerData || typeof ledgerData !== 'object' || !ledgerData.id) {
      throw new Error("Invalid ledger format. Missing required ledger structure");
    }

    if (uploadMode.value === "replace") {
      // Replace current ledger
      await api.load(ledgerData);
      uploadSuccess.value = `Ledger replaced successfully with ${ledgerData.records?.length || 0} records`;
    } else {
      // Merge with current ledger
      const currentLedger = ledger.value;
      
      // Create a merged ledger with records from both
      const mergedRecords = [
        ...(currentLedger.records || []),
        ...(ledgerData.records || [])
      ];

      // Remove duplicates based on record hash or id
      const uniqueRecords = mergedRecords.filter((record, index, arr) => 
        arr.findIndex(r => r.hash === record.hash || r.id === record.id) === index
      );

      const mergedLedger = {
        ...currentLedger,
        records: uniqueRecords,
        nonce: Math.max(currentLedger.nonce || 0, ledgerData.nonce || 0)
      };

      await api.load(mergedLedger);
      uploadSuccess.value = `Ledger merged successfully. Added ${uniqueRecords.length - (currentLedger.records?.length || 0)} new records`;
    }

    // Clear the file input
    if (fileInput.value) {
      fileInput.value.value = "";
    }

  } catch (error) {
    console.error("Upload error:", error);
    uploadError.value = error.message || "Failed to upload ledger file";
  } finally {
    uploadLoading.value = false;
  }
}
</script>

<template>
  <div class="flex flex-col flex-1 overflow-y-scroll">
    <div class="flex-1 mx-4 border-x border-base-300 flex flex-col bg-base-100 p-6">
      <div class="text-center mb-6">
        <h3 class="text-lg font-semibold mb-2">📤 Import Ledger</h3>
        <p class="text-sm text-base-content/70">Upload and merge ledger files from other sources</p>
      </div>
      
      <!-- File input (hidden) -->
      <input
        ref="fileInput"
        type="file"
        accept=".json,.gz,.age.gz"
        class="hidden"
        @change="handleFileUpload"
      />

      <!-- Upload options -->
      <div class="space-y-6">
        <div>
          <label class="block text-sm font-medium mb-3">Import Mode</label>
          <div class="flex gap-6">
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                v-model="uploadMode"
                type="radio"
                value="replace"
                class="radio radio-primary"
              />
              <div>
                <div class="font-medium">Replace</div>
                <div class="text-xs text-base-content/60">Replace current ledger entirely</div>
              </div>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                v-model="uploadMode"
                type="radio"
                value="merge"
                class="radio radio-primary"
              />
              <div>
                <div class="font-medium">Merge</div>
                <div class="text-xs text-base-content/60">Combine with existing records</div>
              </div>
            </label>
          </div>
        </div>

        <!-- Decryption key for encrypted files -->
        <div>
          <label class="block text-sm font-medium mb-2">
            Decryption Key
          </label>
          <input
            v-model="decryptionKey"
            class="input input-bordered w-full"
            placeholder="Required for encrypted .age.gz files"
          />
          <div class="text-xs text-base-content/60 mt-1">
            Leave empty for unencrypted .json and .gz files
          </div>
        </div>

        <!-- Upload button and status -->
        <div class="space-y-4">
          <SButton
            type="primary"
            class="w-full"
            :disabled="uploadLoading"
            @click="triggerFileUpload"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="size-5 mr-2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
              />
            </svg>
            <template v-if="uploadLoading">Importing...</template>
            <template v-else>Select File to Import</template>
          </SButton>
          
          <div class="text-sm">
            <div v-if="uploadSuccess" class="alert alert-success">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span>{{ uploadSuccess }}</span>
            </div>
            <div v-else-if="uploadError" class="alert alert-error">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span>{{ uploadError }}</span>
            </div>
            <div v-else class="alert alert-info">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <div>
                <div class="font-medium">Supported file formats:</div>
                <ul class="text-xs mt-1 space-y-1">
                  <li>• <code>.json</code> - Plain JSON ledger files</li>
                  <li>• <code>.gz</code> - Compressed JSON ledger files</li>
                  <li>• <code>.age.gz</code> - Encrypted and compressed ledger files</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
