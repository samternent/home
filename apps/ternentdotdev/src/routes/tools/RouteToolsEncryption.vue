<script setup>
import { ref, computed, onMounted } from 'vue';
import { useBreadcrumbs } from "@/module/breadcrumbs/useBreadcrumbs";
import { generate, encrypt, decrypt } from 'concords-encrypt';
import { SResizablePanels, SCard, SButton, STabs } from 'ternent-ui';

useBreadcrumbs({
  path: "/tools/encryption",
  name: "Encryption",
});

// State
const activeTab = ref('encrypt');
const encryptionMethod = ref('passphrase'); // 'passphrase' or 'publickey'

// Input fields
const inputText = ref('');
const passphrase = ref('');
const publicKey = ref('');
const privateKey = ref('');
const encryptedData = ref('');
const decryptSecret = ref('');

// Output
const result = ref('');
const isLoading = ref(false);
const error = ref('');

onMounted(async () => {
  console.log('Encryption tool mounted');
  console.log('Available functions:', { generate, encrypt, decrypt });
});

// Computed
const canEncrypt = computed(() => {
  if (!inputText.value.trim()) return false;
  if (encryptionMethod.value === 'passphrase') {
    return passphrase.value.trim() !== '';
  } else {
    return publicKey.value.trim() !== '';
  }
});

const canDecrypt = computed(() => {
  return encryptedData.value.trim() !== '' && decryptSecret.value.trim() !== '';
});

const canGenerate = computed(() => !isLoading.value);

// Methods
async function generateKeyPair() {
  try {
    isLoading.value = true;
    error.value = '';
    
    const keys = await generate();
    
    if (!keys || !Array.isArray(keys) || keys.length !== 2) {
      throw new Error('Invalid key generation result');
    }
    
    privateKey.value = keys[0];
    publicKey.value = keys[1];
    result.value = `🎉 Generated new key pair successfully!\n\n🔑 Private Key:\n${keys[0]}\n\n🔓 Public Key:\n${keys[1]}`;
  } catch (err) {
    error.value = `Key generation failed: ${err.message}`;
    console.error('Key generation error:', err);
  } finally {
    isLoading.value = false;
  }
}

function useGeneratedKey() {
  activeTab.value = 'encrypt';
  encryptionMethod.value = 'publickey';
}

function useGeneratedKeyForDecrypt() {
  activeTab.value = 'decrypt';
  decryptSecret.value = privateKey.value;
}

async function performEncryption() {
  try {
    isLoading.value = true;
    error.value = '';
    
    const secret = encryptionMethod.value === 'passphrase' ? passphrase.value : publicKey.value;
    const encrypted = await encrypt(secret, inputText.value);
    
    result.value = encrypted;
  } catch (err) {
    error.value = `Encryption failed: ${err.message}`;
  } finally {
    isLoading.value = false;
  }
}

async function performDecryption() {
  try {
    isLoading.value = true;
    error.value = '';
    
    const decrypted = await decrypt(decryptSecret.value, encryptedData.value);
    
    result.value = decrypted;
  } catch (err) {
    error.value = `Decryption failed: ${err.message}`;
  } finally {
    isLoading.value = false;
  }
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    // Success - could add a toast notification here
    console.log('Copied to clipboard');
  }).catch(err => {
    console.error('Failed to copy: ', err);
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
  });
}

function clearAll() {
  inputText.value = '';
  passphrase.value = '';
  publicKey.value = '';
  privateKey.value = '';
  encryptedData.value = '';
  decryptSecret.value = '';
  result.value = '';
  error.value = '';
}

// Tab configuration
const tabs = [
  { 
    id: 'encrypt', 
    label: '🔒 Encrypt', 
    icon: '🔒',
    description: 'Encrypt your sensitive data'
  },
  { 
    id: 'decrypt', 
    label: '🔓 Decrypt', 
    icon: '🔓',
    description: 'Decrypt encrypted data'
  },
  { 
    id: 'keygen', 
    label: '🗝️ Generate', 
    icon: '🗝️',
    description: 'Generate new key pairs'
  }
];
</script>

<template>
  <div class="flex w-full h-full flex-1 bg-gradient-to-br from-base-100 to-base-200">
    <SResizablePanels 
      identifier="encryption-tool" 
      :min-content-width="400" 
      :min-sidebar-width="400"
      class="w-full h-full"
    >
      <!-- Main Panel (Left) -->
      <template #default>
        <div class="flex flex-col h-full">
          <!-- Header -->
          <div class="p-6 bg-gradient-to-r from-primary/10 to-accent/10 border-b border-base-300">
            <div class="max-w-2xl">
              <h1 class="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                🔐 Age Encryption
              </h1>
              <p class="text-base-content/70 mt-2">
                Secure, modern encryption using the age format with X25519 and ChaCha20-Poly1305
              </p>
              <div class="flex gap-2 mt-4">
                <div class="badge badge-primary badge-sm">🚀 Async WASM</div>
                <div class="badge badge-accent badge-sm">🛡️ Local Processing</div>
                <div class="badge badge-secondary badge-sm">🔑 X25519</div>
              </div>
            </div>
          </div>

          <!-- Tabs -->
          <div class="p-6 border-b border-base-300">
            <div class="flex gap-2">
              <button
                v-for="tab in tabs"
                :key="tab.id"
                @click="activeTab = tab.id"
                class="btn btn-ghost"
                :class="{
                  'btn-active bg-primary/20 border-primary/30': activeTab === tab.id,
                  'hover:bg-base-200': activeTab !== tab.id
                }"
              >
                <span class="text-lg">{{ tab.icon }}</span>
                <span>{{ tab.label.split(' ')[1] }}</span>
              </button>
              <div class="ml-auto">
                <button 
                  class="btn btn-outline btn-sm"
                  @click="clearAll"
                >
                  ✨ Clear All
                </button>
              </div>
            </div>
          </div>

          <!-- Content Area -->
          <div class="flex-1 p-6 overflow-auto">
            <!-- Encrypt Tab -->
            <div v-if="activeTab === 'encrypt'" class="space-y-6 max-w-2xl">
              <div class="space-y-4">
                <h3 class="text-lg font-semibold flex items-center gap-2">
                  🔒 <span>Encrypt Your Data</span>
                </h3>
                
                <!-- Encryption Method -->
                <SCard variant="bordered" size="small">
                  <div class="p-4">
                    <label class="text-sm font-medium text-base-content/80 mb-3 block">
                      Choose Encryption Method
                    </label>
                    <div class="flex gap-4">
                      <label class="label cursor-pointer gap-3 p-3 rounded-lg border border-base-300 hover:bg-base-50 transition-colors flex-1">
                        <input 
                          type="radio" 
                          class="radio radio-primary"
                          value="passphrase"
                          v-model="encryptionMethod"
                        />
                        <div class="flex flex-col">
                          <span class="label-text font-medium">🔑 Passphrase</span>
                          <span class="text-xs text-base-content/60">Simple password-based encryption</span>
                        </div>
                      </label>
                      <label class="label cursor-pointer gap-3 p-3 rounded-lg border border-base-300 hover:bg-base-50 transition-colors flex-1">
                        <input 
                          type="radio" 
                          class="radio radio-primary"
                          value="publickey"
                          v-model="encryptionMethod"
                        />
                        <div class="flex flex-col">
                          <span class="label-text font-medium">🗝️ Public Key</span>
                          <span class="text-xs text-base-content/60">Advanced key-based encryption</span>
                        </div>
                      </label>
                    </div>
                  </div>
                </SCard>

                <!-- Secret Input -->
                <SCard variant="bordered" size="small">
                  <div class="p-4">
                    <div v-if="encryptionMethod === 'passphrase'">
                      <label class="text-sm font-medium text-base-content/80 mb-2 block">
                        Enter Passphrase
                      </label>
                      <input 
                        type="password" 
                        class="input input-bordered w-full"
                        v-model="passphrase"
                        placeholder="Enter a strong passphrase..."
                      />
                    </div>
                    <div v-else>
                      <div class="flex items-center justify-between mb-2">
                        <label class="text-sm font-medium text-base-content/80">
                          Public Key
                        </label>
                        <div v-if="publicKey && publicKey.startsWith('age1')" class="badge badge-success badge-sm">
                          ✓ Valid Key
                        </div>
                      </div>
                      <textarea 
                        class="textarea textarea-bordered w-full h-20 font-mono text-sm"
                        v-model="publicKey"
                        placeholder="age1..."
                      ></textarea>
                    </div>
                  </div>
                </SCard>

                <!-- Message Input -->
                <SCard variant="bordered" size="small">
                  <div class="p-4">
                    <label class="text-sm font-medium text-base-content/80 mb-2 block">
                      Message to Encrypt
                    </label>
                    <textarea 
                      class="textarea textarea-bordered w-full h-32"
                      v-model="inputText"
                      placeholder="Enter your sensitive message here..."
                    ></textarea>
                    <div class="text-xs text-base-content/60 mt-2">
                      {{ inputText.length }} characters
                    </div>
                  </div>
                </SCard>

                <!-- Action Button -->
                <SButton
                  :loading="isLoading"
                  :disabled="!canEncrypt || isLoading"
                  @click="performEncryption"
                  class="w-full"
                  size="large"
                  variant="primary"
                >
                  🔒 Encrypt Message
                </SButton>
              </div>
            </div>

            <!-- Decrypt Tab -->
            <div v-if="activeTab === 'decrypt'" class="space-y-6 max-w-2xl">
              <div class="space-y-4">
                <h3 class="text-lg font-semibold flex items-center gap-2">
                  🔓 <span>Decrypt Your Data</span>
                </h3>
                
                <SCard variant="bordered" size="small">
                  <div class="p-4">
                    <div class="flex items-center justify-between mb-2">
                      <label class="text-sm font-medium text-base-content/80">
                        Secret (Passphrase or Private Key)
                      </label>
                      <div v-if="decryptSecret && decryptSecret.startsWith('AGE-SECRET-KEY-')" class="badge badge-success badge-sm">
                        ✓ Private Key
                      </div>
                    </div>
                    <textarea 
                      class="textarea textarea-bordered w-full h-20 font-mono text-sm"
                      v-model="decryptSecret"
                      placeholder="Enter passphrase or private key (AGE-SECRET-KEY-...)..."
                    ></textarea>
                  </div>
                </SCard>

                <SCard variant="bordered" size="small">
                  <div class="p-4">
                    <label class="text-sm font-medium text-base-content/80 mb-2 block">
                      Encrypted Data
                    </label>
                    <textarea 
                      class="textarea textarea-bordered w-full h-32 font-mono text-sm"
                      v-model="encryptedData"
                      placeholder="Paste encrypted age data here..."
                    ></textarea>
                    <div class="text-xs text-base-content/60 mt-2">
                      {{ encryptedData.length }} characters
                    </div>
                  </div>
                </SCard>

                <SButton
                  :loading="isLoading"
                  :disabled="!canDecrypt || isLoading"
                  @click="performDecryption"
                  class="w-full"
                  size="large"
                  variant="secondary"
                >
                  🔓 Decrypt Message
                </SButton>
              </div>
            </div>

            <!-- Key Generation Tab -->
            <div v-if="activeTab === 'keygen'" class="space-y-6 max-w-2xl">
              <div class="text-center space-y-4">
                <h3 class="text-lg font-semibold flex items-center justify-center gap-2">
                  🗝️ <span>Generate Key Pair</span>
                </h3>
                <p class="text-base-content/70">
                  Generate a new X25519 key pair for age encryption. Your private key should be kept secure!
                </p>
                
                <SButton
                  :loading="isLoading"
                  :disabled="!canGenerate"
                  @click="generateKeyPair"
                  class="w-full max-w-md"
                  size="large"
                  variant="accent"
                >
                  🎲 Generate New Key Pair
                </SButton>

                <div v-if="privateKey && publicKey" class="space-y-4 mt-8">
                  <SCard variant="bordered" size="small">
                    <div class="p-4">
                      <div class="flex items-center justify-between mb-2">
                        <label class="text-sm font-medium text-base-content/80">
                          🔑 Private Key (Keep Secret!)
                        </label>
                        <button 
                          class="btn btn-outline btn-xs"
                          @click="copyToClipboard(privateKey)"
                        >
                          📋 Copy
                        </button>
                      </div>
                      <textarea 
                        class="textarea textarea-bordered w-full h-20 font-mono text-sm"
                        v-model="privateKey"
                        readonly
                      ></textarea>
                    </div>
                  </SCard>

                  <SCard variant="bordered" size="small">
                    <div class="p-4">
                      <div class="flex items-center justify-between mb-2">
                        <label class="text-sm font-medium text-base-content/80">
                          🔓 Public Key (Safe to Share)
                        </label>
                        <button 
                          class="btn btn-outline btn-xs"
                          @click="copyToClipboard(publicKey)"
                        >
                          📋 Copy
                        </button>
                      </div>
                      <textarea 
                        class="textarea textarea-bordered w-full h-20 font-mono text-sm"
                        v-model="publicKey"
                        readonly
                      ></textarea>
                    </div>
                  </SCard>

                  <div class="flex gap-2 justify-center">
                    <SButton
                      @click="useGeneratedKey"
                      variant="primary"
                      size="small"
                    >
                      🔒 Use for Encryption
                    </SButton>
                    <SButton
                      @click="useGeneratedKeyForDecrypt"
                      variant="secondary"
                      size="small"
                    >
                      🔓 Use for Decryption
                    </SButton>
                  </div>

                  <div class="alert alert-warning">
                    <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.98-.833-2.75 0L3.982 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
                    <span>Store your private key securely! It cannot be recovered if lost.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- Results Panel (Right) -->
      <template #sidebar>
        <div class="flex flex-col h-full bg-base-50">
          <!-- Results Header -->
          <div class="p-6 bg-gradient-to-r from-accent/10 to-secondary/10 border-b border-base-300">
            <div class="flex items-center justify-between">
              <div>
                <h2 class="text-xl font-semibold">📋 Results</h2>
                <p class="text-sm text-base-content/70">Output and status information</p>
              </div>
              <button 
                v-if="result"
                class="btn btn-outline btn-sm"
                @click="copyToClipboard(result)"
              >
                📋 Copy Result
              </button>
            </div>
          </div>

          <!-- Results Content -->
          <div class="flex-1 p-6 overflow-auto">
            <div class="space-y-4">
              <!-- Success Result -->
              <div v-if="result && !error" class="space-y-3">
                <div class="flex items-center gap-2 text-success">
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                  </svg>
                  <span class="font-medium">Operation Successful</span>
                </div>
                <SCard variant="bordered" size="small">
                  <div class="p-4">
                    <textarea 
                      class="textarea textarea-bordered w-full h-64 font-mono text-sm"
                      v-model="result"
                      readonly
                      placeholder="Results will appear here..."
                    ></textarea>
                    <div class="text-xs text-base-content/60 mt-2">
                      {{ result.length }} characters
                    </div>
                  </div>
                </SCard>
              </div>

              <!-- Error State -->
              <div v-if="error" class="space-y-3">
                <div class="flex items-center gap-2 text-error">
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                  </svg>
                  <span class="font-medium">Error Occurred</span>
                </div>
                <div class="alert alert-error">
                  <span>{{ error }}</span>
                </div>
              </div>

              <!-- Loading State -->
              <div v-if="isLoading" class="space-y-3">
                <div class="flex items-center gap-2 text-primary">
                  <span class="loading loading-spinner loading-sm"></span>
                  <span class="font-medium">Processing...</span>
                </div>
                <div class="alert alert-info">
                  <span>Your request is being processed securely in your browser.</span>
                </div>
              </div>

              <!-- Empty State -->
              <div v-if="!result && !error && !isLoading" class="text-center py-12">
                <div class="text-6xl mb-4">🔐</div>
                <h3 class="text-lg font-semibold mb-2">Ready to Encrypt</h3>
                <p class="text-base-content/70">
                  Choose an operation from the left panel to get started
                </p>
              </div>

              <!-- Info Cards -->
              <div class="mt-8 space-y-3">
                <SCard variant="glass" size="nano">
                  <div class="p-3">
                    <div class="flex items-center gap-2 text-sm">
                      <span class="text-primary">🛡️</span>
                      <span><strong>Privacy:</strong> All processing happens locally</span>
                    </div>
                  </div>
                </SCard>
                <SCard variant="glass" size="nano">
                  <div class="p-3">
                    <div class="flex items-center gap-2 text-sm">
                      <span class="text-accent">⚡</span>
                      <span><strong>Performance:</strong> Powered by Rust WebAssembly</span>
                    </div>
                  </div>
                </SCard>
                <SCard variant="glass" size="nano">
                  <div class="p-3">
                    <div class="flex items-center gap-2 text-sm">
                      <span class="text-secondary">🔒</span>
                      <span><strong>Security:</strong> Modern age encryption format</span>
                    </div>
                  </div>
                </SCard>
              </div>
            </div>
          </div>
        </div>
      </template>
    </SResizablePanels>
  </div>
</template>
