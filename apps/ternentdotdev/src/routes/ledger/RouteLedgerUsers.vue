<script setup>
import { computed, shallowRef, watch } from "vue";
import { SButton, SDrawerRight, SCard, SInput } from "ternent-ui/components";
import { useBreadcrumbs } from "../../module/breadcrumbs/useBreadcrumbs";
import { useLedger } from "../../module/ledger/useLedger";
import { useIdentity } from "../../module/identity/useIdentity";
import { useEncryption } from "../../module/encryption/useEncryption";
import IdentityAvatar from "@/module/identity/IdentityAvatar.vue";

useBreadcrumbs({
  path: "/ledger/users",
  name: "Users",
});

const { ledger, getCollection, addItem } = useLedger();
const { publicKeyPEM } = useIdentity();
const { publicKey: encryptionPublicKey } = useEncryption();

const users = shallowRef([]);
const permissions = shallowRef([]);

// Form states
const isAddUserDrawerOpen = shallowRef(false);
const isUserDetailDrawerOpen = shallowRef(false);
const selectedUser = shallowRef(null);
const newUserIdentity = shallowRef("");
const newUserEncryptionKey = shallowRef("");
const newUserName = shallowRef("");

watch(
  ledger,
  () => {
    users.value = [...(getCollection("users")?.data || [])];
    permissions.value = [...(getCollection("permissions")?.data || [])];
  },
  { immediate: true }
);

// Get current user
const currentUser = computed(() => {
  return users.value.find((user) => user.data.identity === publicKeyPEM.value);
});

// Get other users (excluding current user)
const otherUsers = computed(() => {
  return users.value.filter((user) => user.data.identity !== publicKeyPEM.value);
});

// Get permissions for a specific user
function getUserPermissions(userIdentity) {
  return permissions.value.filter(
    (permission) => permission.data.identity === userIdentity
  );
}

// Get shared permissions for a user (permissions shared with them)
function getSharedPermissions(userIdentity) {
  const userPermissionTitles = new Set(
    permissions.value
      .filter((p) => p.data.identity === userIdentity)
      .map((p) => p.data.title)
  );

  return permissions.value.filter(
    (permission) => 
      permission.data.identity !== userIdentity && 
      userPermissionTitles.has(permission.data.title)
  );
}

// Add new user to the ledger
async function handleAddUser() {
  if (!newUserIdentity.value.trim()) return;
  
  const userData = {
    identity: newUserIdentity.value.trim(),
    encryption: newUserEncryptionKey.value.trim() || null,
    name: newUserName.value.trim() || null,
    addedAt: new Date().toISOString(),
    addedBy: publicKeyPEM.value
  };
  
  await addItem(userData, "users");
  
  // Clear form
  newUserIdentity.value = "";
  newUserEncryptionKey.value = "";
  newUserName.value = "";
  isAddUserDrawerOpen.value = false;
}

// Register current user if not already registered
async function registerCurrentUser() {
  const userData = {
    identity: publicKeyPEM.value,
    encryption: encryptionPublicKey.value,
    name: "Me",
    addedAt: new Date().toISOString(),
    addedBy: publicKeyPEM.value,
    isSelf: true
  };
  
  await addItem(userData, "users");
}

function openUserDetail(user) {
  selectedUser.value = user;
  isUserDetailDrawerOpen.value = true;
}

function formatDate(dateString) {
  if (!dateString) return 'Unknown';
  try {
    return new Date(dateString).toLocaleDateString();
  } catch {
    return 'Invalid date';
  }
}</script>
<template>
  <div class="p-micro max-w-6xl">
    <!-- Header -->
    <div class="flex justify-between items-center mb-micro">
      <div>
        <h1 class="gradient-heading text-heading-lg">👥 Users</h1>
        <p class="text-subtle text-body-sm mt-1">Manage users and their permissions</p>
      </div>
      <div class="flex gap-micro">
        <SButton 
          v-if="!currentUser" 
          @click="registerCurrentUser" 
          variant="secondary"
          size="small"
        >
          🔐 Register Me
        </SButton>
        <SButton @click="isAddUserDrawerOpen = true" variant="primary" size="small">
          + Add User
        </SButton>
      </div>
    </div>

    <!-- Current User -->
    <div v-if="currentUser" class="mb-8">
      <h2 class="text-lg font-semibold mb-4">🔐 Your Identity</h2>
      
      <div class="card bg-base-100 shadow-sm border border-base-300">
        <div class="card-body p-4">
          <div class="flex items-center gap-4">
            <IdentityAvatar :identity="currentUser.data.identity" size="lg" />
            <div class="flex-1">
              <div class="flex items-center gap-2">
                <h3 class="font-semibold">{{ currentUser.data.name || 'You' }}</h3>
                <span class="badge badge-primary badge-sm">Owner</span>
              </div>
              <p class="text-sm text-base-content/70 mt-1">
                Identity: {{ currentUser.data.identity.substring(0, 40) }}...
              </p>
              <div class="flex gap-2 mt-2">
                <span class="badge badge-ghost badge-sm">
                  {{ getUserPermissions(currentUser.data.identity).length }} permissions owned
                </span>
                <span class="badge badge-ghost badge-sm">
                  Registered {{ formatDate(currentUser.data.addedAt) }}
                </span>
              </div>
            </div>
            <SButton @click="openUserDetail(currentUser)" type="ghost" class="btn-sm">
              View Details
            </SButton>
          </div>
        </div>
      </div>
    </div>

    <!-- No Current User State -->
    <div v-else class="mb-8">
      <div class="alert alert-warning">
        <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <div>
          <h3 class="font-bold">Register Your Identity</h3>
          <div class="text-sm">
            Register yourself in the ledger to enable full user management features.
          </div>
        </div>
      </div>
    </div>

    <!-- Other Users -->
    <div>
      <h2 class="text-lg font-semibold mb-4">👤 Other Users</h2>
      
      <div v-if="otherUsers.length === 0" class="text-center py-8 text-base-content/50">
        <div class="text-4xl mb-2">👥</div>
        <p>No other users yet</p>
        <p class="text-sm">Add users to start collaborating</p>
      </div>
      
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="user in otherUsers"
          :key="user.id"
          class="card bg-base-100 shadow-sm border border-base-300"
        >
          <div class="card-body p-4">
            <div class="flex items-start gap-3">
              <IdentityAvatar :identity="user.data.identity" />
              <div class="flex-1 min-w-0">
                <h3 class="font-semibold truncate">
                  {{ user.data.name || 'User' }}
                </h3>
                <p class="text-sm text-base-content/70 truncate">
                  {{ user.data.identity.substring(0, 20) }}...
                </p>
                <div class="flex gap-1 mt-2 flex-wrap">
                  <span class="badge badge-ghost badge-xs">
                    {{ getSharedPermissions(user.data.identity).length }} shared permissions
                  </span>
                  <span class="badge badge-ghost badge-xs">
                    Added {{ formatDate(user.data.addedAt) }}
                  </span>
                </div>
              </div>
              <SButton 
                @click="openUserDetail(user)" 
                type="ghost" 
                class="btn-sm"
              >
                👁️
              </SButton>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add User Drawer -->
    <SDrawerRight v-model="isAddUserDrawerOpen" title="Add New User">
      <div class="p-4 space-y-4">
        <div class="form-control">
          <label class="label">
            <span class="label-text">User Identity (Public Key)</span>
          </label>
          <textarea
            v-model="newUserIdentity"
            placeholder="User's public identity key"
            class="textarea textarea-bordered"
            rows="4"
          ></textarea>
        </div>
        
        <div class="form-control">
          <label class="label">
            <span class="label-text">Display Name (Optional)</span>
          </label>
          <input
            v-model="newUserName"
            type="text"
            placeholder="e.g., John Doe"
            class="input input-bordered"
          />
        </div>
        
        <div class="form-control">
          <label class="label">
            <span class="label-text">Encryption Key (Optional)</span>
          </label>
          <textarea
            v-model="newUserEncryptionKey"
            placeholder="User's public encryption key"
            class="textarea textarea-bordered"
            rows="3"
          ></textarea>
        </div>
        
        <div class="alert alert-info">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <div class="text-sm">
            Adding a user to the ledger enables you to share permissions with them.
            The encryption key is needed for secure permission sharing.
          </div>
        </div>
        
        <div class="flex gap-2">
          <SButton 
            @click="handleAddUser" 
            type="primary" 
            class="flex-1"
            :disabled="!newUserIdentity.trim()"
          >
            👤 Add User
          </SButton>
          <SButton @click="isAddUserDrawerOpen = false" type="ghost">
            Cancel
          </SButton>
        </div>
      </div>
    </SDrawerRight>

    <!-- User Detail Drawer -->
    <SDrawerRight v-model="isUserDetailDrawerOpen" title="User Details">
      <div v-if="selectedUser" class="p-4 space-y-4">
        <!-- User Info -->
        <div class="card bg-base-200">
          <div class="card-body p-4">
            <div class="flex items-center gap-3 mb-3">
              <IdentityAvatar :identity="selectedUser.data.identity" size="lg" />
              <div>
                <h3 class="font-semibold">{{ selectedUser.data.name || 'User' }}</h3>
                <p class="text-sm text-base-content/70">
                  {{ selectedUser.data.identity === publicKeyPEM ? 'You' : 'Other User' }}
                </p>
              </div>
            </div>
            
            <div class="space-y-2 text-sm">
              <div>
                <span class="font-medium">Identity:</span>
                <p class="font-mono text-xs break-all bg-base-100 p-2 rounded mt-1">
                  {{ selectedUser.data.identity }}
                </p>
              </div>
              
              <div v-if="selectedUser.data.encryption">
                <span class="font-medium">Encryption Key:</span>
                <p class="font-mono text-xs break-all bg-base-100 p-2 rounded mt-1">
                  {{ selectedUser.data.encryption.substring(0, 100) }}...
                </p>
              </div>
              
              <div class="flex gap-4">
                <div>
                  <span class="font-medium">Added:</span>
                  <span class="text-base-content/70">{{ formatDate(selectedUser.data.addedAt) }}</span>
                </div>
                <div v-if="selectedUser.data.addedBy !== selectedUser.data.identity">
                  <span class="font-medium">Added by:</span>
                  <span class="text-base-content/70">
                    {{ selectedUser.data.addedBy === publicKeyPEM ? 'You' : 'Other' }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Permissions -->
        <div>
          <h4 class="font-medium mb-2">🔐 Permissions</h4>
          
          <!-- Owned Permissions -->
          <div v-if="getUserPermissions(selectedUser.data.identity).length > 0" class="mb-4">
            <h5 class="text-sm font-medium mb-2">Owned Permissions</h5>
            <div class="space-y-2">
              <div
                v-for="permission in getUserPermissions(selectedUser.data.identity)"
                :key="permission.id"
                class="flex items-center justify-between p-2 bg-base-100 rounded"
              >
                <span class="text-sm">{{ permission.data.title }}</span>
                <span class="badge badge-primary badge-xs">Owner</span>
              </div>
            </div>
          </div>
          
          <!-- Shared Permissions -->
          <div v-if="getSharedPermissions(selectedUser.data.identity).length > 0">
            <h5 class="text-sm font-medium mb-2">Shared Permissions</h5>
            <div class="space-y-2">
              <div
                v-for="permission in getSharedPermissions(selectedUser.data.identity)"
                :key="permission.id"
                class="flex items-center justify-between p-2 bg-base-100 rounded"
              >
                <span class="text-sm">{{ permission.data.title }}</span>
                <span class="badge badge-secondary badge-xs">Shared</span>
              </div>
            </div>
          </div>
          
          <div v-if="getUserPermissions(selectedUser.data.identity).length === 0 && getSharedPermissions(selectedUser.data.identity).length === 0" 
               class="text-center py-4 text-base-content/50">
            <p class="text-sm">No permissions yet</p>
          </div>
        </div>

        <div class="flex gap-2">
          <SButton @click="isUserDetailDrawerOpen = false" type="ghost" class="flex-1">
            Close
          </SButton>
        </div>
      </div>
    </SDrawerRight>
  </div>
</template>
