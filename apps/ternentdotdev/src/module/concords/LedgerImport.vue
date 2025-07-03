<script setup>
import { shallowRef, watch, defineProps } from "vue";
import { decrypt } from "concords-encrypt";
import { SButton } from "ternent-ui/components";
import { useLedger } from "../ledger/useLedger";
import { useSolid } from "../solid/useSolid";
import { decompressStream } from "../compress";

const props = defineProps({
  refreshTrigger: {
    type: Number,
    default: 0
  }
});

const { ledger, api } = useLedger();
const { hasSolidSession, webId, loadLedgerFromSolid, listLedgersFromSolid } = useSolid();

// Upload functionality
const fileInput = shallowRef();
const uploadMode = shallowRef("replace"); // "replace" or "merge"
const decryptionKey = shallowRef("");
const uploadLoading = shallowRef(false);
const uploadError = shallowRef("");
const uploadSuccess = shallowRef("");

// Solid sync functionality
const solidSyncLoading = shallowRef(false);
const solidSyncSuccess = shallowRef("");
const solidSyncError = shallowRef("");
const solidLedgerName = shallowRef("");
const availableLedgers = shallowRef([]);
const loadingLedgerList = shallowRef(false);

async function loadAvailableLedgers() {
  if (!hasSolidSession.value) return;
  
  loadingLedgerList.value = true;
  try {
    const ledgers = await listLedgersFromSolid();
    availableLedgers.value = ledgers;
    console.log(`Loaded ${ledgers.length} available ledgers from pod`);
  } catch (error) {
    // Don't log error for expected 404s (empty pod)
    if (!error.message?.includes('404') && !error.message?.includes('Not Found')) {
      console.error("Error loading ledger list:", error);
    }
    availableLedgers.value = [];
  } finally {
    loadingLedgerList.value = false;
  }
}

function selectLedger(filename) {
  solidLedgerName.value = filename;
}

// Auto-load ledgers when Solid session becomes available
watch(hasSolidSession, (isConnected) => {
  if (isConnected) {
    loadAvailableLedgers();
  } else {
    availableLedgers.value = [];
  }
}, { immediate: true });

// Refresh ledger list when triggered from parent (e.g., after export)
watch(() => props.refreshTrigger, (newValue, oldValue) => {
  if (newValue > oldValue && hasSolidSession.value) {
    console.log("Refreshing ledger list due to external trigger (export completed)");
    // Add a small delay to ensure the file is fully written to the pod
    setTimeout(() => {
      loadAvailableLedgers();
    }, 1000);
  }
});

async function syncFromSolid() {
  if (!solidLedgerName.value) {
    solidSyncError.value = "Please enter a ledger filename";
    return;
  }

  solidSyncLoading.value = true;
  solidSyncSuccess.value = "";
  solidSyncError.value = "";

  try {
    const filename = solidLedgerName.value.endsWith('.json') 
      ? solidLedgerName.value 
      : `${solidLedgerName.value}.ledger.json`;
    
    const ledgerData = await loadLedgerFromSolid(filename);
    
    if (uploadMode.value === "replace") {
      await api.load(ledgerData);
      solidSyncSuccess.value = `Ledger loaded from Solid pod: ${filename} (${ledgerData.records?.length || 0} records)`;
    } else {
      // Merge with current ledger
      const currentLedger = ledger.value;
      const mergedRecords = [
        ...(currentLedger.records || []),
        ...(ledgerData.records || [])
      ];

      const uniqueRecords = mergedRecords.filter((record, index, arr) => 
        arr.findIndex(r => r.hash === record.hash || r.id === record.id) === index
      );

      const mergedLedger = {
        ...currentLedger,
        records: uniqueRecords,
        nonce: Math.max(currentLedger.nonce || 0, ledgerData.nonce || 0)
      };

      await api.load(mergedLedger);
      solidSyncSuccess.value = `Ledger merged from Solid pod. Added ${uniqueRecords.length - (currentLedger.records?.length || 0)} new records`;
    }
  } catch (error) {
    console.error("Solid sync error:", error);
    solidSyncError.value = error.message || "Failed to load from Solid pod";
  } finally {
    solidSyncLoading.value = false;
  }
}

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

      <!-- Solid Pod Import Section -->
      <div v-if="hasSolidSession" class="mb-8">
        <div class="bg-base-50 rounded-lg p-6 border border-base-200">
          <div class="text-center mb-6">
            <div class="text-4xl mb-3">🌐</div>
            <h4 class="text-lg font-semibold mb-2">Load from Solid Pod</h4>
            <p class="text-sm text-base-content/60">Load a ledger file from your connected Solid pod</p>
          </div>
          
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">Ledger Filename</label>
              <input
                v-model="solidLedgerName"
                class="input input-bordered w-full"
                placeholder="e.g., ledger.json or my-project.ledger.json"
              />
              <div class="text-xs text-base-content/60 mt-1">
                Files are saved to your connected Solid pod
              </div>
            </div>

            <!-- Available Ledgers List -->
            <div>
              <div class="flex items-center justify-between mb-2">
                <label class="block text-sm font-medium">Available Ledgers</label>
                <button
                  @click="loadAvailableLedgers"
                  :disabled="loadingLedgerList"
                  class="btn btn-xs btn-outline"
                >
                  <svg v-if="loadingLedgerList" class="animate-spin size-3 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-3 mr-1">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                  </svg>
                  Refresh
                </button>
              </div>
              
              <div v-if="availableLedgers.length > 0" class="max-h-32 overflow-y-auto border border-base-200 rounded-lg">
                <div
                  v-for="ledger in availableLedgers"
                  :key="ledger.filename"
                  @click="selectLedger(ledger.filename)"
                  class="p-2 hover:bg-base-100 cursor-pointer border-b border-base-200 last:border-b-0 flex items-center justify-between"
                  :class="{ 'bg-primary/10': solidLedgerName === ledger.filename }"
                >
                  <div class="flex-1">
                    <div class="text-sm font-medium">{{ ledger.filename }}</div>
                    <div v-if="ledger.modified" class="text-xs text-base-content/60">
                      Modified: {{ new Date(ledger.modified).toLocaleDateString() }}
                    </div>
                  </div>
                  <div v-if="solidLedgerName === ledger.filename" class="text-primary">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-4">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                  </div>
                </div>
              </div>
              
              <div v-else-if="!loadingLedgerList" class="text-xs text-base-content/60 p-3 border border-base-200 rounded-lg bg-base-50">
                <div class="flex items-center gap-2 mb-1">
                  <span>💡</span>
                  <span class="font-medium">No ledgers found in your pod yet</span>
                </div>
                <div class="mb-2">This is normal for new pods. Export a ledger first from the Export tab to see it appear here.</div>
                <button
                  @click="loadAvailableLedgers"
                  class="btn btn-xs btn-outline w-full"
                >
                  🔄 Force Refresh List
                </button>
              </div>
            </div>
            
            <SButton
              type="accent"
              :disabled="!solidLedgerName || solidSyncLoading"
              class="w-full"
              @click="syncFromSolid"
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
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
                />
              </svg>
              <template v-if="solidSyncLoading">Loading from Pod...</template>
              <template v-else>Load from Solid Pod</template>
            </SButton>

            <!-- Debug helper for pod contents -->
            <div class="mt-3 p-3 bg-base-200 rounded-lg">
              <div class="text-xs text-base-content/70 mb-2 flex items-center gap-2">
                🔍 Can't find your files?
              </div>
              <div class="space-y-2">
                <div class="text-xs">
                  <strong>Connected pod:</strong>
                  <code class="text-xs bg-base-300 px-1 py-0.5 rounded ml-1">
                    {{ webId.split('/profile')[0] }}
                  </code>
                </div>
                <div class="text-xs text-base-content/60">
                  Files will be saved/loaded from your connected Solid pod
                </div>
                <details class="text-xs">
                  <summary class="cursor-pointer text-primary hover:text-primary-focus">Show troubleshooting tips</summary>
                  <div class="mt-2 space-y-1 text-base-content/60 pl-2 border-l-2 border-base-300">
                    <div>• Check that you've exported a ledger first via the Export tab</div>
                    <div>• Ensure the filename matches exactly (case-sensitive)</div>
                    <div>• Try accessing your pod directly at: <code>{{ webId.split('/profile')[0] }}</code></div>
                    <div>• Different pod providers may store files in different locations</div>
                  </div>
                </details>
              </div>
            </div>
            
            <div v-if="solidSyncSuccess" class="alert alert-success">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span class="text-sm">{{ solidSyncSuccess }}</span>
            </div>
            
            <div v-else-if="solidSyncError" class="alert alert-error">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span class="text-sm">{{ solidSyncError }}</span>
            </div>
          </div>
        </div>
        
        <div class="divider">OR</div>
      </div>
      
      <div v-else>
        <div class="alert alert-info mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <div class="text-sm">
            <div class="font-medium">Solid Pod Sync Available</div>
            <div class="mt-1">
              <router-link to="/solid" class="link">Connect to your Solid pod</router-link> 
              to enable loading ledgers from your personal data pod.
            </div>
          </div>
        </div>
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
