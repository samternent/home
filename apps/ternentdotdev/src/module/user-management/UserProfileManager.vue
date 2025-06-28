<script setup>
import { shallowRef, watch, computed, onMounted } from "vue";
import { SButton, SDrawerRight } from "ternent-ui/components";
import { useUserProfiles } from "./useUserProfiles";
import { useIdentity } from "../identity/useIdentity";
import IdentityAvatar from "../identity/IdentityAvatar.vue";

const {
  myProfile,
  currentUserProfile,
  isLoading,
  saveMyProfile,
  shareProfileWith,
  exportMyProfile,
  importProfile,
  syncToSolid,
  profilesSharedWithMe,
  profilesSharedByMe
} = useUserProfiles();

const { publicKeyPEM } = useIdentity();

// UI State
const isEditProfileOpen = shallowRef(false);
const isShareProfileOpen = shallowRef(false);
const isImportExportOpen = shallowRef(false);
const activeTab = shallowRef("profile");

// Form states
const editForm = shallowRef({
  name: "",
  bio: "",
  avatar: "",
  email: "",
  phone: "",
  website: "",
  location: "",
  socialLinks: {
    twitter: "",
    github: "",
    linkedin: ""
  },
  preferences: {
    theme: "auto",
    notifications: true,
    publicProfile: true
  }
});

const shareForm = shallowRef({
  targetIdentity: "",
  accessLevel: "basic",
  customMessage: ""
});

const importExportForm = shallowRef({
  includePrivateKeys: false,
  exportData: "",
  importData: ""
});

// Success/Error states
const successMessage = shallowRef("");
const errorMessage = shallowRef("");

// Load current profile data into edit form
watch(myProfile, (profile) => {
  editForm.value = {
    name: profile.name || "",
    bio: profile.bio || "",
    avatar: profile.avatar || "",
    email: profile.email || "",
    phone: profile.phone || "",
    website: profile.website || "",
    location: profile.location || "",
    socialLinks: {
      twitter: profile.socialLinks?.twitter || "",
      github: profile.socialLinks?.github || "",
      linkedin: profile.socialLinks?.linkedin || ""
    },
    preferences: {
      theme: profile.preferences?.theme || "auto",
      notifications: profile.preferences?.notifications !== false,
      publicProfile: profile.preferences?.publicProfile !== false
    }
  };
}, { immediate: true, deep: true });

// Save profile
async function handleSaveProfile() {
  clearMessages();
  
  const result = await saveMyProfile(editForm.value);
  
  if (result.success) {
    successMessage.value = "Profile saved successfully!";
    isEditProfileOpen.value = false;
  } else {
    errorMessage.value = result.error || "Failed to save profile";
  }
}

// Share profile with another user
async function handleShareProfile() {
  if (!shareForm.value.targetIdentity.trim()) {
    errorMessage.value = "Please enter a target user identity";
    return;
  }

  clearMessages();
  
  const result = await shareProfileWith(
    shareForm.value.targetIdentity.trim(),
    null,
    shareForm.value.accessLevel
  );
  
  if (result.success) {
    successMessage.value = `Profile shared successfully with access level: ${shareForm.value.accessLevel}`;
    shareForm.value.targetIdentity = "";
    shareForm.value.customMessage = "";
    isShareProfileOpen.value = false;
  } else {
    errorMessage.value = result.error || "Failed to share profile";
  }
}

// Export profile
async function handleExportProfile() {
  clearMessages();
  
  try {
    const exportData = await exportMyProfile(importExportForm.value.includePrivateKeys);
    importExportForm.value.exportData = JSON.stringify(exportData, null, 2);
    successMessage.value = "Profile exported successfully! Copy the data below.";
  } catch (error) {
    errorMessage.value = "Failed to export profile: " + error.message;
  }
}

// Import profile
async function handleImportProfile() {
  if (!importExportForm.value.importData.trim()) {
    errorMessage.value = "Please paste profile data to import";
    return;
  }

  clearMessages();
  
  try {
    const profileData = JSON.parse(importExportForm.value.importData);
    const result = await importProfile(profileData, false);
    
    if (result.success) {
      successMessage.value = "Profile imported successfully!";
      importExportForm.value.importData = "";
    } else {
      errorMessage.value = result.error || "Failed to import profile";
    }
  } catch (error) {
    errorMessage.value = "Invalid profile data format";
  }
}

// Sync to Solid
async function handleSyncToSolid() {
  clearMessages();
  
  try {
    const result = await syncToSolid();
    if (result.success) {
      successMessage.value = "Profile synced to Solid pod successfully!";
    } else {
      errorMessage.value = result.error || "Failed to sync to Solid pod";
    }
  } catch (error) {
    errorMessage.value = error.message || "Failed to sync to Solid pod";
  }
}

// Utility functions
function clearMessages() {
  successMessage.value = "";
  errorMessage.value = "";
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    successMessage.value = "Copied to clipboard!";
  }).catch(() => {
    errorMessage.value = "Failed to copy to clipboard";
  });
}

const accessLevels = [
  { value: "basic", label: "Basic", description: "Name, avatar, bio only" },
  { value: "contact", label: "Contact", description: "Basic + contact information" },
  { value: "trusted", label: "Trusted", description: "Full profile access" }
];

// Computed
const profileCompleteness = computed(() => {
  const fields = ['name', 'bio', 'email'];
  const completed = fields.filter(field => editForm.value[field]?.trim()).length;
  return Math.round((completed / fields.length) * 100);
});
</script>

<template>
  <div class="p-6 max-w-4xl mx-auto">
    <!-- Header -->
    <div class="flex justify-between items-start mb-8">
      <div>
        <h1 class="text-3xl font-bold flex items-center gap-3">
          👤 User Profile
        </h1>
        <p class="text-base-content/70 mt-2">
          Manage your identity, profile information, and sharing preferences
        </p>
      </div>
      
      <div class="flex gap-2">
        <SButton @click="isEditProfileOpen = true" type="primary">
          ✏️ Edit Profile
        </SButton>
        <SButton @click="isShareProfileOpen = true" type="secondary">
          🔗 Share Profile
        </SButton>
      </div>
    </div>

    <!-- Alert Messages -->
    <div v-if="successMessage" class="alert alert-success mb-6">
      <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>{{ successMessage }}</span>
    </div>

    <div v-if="errorMessage" class="alert alert-error mb-6">
      <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>{{ errorMessage }}</span>
    </div>

    <!-- Tab Navigation -->
    <div class="tabs tabs-boxed mb-6">
      <a 
        class="tab" 
        :class="{ 'tab-active': activeTab === 'profile' }"
        @click="activeTab = 'profile'"
      >
        👤 My Profile
      </a>
      <a 
        class="tab" 
        :class="{ 'tab-active': activeTab === 'shared' }"
        @click="activeTab = 'shared'"
      >
        🔗 Shared Profiles
      </a>
      <a 
        class="tab" 
        :class="{ 'tab-active': activeTab === 'backup' }"
        @click="activeTab = 'backup'"
      >
        💾 Backup & Sync
      </a>
    </div>

    <!-- My Profile Tab -->
    <div v-if="activeTab === 'profile'" class="space-y-6">
      <!-- Current Profile Card -->
      <div class="card bg-base-100 shadow-lg border border-base-300">
        <div class="card-body">
          <div class="flex items-start gap-6">
            <IdentityAvatar 
              :identity="publicKeyPEM" 
              size="xl"
              class="flex-shrink-0"
            />
            
            <div class="flex-1 space-y-4">
              <div>
                <h2 class="text-2xl font-bold">{{ myProfile.name || 'Anonymous User' }}</h2>
                <p v-if="myProfile.bio" class="text-base-content/70 mt-1">{{ myProfile.bio }}</p>
              </div>

              <!-- Profile Completeness -->
              <div class="w-full">
                <div class="flex justify-between text-sm mb-1">
                  <span>Profile Completeness</span>
                  <span>{{ profileCompleteness }}%</span>
                </div>
                <progress 
                  class="progress progress-primary w-full" 
                  :value="profileCompleteness" 
                  max="100"
                ></progress>
              </div>

              <!-- Contact Info -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div v-if="myProfile.email">
                  <span class="font-medium">📧 Email:</span>
                  <span class="ml-2">{{ myProfile.email }}</span>
                </div>
                <div v-if="myProfile.website">
                  <span class="font-medium">🌐 Website:</span>
                  <a :href="myProfile.website" class="ml-2 link" target="_blank">{{ myProfile.website }}</a>
                </div>
                <div v-if="myProfile.location">
                  <span class="font-medium">📍 Location:</span>
                  <span class="ml-2">{{ myProfile.location }}</span>
                </div>
              </div>

              <!-- Identity Info -->
              <div class="bg-base-200 rounded-lg p-4 space-y-2">
                <div class="text-sm">
                  <span class="font-medium">🔑 Identity Key:</span>
                  <code class="ml-2 text-xs bg-base-300 px-2 py-1 rounded">{{ publicKeyPEM.slice(0, 32) }}...</code>
                </div>
                <div class="text-sm">
                  <span class="font-medium">🔐 Encryption Key:</span>
                  <code class="ml-2 text-xs bg-base-300 px-2 py-1 rounded">{{ currentUserProfile.encryption?.slice(0, 32) }}...</code>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Shared Profiles Tab -->
    <div v-if="activeTab === 'shared'" class="space-y-6">
      <!-- Profiles Shared With Me -->
      <div class="card bg-base-100 shadow-lg border border-base-300">
        <div class="card-body">
          <h3 class="card-title">📥 Profiles Shared With Me</h3>
          
          <div v-if="profilesSharedWithMe.length === 0" class="text-center py-8 text-base-content/50">
            <div class="text-4xl mb-2">📭</div>
            <p>No profiles have been shared with you yet</p>
          </div>
          
          <div v-else class="space-y-3">
            <div 
              v-for="profile in profilesSharedWithMe" 
              :key="profile.recordId"
              class="p-4 border border-base-200 rounded-lg"
            >
              <div class="flex items-center gap-4">
                <IdentityAvatar :identity="profile.identity" size="md" />
                <div class="flex-1">
                  <h4 class="font-medium">{{ profile.name || 'Anonymous' }}</h4>
                  <p class="text-sm text-base-content/60">Access Level: {{ profile.accessLevel }}</p>
                  <p class="text-xs text-base-content/40">
                    Shared: {{ new Date(profile.sharedAt).toLocaleDateString() }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Profiles I've Shared -->
      <div class="card bg-base-100 shadow-lg border border-base-300">
        <div class="card-body">
          <h3 class="card-title">📤 Profiles I've Shared</h3>
          
          <div v-if="profilesSharedByMe.length === 0" class="text-center py-8 text-base-content/50">
            <div class="text-4xl mb-2">📤</div>
            <p>You haven't shared your profile with anyone yet</p>
          </div>
          
          <div v-else class="space-y-3">
            <div 
              v-for="shared in profilesSharedByMe" 
              :key="shared.recordId"
              class="p-4 border border-base-200 rounded-lg"
            >
              <div class="flex items-center justify-between">
                <div>
                  <p class="font-medium">Shared with: 
                    <code class="text-xs">{{ shared.sharedWith[0]?.slice(0, 16) }}...</code>
                  </p>
                  <p class="text-sm text-base-content/60">Access Level: {{ shared.accessLevel }}</p>
                  <p class="text-xs text-base-content/40">
                    Shared: {{ new Date(shared.sharedAt).toLocaleDateString() }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Backup & Sync Tab -->
    <div v-if="activeTab === 'backup'" class="space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Export Profile -->
        <div class="card bg-base-100 shadow-lg border border-base-300">
          <div class="card-body">
            <h3 class="card-title">📦 Export Profile</h3>
            <p class="text-sm text-base-content/60 mb-4">
              Create a backup of your profile data
            </p>
            
            <div class="space-y-4">
              <label class="flex items-center gap-2 cursor-pointer">
                <input 
                  v-model="importExportForm.includePrivateKeys"
                  type="checkbox" 
                  class="checkbox checkbox-primary" 
                />
                <span class="text-sm">Include private keys (⚠️ Keep secure!)</span>
              </label>
              
              <SButton @click="handleExportProfile" class="w-full" type="primary">
                📦 Export Profile
              </SButton>
              
              <textarea 
                v-if="importExportForm.exportData"
                v-model="importExportForm.exportData"
                class="textarea textarea-bordered w-full h-32 text-xs"
                readonly
                placeholder="Exported data will appear here..."
              />
              
              <SButton 
                v-if="importExportForm.exportData"
                @click="copyToClipboard(importExportForm.exportData)"
                class="w-full" 
                type="secondary"
              >
                📋 Copy to Clipboard
              </SButton>
            </div>
          </div>
        </div>

        <!-- Import Profile -->
        <div class="card bg-base-100 shadow-lg border border-base-300">
          <div class="card-body">
            <h3 class="card-title">📥 Import Profile</h3>
            <p class="text-sm text-base-content/60 mb-4">
              Restore profile from backup data
            </p>
            
            <div class="space-y-4">
              <textarea 
                v-model="importExportForm.importData"
                class="textarea textarea-bordered w-full h-32 text-xs"
                placeholder="Paste exported profile data here..."
              />
              
              <SButton @click="handleImportProfile" class="w-full" type="primary">
                📥 Import Profile
              </SButton>
            </div>
          </div>
        </div>

        <!-- Solid Sync -->
        <div class="card bg-base-100 shadow-lg border border-base-300 md:col-span-2">
          <div class="card-body">
            <h3 class="card-title">🌐 Solid Pod Sync</h3>
            <p class="text-sm text-base-content/60 mb-4">
              Backup your profile to your Solid pod
            </p>
            
            <div class="flex gap-4">
              <SButton @click="handleSyncToSolid" type="primary">
                🔄 Sync to Solid Pod
              </SButton>
              <SButton @click="isImportExportOpen = true" type="secondary">
                📥 Load from Solid Pod
              </SButton>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Profile Drawer -->
    <SDrawerRight v-model="isEditProfileOpen" title="✏️ Edit Profile">
      <div class="space-y-6 p-6">
        <!-- Basic Info -->
        <div class="space-y-4">
          <h3 class="font-semibold">Basic Information</h3>
          
          <div>
            <label class="block text-sm font-medium mb-1">Name</label>
            <input 
              v-model="editForm.name"
              class="input input-bordered w-full" 
              placeholder="Your display name"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-1">Bio</label>
            <textarea 
              v-model="editForm.bio"
              class="textarea textarea-bordered w-full" 
              placeholder="Tell others about yourself..."
              rows="3"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-1">Avatar URL</label>
            <input 
              v-model="editForm.avatar"
              class="input input-bordered w-full" 
              placeholder="https://example.com/avatar.jpg"
            />
          </div>
        </div>

        <!-- Contact Info -->
        <div class="space-y-4">
          <h3 class="font-semibold">Contact Information</h3>
          
          <div>
            <label class="block text-sm font-medium mb-1">Email</label>
            <input 
              v-model="editForm.email"
              type="email"
              class="input input-bordered w-full" 
              placeholder="your@email.com"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-1">Phone</label>
            <input 
              v-model="editForm.phone"
              class="input input-bordered w-full" 
              placeholder="+1 (555) 123-4567"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-1">Website</label>
            <input 
              v-model="editForm.website"
              class="input input-bordered w-full" 
              placeholder="https://yourwebsite.com"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-1">Location</label>
            <input 
              v-model="editForm.location"
              class="input input-bordered w-full" 
              placeholder="City, Country"
            />
          </div>
        </div>

        <!-- Social Links -->
        <div class="space-y-4">
          <h3 class="font-semibold">Social Links</h3>
          
          <div>
            <label class="block text-sm font-medium mb-1">Twitter</label>
            <input 
              v-model="editForm.socialLinks.twitter"
              class="input input-bordered w-full" 
              placeholder="@username"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-1">GitHub</label>
            <input 
              v-model="editForm.socialLinks.github"
              class="input input-bordered w-full" 
              placeholder="username"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-1">LinkedIn</label>
            <input 
              v-model="editForm.socialLinks.linkedin"
              class="input input-bordered w-full" 
              placeholder="username"
            />
          </div>
        </div>

        <!-- Preferences -->
        <div class="space-y-4">
          <h3 class="font-semibold">Preferences</h3>
          
          <label class="flex items-center gap-2 cursor-pointer">
            <input 
              v-model="editForm.preferences.publicProfile"
              type="checkbox" 
              class="checkbox checkbox-primary" 
            />
            <span>Make profile publicly discoverable</span>
          </label>
          
          <label class="flex items-center gap-2 cursor-pointer">
            <input 
              v-model="editForm.preferences.notifications"
              type="checkbox" 
              class="checkbox checkbox-primary" 
            />
            <span>Enable notifications</span>
          </label>
        </div>

        <!-- Actions -->
        <div class="flex gap-3 pt-4">
          <SButton 
            @click="handleSaveProfile" 
            :disabled="isLoading"
            class="flex-1" 
            type="primary"
          >
            <span v-if="isLoading">Saving...</span>
            <span v-else>💾 Save Profile</span>
          </SButton>
          <SButton 
            @click="isEditProfileOpen = false" 
            class="flex-1" 
            type="secondary"
          >
            Cancel
          </SButton>
        </div>
      </div>
    </SDrawerRight>

    <!-- Share Profile Drawer -->
    <SDrawerRight v-model="isShareProfileOpen" title="🔗 Share Profile">
      <div class="space-y-6 p-6">
        <div>
          <label class="block text-sm font-medium mb-1">Target User Identity</label>
          <input 
            v-model="shareForm.targetIdentity"
            class="input input-bordered w-full" 
            placeholder="Paste their public identity key here..."
          />
          <div class="text-xs text-base-content/60 mt-1">
            The public identity key of the user you want to share with
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium mb-2">Access Level</label>
          <div class="space-y-2">
            <label 
              v-for="level in accessLevels" 
              :key="level.value"
              class="flex items-start gap-3 cursor-pointer p-3 border border-base-200 rounded-lg hover:bg-base-50"
            >
              <input 
                v-model="shareForm.accessLevel"
                :value="level.value"
                type="radio" 
                class="radio radio-primary mt-1" 
              />
              <div>
                <div class="font-medium">{{ level.label }}</div>
                <div class="text-sm text-base-content/60">{{ level.description }}</div>
              </div>
            </label>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">Custom Message (Optional)</label>
          <textarea 
            v-model="shareForm.customMessage"
            class="textarea textarea-bordered w-full" 
            placeholder="Add a personal message..."
            rows="3"
          />
        </div>

        <div class="flex gap-3 pt-4">
          <SButton 
            @click="handleShareProfile" 
            :disabled="isLoading || !shareForm.targetIdentity.trim()"
            class="flex-1" 
            type="primary"
          >
            <span v-if="isLoading">Sharing...</span>
            <span v-else">🔗 Share Profile</span>
          </SButton>
          <SButton 
            @click="isShareProfileOpen = false" 
            class="flex-1" 
            type="secondary"
          >
            Cancel
          </SButton>
        </div>
      </div>
    </SDrawerRight>
  </div>
</template>
