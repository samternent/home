<script setup>
import { shallowRef } from "vue";
import { useIdentity } from "@/module/identity/useIdentity";
import { useEncryption } from "@/module/encryption/useEncryption";
import IdentityAvatar from "@/module/identity/IdentityAvatar.vue";
import { useBreadcrumbs } from "@/module/breadcrumbs/useBreadcrumbs";
import { SButton } from "ternent-ui/components";

const { publicKeyPEM, privateKeyPEM } = useIdentity();
const { publicKey, privateKey } = useEncryption();

// Export functionality
const exportData = shallowRef("");
const exportSuccess = shallowRef("");
const includePrivateKeys = shallowRef(false);

// Export identity and keys
function exportIdentity() {
  try {
    // Extract raw string values from Vue refs (useLocalStorage returns refs)
    const identityPublicKey = publicKeyPEM.value;
    const identityPrivateKey = privateKeyPEM.value;
    const encryptionPublicKey = publicKey.value;
    const encryptionPrivateKey = privateKey.value;
    
    // Build clean data object with raw strings only
    const data = {
      identity: {
        publicKey: identityPublicKey,
        ...(includePrivateKeys.value && identityPrivateKey && { 
          privateKey: identityPrivateKey 
        })
      },
      encryption: {
        publicKey: encryptionPublicKey,
        ...(includePrivateKeys.value && encryptionPrivateKey && { 
          privateKey: encryptionPrivateKey 
        })
      },
      metadata: {
        exportedAt: new Date().toISOString(),
        version: "1.0",
        type: "concords-identity-backup"
      }
    };
    
    // Double-check we have clean data (no Vue reactivity)
    const cleanData = JSON.parse(JSON.stringify(data));
    
    exportData.value = JSON.stringify(cleanData, null, 2);
    exportSuccess.value = "Identity exported successfully! Raw data ready for backup.";
  } catch (error) {
    console.error("Export error:", error);
    exportSuccess.value = "Export failed: " + error.message;
  }
}

// Copy to clipboard
function copyToClipboard() {
  navigator.clipboard.writeText(exportData.value).then(() => {
    exportSuccess.value = "Copied to clipboard!";
  }).catch(() => {
    exportSuccess.value = "Failed to copy to clipboard";
  });
}

useBreadcrumbs({
  path: "/profile",
  name: "Profile",
});
</script>
<template>
  <div class="flex flex-col flex-1 overflow-y-scroll">
    <div class="flex-1 mx-4 border-x border-base-300 flex flex-col bg-base-100">
      <div class="p-6 max-w-6xl mx-auto w-full">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-8">
          <div>
            <h1 class="text-3xl font-bold flex items-center gap-3">
              👤 Identity & Profile
            </h1>
            <p class="text-base-content/70 mt-2">
              View your cryptographic identity and manage your profile
            </p>
          </div>
          
          <div class="flex gap-2">
            <router-link to="/app/profile/management">
              <SButton type="primary">
                👥 Manage Profile
              </SButton>
            </router-link>
          </div>
        </div>

        <!-- Identity Card -->
        <div class="card bg-base-100 shadow-lg border border-base-300 mb-8">
          <div class="card-body">
            <div class="flex flex-col lg:flex-row items-start gap-6">
              <!-- Avatar Section -->
              <div class="flex flex-col items-center text-center lg:items-start lg:text-left">
                <IdentityAvatar :identity="publicKeyPEM" size="lg" class="mb-4" />
                <div>
                  <h2 class="text-xl font-bold">Your Identity</h2>
                  <p class="text-sm text-base-content/70">
                    Cryptographic identity
                  </p>
                </div>
              </div>
              
              <!-- Key Information -->
              <div class="flex-1 w-full space-y-6">
                <!-- Identity Keys Section -->
                <div class="space-y-3">
                  <h3 class="font-semibold text-lg flex items-center gap-2">
                    🔑 Identity Keys
                  </h3>
                  <div class="bg-base-50 rounded-lg p-4 space-y-3">
                    <div>
                      <div class="text-sm font-medium text-base-content/80 mb-1">Public Key (Verification)</div>
                      <div class="bg-base-200 rounded px-3 py-2">
                        <code class="text-xs text-base-content break-all font-mono">
                          {{ publicKeyPEM.slice(0, 80) }}...
                        </code>
                      </div>
                      <div class="text-xs text-base-content/60 mt-1">
                        Used for digital signatures and identity verification
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Encryption Keys Section -->
                <div class="space-y-3">
                  <h3 class="font-semibold text-lg flex items-center gap-2">
                    🛡️ Encryption Keys
                  </h3>
                  <div class="bg-base-50 rounded-lg p-4 space-y-3">
                    <div>
                      <div class="text-sm font-medium text-base-content/80 mb-1">Public Key (Encryption)</div>
                      <div class="bg-base-200 rounded px-3 py-2">
                        <code class="text-xs text-base-content break-all font-mono">
                          {{ publicKey.slice(0, 80) }}...
                        </code>
                      </div>
                      <div class="text-xs text-base-content/60 mt-1">
                        Used for secure messaging and data encryption
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Security Notice -->
                <div class="alert alert-warning">
                  <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <div>
                    <div class="font-medium">🔐 Private keys are stored securely in your browser</div>
                    <div class="text-sm">Remember to backup your keys and profile data regularly!</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="mb-8">
          <h2 class="text-xl font-bold mb-4">Quick Actions</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <router-link to="/app/profile/management">
              <div class="card bg-base-100 shadow border border-base-300 hover:shadow-lg hover:scale-105 transition-all cursor-pointer group">
                <div class="card-body text-center p-6">
                  <div class="text-4xl mb-3 group-hover:scale-110 transition-transform">👥</div>
                  <h3 class="font-semibold text-lg">Profile Management</h3>
                  <p class="text-sm text-base-content/60">Edit profile, share with others</p>
                </div>
              </div>
            </router-link>

            <router-link to="/ledger/users">
              <div class="card bg-base-100 shadow border border-base-300 hover:shadow-lg hover:scale-105 transition-all cursor-pointer group">
                <div class="card-body text-center p-6">
                  <div class="text-4xl mb-3 group-hover:scale-110 transition-transform">🔑</div>
                  <h3 class="font-semibold text-lg">User Management</h3>
                  <p class="text-sm text-base-content/60">Manage ledger users and permissions</p>
                </div>
              </div>
            </router-link>

            <router-link to="/solid">
              <div class="card bg-base-100 shadow border border-base-300 hover:shadow-lg hover:scale-105 transition-all cursor-pointer group">
                <div class="card-body text-center p-6">
                  <div class="text-4xl mb-3 group-hover:scale-110 transition-transform">🌐</div>
                  <h3 class="font-semibold text-lg">Solid Pod</h3>
                  <p class="text-sm text-base-content/60">Connect and sync with your pod</p>
                </div>
              </div>
            </router-link>
          </div>
        </div>

        <!-- Export Identity Section -->
        <div>
          <h2 class="text-xl font-bold mb-4">🔄 Backup & Export</h2>
          <div class="card bg-base-100 shadow-lg border border-base-300">
            <div class="card-body">
              <div class="flex flex-col lg:flex-row gap-6">
                <!-- Export Controls -->
                <div class="lg:w-1/3 space-y-4">
                  <div>
                    <h3 class="font-semibold text-lg mb-2">Export Identity</h3>
                    <p class="text-sm text-base-content/60 mb-4">
                      Create a local backup of your cryptographic identity and keys
                    </p>
                    
                    <label class="flex items-center gap-2 cursor-pointer mb-4">
                      <input 
                        v-model="includePrivateKeys"
                        type="checkbox" 
                        class="checkbox checkbox-primary" 
                      />
                      <span class="text-sm">Include private keys (⚠️ Keep secure!)</span>
                    </label>
                    
                    <SButton @click="exportIdentity" type="primary" class="w-full mb-2">
                      📦 Export Identity
                    </SButton>
                    
                    <SButton 
                      v-if="exportData"
                      @click="copyToClipboard"
                      type="secondary" 
                      class="w-full"
                    >
                      📋 Copy to Clipboard
                    </SButton>
                  </div>
                  
                  <!-- Solid Sync Section -->
                  <div class="border-t pt-4">
                    <h3 class="font-semibold text-lg mb-2">Solid Pod Sync</h3>
                    <p class="text-sm text-base-content/60 mb-4">
                      Sync profile data to your Solid pod (public keys only - private keys stay local)
                    </p>
                    
                    <router-link to="/solid" class="block mb-2">
                      <SButton type="secondary" class="w-full">
                        🌐 Connect Solid Pod
                      </SButton>
                    </router-link>
                    
                    <div class="alert alert-info text-xs">
                      <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      <div>
                        <div class="font-medium">🔒 Security Note</div>
                        <div>Solid sync only stores public profile data and public keys. Private keys remain secure in your browser.</div>
                      </div>
                    </div>
                  </div>
                  
                  <div v-if="exportSuccess" class="alert alert-success">
                    <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span class="text-sm">{{ exportSuccess }}</span>
                  </div>
                </div>
                
                <!-- Export Data Display -->
                <div class="lg:w-2/3">
                  <div v-if="exportData">
                    <h4 class="font-medium mb-2">Exported Data:</h4>
                    <textarea 
                      v-model="exportData"
                      class="textarea textarea-bordered w-full h-64 text-xs font-mono"
                      readonly
                      placeholder="Exported identity data will appear here..."
                    />
                    <div class="text-xs text-base-content/60 mt-2">
                      <div class="mb-1">
                        <strong>⚠️ Important:</strong> Save this data securely. You can use it to restore your identity on another device.
                      </div>
                      <div>
                        <strong>🔒 If private keys are included:</strong> Store in a secure location (password manager, encrypted drive). Anyone with this data can impersonate you.
                      </div>
                    </div>
                  </div>
                  <div v-else class="flex items-center justify-center h-64 bg-base-50 border-2 border-dashed border-base-300 rounded-lg">
                    <div class="text-center text-base-content/50">
                      <div class="text-4xl mb-2">📦</div>
                      <p>Export your identity to see the data here</p>
                      <div class="text-xs mt-2 max-w-sm">
                        Choose whether to include private keys based on your security needs.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
