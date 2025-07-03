<script setup>
import { shallowRef } from "vue";
import { useIdentity } from "@/module/identity/useIdentity";
import { useEncryption } from "@/module/encryption/useEncryption";
import IdentityAvatar from "@/module/identity/IdentityAvatar.vue";
import { useBreadcrumbs } from "@/module/breadcrumbs/useBreadcrumbs";
import { SButton, SCard, SInput } from "ternent-ui/components";

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
  <div class="flex flex-col flex-1 h-full overflow-hidden">
    <div class="flex-1 mx-micro border-x border-muted flex flex-col bg-background overflow-y-auto">
      <div class="p-micro max-w-6xl mx-auto w-full min-h-0">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-micro mb-micro">
          <div>
            <h1 class="gradient-heading text-heading-lg flex items-center gap-micro">
              👤 Identity & Profile
            </h1>
            <p class="text-subtle text-base mt-1">
              View your cryptographic identity and manage your profile
            </p>
          </div>
          
          <div class="flex gap-micro">
            <router-link to="/app/profile/management">
              <SButton variant="primary" size="small">
                👥 Manage Profile
              </SButton>
            </router-link>
          </div>
        </div>

        <!-- Identity Card -->
        <SCard class="mb-micro">
          <div class="flex flex-col lg:flex-row items-start gap-micro">
            <!-- Avatar Section -->
            <div class="flex flex-col items-center text-center lg:items-start lg:text-left">
              <IdentityAvatar :identity="publicKeyPEM" size="lg" class="mb-micro" />
              <div>
                <h2 class="text-heading-md font-medium">Your Identity</h2>
                <p class="text-base text-subtle">
                  Cryptographic identity
                </p>
              </div>
            </div>
            
            <!-- Key Information -->
            <div class="flex-1 w-full space-y-micro">
              <!-- Identity Keys Section -->
              <div class="space-y-micro">
                <h3 class="font-medium text-lg flex items-center gap-micro">
                  🔑 Identity Keys
                </h3>
                <div class="bg-surface rounded-lg p-micro space-y-micro">
                  <div>
                    <div class="text-base font-medium text-foreground mb-1">Public Key (Verification)</div>
                    <div class="bg-muted rounded px-micro py-2">
                      <code class="text-xs text-foreground break-all font-mono">
                        {{ publicKeyPEM.slice(0, 80) }}...
                      </code>
                    </div>
                    <div class="text-xs text-subtle mt-1">
                      Used for digital signatures and identity verification
                    </div>
                  </div>
                </div>
              </div>

              <!-- Encryption Keys Section -->
              <div class="space-y-micro">
                <h3 class="font-medium text-lg flex items-center gap-micro">
                  🛡️ Encryption Keys
                </h3>
                <div class="bg-surface rounded-lg p-micro space-y-micro">
                  <div>
                    <div class="text-base font-medium text-foreground mb-1">Public Key (Encryption)</div>
                    <div class="bg-muted rounded px-micro py-2">
                      <code class="text-xs text-foreground break-all font-mono">
                        {{ publicKey.slice(0, 80) }}...
                      </code>
                    </div>
                    <div class="text-xs text-subtle mt-1">
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
        </SCard>

        <!-- Quick Actions -->
        <div class="mb-micro">
          <h2 class="text-heading-md font-medium mb-micro">Quick Actions</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-micro">
            <router-link to="/app/profile/management">
              <SCard class="hover:shadow-lg hover:scale-105 transition-all cursor-pointer group">
                <div class="text-center p-micro">
                  <div class="text-4xl mb-micro group-hover:scale-110 transition-transform">👥</div>
                  <h3 class="font-medium text-lg">Profile Management</h3>
                  <p class="text-base text-subtle">Edit profile, share with others</p>
                </div>
              </SCard>
            </router-link>

            <router-link to="/ledger/users">
              <SCard class="hover:shadow-lg hover:scale-105 transition-all cursor-pointer group">
                <div class="text-center p-micro">
                  <div class="text-4xl mb-micro group-hover:scale-110 transition-transform">🔑</div>
                  <h3 class="font-medium text-lg">User Management</h3>
                  <p class="text-base text-subtle">Manage ledger users and permissions</p>
                </div>
              </SCard>
            </router-link>

            <router-link to="/solid">
              <SCard class="hover:shadow-lg hover:scale-105 transition-all cursor-pointer group">
                <div class="text-center p-micro">
                  <div class="text-4xl mb-micro group-hover:scale-110 transition-transform">🌐</div>
                  <h3 class="font-medium text-lg">Solid Pod</h3>
                  <p class="text-base text-subtle">Connect and sync with your pod</p>
                </div>
              </SCard>
            </router-link>
          </div>
        </div>

        <!-- Export Identity Section -->
        <div>
          <h2 class="text-heading-md font-medium mb-micro">🔄 Backup & Export</h2>
          <SCard>
            <div class="flex flex-col lg:flex-row gap-micro">
              <!-- Export Controls -->
              <div class="lg:w-1/3 space-y-micro">
                <div>
                  <h3 class="font-medium text-lg mb-micro">Export Identity</h3>
                  <p class="text-base text-subtle mb-micro">
                    Create a local backup of your cryptographic identity and keys
                  </p>
                  
                  <label class="flex items-center gap-micro cursor-pointer mb-micro">
                    <input 
                      v-model="includePrivateKeys"
                      type="checkbox" 
                      class="checkbox checkbox-primary" 
                    />
                    <span class="text-base">Include private keys (⚠️ Keep secure!)</span>
                  </label>
                  
                  <SButton @click="exportIdentity" variant="primary" size="small" class="w-full mb-micro">
                    📦 Export Identity
                  </SButton>
                  
                  <SButton 
                    v-if="exportData"
                    @click="copyToClipboard"
                    variant="secondary" 
                    size="small"
                    class="w-full"
                  >
                    📋 Copy to Clipboard
                  </SButton>
                </div>
                
                <!-- Solid Sync Section -->
                <div class="border-t pt-micro">
                  <h3 class="font-medium text-lg mb-micro">Solid Pod Sync</h3>
                  <p class="text-base text-subtle mb-micro">
                    Sync profile data to your Solid pod (public keys only - private keys stay local)
                  </p>
                  
                  <router-link to="/solid" class="block mb-micro">
                    <SButton variant="secondary" size="small" class="w-full">
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
                  <span class="text-base">{{ exportSuccess }}</span>
                </div>
              </div>
              
              <!-- Export Data Display -->
              <div class="lg:w-2/3">
                <div v-if="exportData">
                  <h4 class="font-medium mb-micro">Exported Data:</h4>
                  <textarea 
                    v-model="exportData"
                    class="textarea textarea-bordered w-full h-64 text-xs font-mono"
                    readonly
                    placeholder="Exported identity data will appear here..."
                  />
                  <div class="text-xs text-subtle mt-micro">
                    <div class="mb-1">
                      <strong>⚠️ Important:</strong> Save this data securely. You can use it to restore your identity on another device.
                    </div>
                    <div>
                      <strong>🔒 If private keys are included:</strong> Store in a secure location (password manager, encrypted drive). Anyone with this data can impersonate you.
                    </div>
                  </div>
                </div>
                <div v-else class="flex items-center justify-center h-64 bg-surface border-2 border-dashed border-muted rounded-lg">
                  <div class="text-center text-subtle">
                    <div class="text-4xl mb-micro">📦</div>
                    <p class="text-lg mb-micro">Export your identity to see the data here</p>
                    <div class="text-base mt-micro max-w-sm">
                      Choose whether to include private keys based on your security needs.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </SCard>
        </div>
      </div>
    </div>
  </div>
</template>
