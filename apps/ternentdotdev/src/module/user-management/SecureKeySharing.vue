<script setup>
import { shallowRef, computed, watch } from "vue";
import { SButton, SDrawerRight } from "ternent-ui/components";
import { useUserProfiles } from "./useUserProfiles";
import { useIdentity } from "../identity/useIdentity";
import { useEncryption } from "../encryption/useEncryption";
import { encrypt, decrypt } from "concords-encrypt";
import { formatEncryptionFile, stripEncryptionFile, generateId } from "concords-utils";
import IdentityAvatar from "../identity/IdentityAvatar.vue";

const props = defineProps({
  open: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:open', 'keyShared']);

const { profiles, getProfile } = useUserProfiles();
const { publicKeyPEM, privateKeyPEM } = useIdentity();
const { publicKey: encryptionPublicKey, privateKey: encryptionPrivateKey } = useEncryption();

// UI State
const isOpen = shallowRef(false);
const currentStep = shallowRef(1); // 1: Select User, 2: Choose Keys, 3: Confirm & Share
const isLoading = shallowRef(false);

// Form data
const selectedUser = shallowRef(null);
const keySelection = shallowRef({
  includeIdentityPublic: true,
  includeIdentityPrivate: false,
  includeEncryptionPublic: true,
  includeEncryptionPrivate: false,
  customMessage: "",
  expirationDays: 30,
  oneTimeUse: false
});

const successMessage = shallowRef("");
const errorMessage = shallowRef("");

// Watch props
watch(() => props.open, (value) => {
  isOpen.value = value;
  if (value) {
    resetForm();
  }
});

watch(isOpen, (value) => {
  emit('update:open', value);
});

// Available users (excluding self)
const availableUsers = computed(() => {
  return profiles.value.filter(p => 
    p.identity !== publicKeyPEM.value && 
    p.encryption && // Must have encryption key to receive shared keys
    !p.isPrivate // Only show public profiles
  );
});

// Selected keys summary
const selectedKeysCount = computed(() => {
  return Object.values(keySelection.value).filter(v => v === true).length;
});

// Reset form
function resetForm() {
  currentStep.value = 1;
  selectedUser.value = null;
  keySelection.value = {
    includeIdentityPublic: true,
    includeIdentityPrivate: false,
    includeEncryptionPublic: true,
    includeEncryptionPrivate: false,
    customMessage: "",
    expirationDays: 30,
    oneTimeUse: false
  };
  clearMessages();
}

// Navigation
function nextStep() {
  if (currentStep.value < 3) {
    currentStep.value++;
  }
}

function prevStep() {
  if (currentStep.value > 1) {
    currentStep.value--;
  }
}

function selectUser(user) {
  selectedUser.value = user;
  nextStep();
}

// Share keys
async function shareKeys() {
  if (!selectedUser.value) return;
  
  isLoading.value = true;
  clearMessages();
  
  try {
    // Prepare keys to share
    const keysToShare = {};
    
    if (keySelection.value.includeIdentityPublic) {
      keysToShare.identityPublic = publicKeyPEM.value;
    }
    
    if (keySelection.value.includeIdentityPrivate) {
      keysToShare.identityPrivate = privateKeyPEM.value;
    }
    
    if (keySelection.value.includeEncryptionPublic) {
      keysToShare.encryptionPublic = encryptionPublicKey.value;
    }
    
    if (keySelection.value.includeEncryptionPrivate) {
      keysToShare.encryptionPrivate = encryptionPrivateKey.value;
    }

    // Create key share package
    const keyPackage = {
      id: generateId(),
      sharedBy: publicKeyPEM.value,
      sharedWith: selectedUser.value.identity,
      keys: keysToShare,
      message: keySelection.value.customMessage || "",
      createdAt: new Date().toISOString(),
      expiresAt: keySelection.value.expirationDays ? 
        new Date(Date.now() + (keySelection.value.expirationDays * 24 * 60 * 60 * 1000)).toISOString() : 
        null,
      oneTimeUse: keySelection.value.oneTimeUse,
      metadata: {
        sharedFromApp: "ternent.dev",
        version: "1.0"
      }
    };

    // Encrypt the key package for the recipient
    const encryptedPackage = await encrypt(
      selectedUser.value.encryption,
      JSON.stringify(keyPackage)
    );

    // Create the key share record for the ledger
    const keyShareRecord = {
      id: generateId(),
      type: "key-share",
      sharedBy: publicKeyPEM.value,
      sharedWith: selectedUser.value.identity,
      recipientName: selectedUser.value.name || "Unknown",
      encryptedData: stripEncryptionFile(encryptedPackage),
      keyTypes: Object.keys(keysToShare),
      expiresAt: keyPackage.expiresAt,
      oneTimeUse: keySelection.value.oneTimeUse,
      isActive: true,
      sharedAt: new Date().toISOString()
    };

    // Add to ledger (this would use your existing ledger system)
    // await addItem(keyShareRecord, "key-shares");

    successMessage.value = `Keys shared successfully with ${selectedUser.value.name || selectedUser.value.identity}!`;
    
    emit('keyShared', {
      recipient: selectedUser.value,
      keyTypes: Object.keys(keysToShare),
      record: keyShareRecord
    });

    // Auto-close after success
    setTimeout(() => {
      isOpen.value = false;
    }, 2000);

  } catch (error) {
    console.error("Error sharing keys:", error);
    errorMessage.value = error.message || "Failed to share keys";
  } finally {
    isLoading.value = false;
  }
}

function clearMessages() {
  successMessage.value = "";
  errorMessage.value = "";
}

// Key type labels and descriptions
const keyTypes = [
  {
    key: 'includeIdentityPublic',
    label: 'Identity Public Key',
    description: 'Allows verification of your signatures',
    icon: '🔑',
    risk: 'low'
  },
  {
    key: 'includeIdentityPrivate',
    label: 'Identity Private Key',
    description: '⚠️ Allows signing as you - share with extreme caution!',
    icon: '🔐',
    risk: 'high'
  },
  {
    key: 'includeEncryptionPublic',
    label: 'Encryption Public Key',
    description: 'Allows others to encrypt data for you',
    icon: '🛡️',
    risk: 'low'
  },
  {
    key: 'includeEncryptionPrivate',
    label: 'Encryption Private Key',
    description: '⚠️ Allows decrypting your data - share with extreme caution!',
    icon: '🔓',
    risk: 'high'
  }
];
</script>

<template>
  <SDrawerRight v-model="isOpen" title="🔑 Share Keys Securely">
    <div class="p-6 space-y-6">
      <!-- Progress Indicator -->
      <div class="steps steps-horizontal w-full mb-6">
        <div class="step" :class="{ 'step-primary': currentStep >= 1 }">Select User</div>
        <div class="step" :class="{ 'step-primary': currentStep >= 2 }">Choose Keys</div>
        <div class="step" :class="{ 'step-primary': currentStep >= 3 }">Confirm</div>
      </div>

      <!-- Alert Messages -->
      <div v-if="successMessage" class="alert alert-success">
        <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{{ successMessage }}</span>
      </div>

      <div v-if="errorMessage" class="alert alert-error">
        <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{{ errorMessage }}</span>
      </div>

      <!-- Step 1: Select User -->
      <div v-if="currentStep === 1" class="space-y-4">
        <div>
          <h3 class="font-semibold text-lg mb-3">👥 Select Recipient</h3>
          <p class="text-sm text-base-content/60 mb-4">
            Choose a user to securely share your cryptographic keys with.
          </p>
        </div>

        <div v-if="availableUsers.length === 0" class="text-center py-8 text-base-content/50">
          <div class="text-4xl mb-2">👥</div>
          <p class="mb-2">No users available for key sharing</p>
          <p class="text-xs">Users need encryption keys to receive shared keys</p>
        </div>

        <div v-else class="space-y-3 max-h-96 overflow-y-auto">
          <div 
            v-for="user in availableUsers" 
            :key="user.identity"
            @click="selectUser(user)"
            class="p-4 border border-base-200 rounded-lg cursor-pointer hover:bg-base-50 hover:border-primary transition-colors"
          >
            <div class="flex items-center gap-4">
              <IdentityAvatar :identity="user.identity" size="md" />
              <div class="flex-1">
                <h4 class="font-medium">{{ user.name || 'Anonymous User' }}</h4>
                <p v-if="user.bio" class="text-sm text-base-content/60 line-clamp-1">{{ user.bio }}</p>
                <code class="text-xs bg-base-200 px-2 py-1 rounded">{{ user.identity.slice(0, 24) }}...</code>
              </div>
              <div class="text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Step 2: Choose Keys -->
      <div v-if="currentStep === 2" class="space-y-4">
        <div>
          <h3 class="font-semibold text-lg mb-1">🔑 Select Keys to Share</h3>
          <p class="text-sm text-base-content/60 mb-4">
            Choose which cryptographic keys to share with 
            <strong>{{ selectedUser?.name || 'the selected user' }}</strong>.
          </p>
        </div>

        <!-- Key Selection -->
        <div class="space-y-4">
          <div 
            v-for="keyType in keyTypes" 
            :key="keyType.key"
            class="p-4 border rounded-lg"
            :class="{
              'border-red-300 bg-red-50': keyType.risk === 'high',
              'border-green-300 bg-green-50': keyType.risk === 'low'
            }"
          >
            <label class="flex items-start gap-3 cursor-pointer">
              <input 
                v-model="keySelection[keyType.key]"
                type="checkbox" 
                class="checkbox checkbox-primary mt-1"
                :class="{ 'checkbox-error': keyType.risk === 'high' }"
              />
              <div class="flex-1">
                <div class="flex items-center gap-2">
                  <span>{{ keyType.icon }}</span>
                  <span class="font-medium">{{ keyType.label }}</span>
                  <span 
                    v-if="keyType.risk === 'high'" 
                    class="badge badge-error badge-sm"
                  >
                    HIGH RISK
                  </span>
                </div>
                <p class="text-sm text-base-content/60 mt-1">{{ keyType.description }}</p>
              </div>
            </label>
          </div>
        </div>

        <!-- Options -->
        <div class="space-y-4 border-t pt-4">
          <div>
            <label class="block text-sm font-medium mb-2">Custom Message (Optional)</label>
            <textarea 
              v-model="keySelection.customMessage"
              class="textarea textarea-bordered w-full" 
              placeholder="Add a note about why you're sharing these keys..."
              rows="3"
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium mb-2">Expiration (Days)</label>
              <input 
                v-model.number="keySelection.expirationDays"
                type="number"
                min="1"
                max="365"
                class="input input-bordered w-full" 
                placeholder="30"
              />
            </div>

            <div class="flex items-end">
              <label class="flex items-center gap-2 cursor-pointer">
                <input 
                  v-model="keySelection.oneTimeUse"
                  type="checkbox" 
                  class="checkbox checkbox-primary" 
                />
                <span class="text-sm">One-time use only</span>
              </label>
            </div>
          </div>
        </div>

        <!-- Navigation -->
        <div class="flex gap-3 pt-4">
          <SButton @click="prevStep" class="flex-1" type="secondary">
            ← Back
          </SButton>
          <SButton 
            @click="nextStep" 
            :disabled="selectedKeysCount === 0"
            class="flex-1" 
            type="primary"
          >
            Next: Review →
          </SButton>
        </div>
      </div>

      <!-- Step 3: Confirm -->
      <div v-if="currentStep === 3" class="space-y-4">
        <div>
          <h3 class="font-semibold text-lg mb-1">🔍 Review & Confirm</h3>
          <p class="text-sm text-base-content/60 mb-4">
            Please review the details before sharing your keys.
          </p>
        </div>

        <!-- Recipient Summary -->
        <div class="bg-base-100 border border-base-300 rounded-lg p-4">
          <h4 class="font-medium mb-3">👤 Recipient</h4>
          <div class="flex items-center gap-4">
            <IdentityAvatar :identity="selectedUser.identity" size="md" />
            <div>
              <div class="font-medium">{{ selectedUser.name || 'Anonymous User' }}</div>
              <code class="text-xs">{{ selectedUser.identity.slice(0, 32) }}...</code>
            </div>
          </div>
        </div>

        <!-- Keys Summary -->
        <div class="bg-base-100 border border-base-300 rounded-lg p-4">
          <h4 class="font-medium mb-3">🔑 Keys to Share ({{ selectedKeysCount }})</h4>
          <div class="space-y-2">
            <div 
              v-for="keyType in keyTypes.filter(kt => keySelection[kt.key])" 
              :key="keyType.key"
              class="flex items-center gap-3 p-2 rounded"
              :class="{
                'bg-red-100': keyType.risk === 'high',
                'bg-green-100': keyType.risk === 'low'
              }"
            >
              <span>{{ keyType.icon }}</span>
              <span class="text-sm">{{ keyType.label }}</span>
              <span 
                v-if="keyType.risk === 'high'" 
                class="badge badge-error badge-sm ml-auto"
              >
                HIGH RISK
              </span>
            </div>
          </div>
        </div>

        <!-- Settings Summary -->
        <div class="bg-base-100 border border-base-300 rounded-lg p-4">
          <h4 class="font-medium mb-3">⚙️ Settings</h4>
          <div class="space-y-2 text-sm">
            <div v-if="keySelection.expirationDays">
              <span class="font-medium">Expires:</span> 
              {{ new Date(Date.now() + (keySelection.expirationDays * 24 * 60 * 60 * 1000)).toLocaleDateString() }}
            </div>
            <div v-if="keySelection.oneTimeUse">
              <span class="font-medium">Usage:</span> One-time use only
            </div>
            <div v-if="keySelection.customMessage">
              <span class="font-medium">Message:</span> {{ keySelection.customMessage }}
            </div>
          </div>
        </div>

        <!-- High Risk Warning -->
        <div 
          v-if="keySelection.includeIdentityPrivate || keySelection.includeEncryptionPrivate"
          class="alert alert-warning"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <div>
            <div class="font-medium">⚠️ High Risk Operation</div>
            <div class="text-sm">You are sharing private keys that grant significant access. Only share with trusted users!</div>
          </div>
        </div>

        <!-- Navigation -->
        <div class="flex gap-3 pt-4">
          <SButton @click="prevStep" class="flex-1" type="secondary">
            ← Back
          </SButton>
          <SButton 
            @click="shareKeys" 
            :disabled="isLoading"
            class="flex-1" 
            type="primary"
          >
            <span v-if="isLoading">Sharing...</span>
            <span v-else>🔒 Share Keys Securely</span>
          </SButton>
        </div>
      </div>

      <!-- Close Button -->
      <div class="pt-4 border-t">
        <SButton @click="isOpen = false" class="w-full" type="ghost">
          Cancel
        </SButton>
      </div>
    </div>
  </SDrawerRight>
</template>
