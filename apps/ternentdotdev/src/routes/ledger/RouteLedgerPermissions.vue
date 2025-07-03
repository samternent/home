<script setup>
import { computed, shallowRef, watch } from "vue";
import { SButton, SDrawerRight } from "ternent-ui/components";
import { useBreadcrumbs } from "../../module/breadcrumbs/useBreadcrumbs";
import { useLedger } from "../../module/ledger/useLedger";
import { useIdentity } from "../../module/identity/useIdentity";
import IdentityAvatar from "@/module/identity/IdentityAvatar.vue";

useBreadcrumbs({
  path: "/ledger/permissions",
  name: "Permissions",
});

const { ledger, getCollection, createPermission, addUserPermission } = useLedger();
const { publicKeyPEM } = useIdentity();

const permissions = shallowRef([]);
const users = shallowRef([]);

// Form states
const newPermissionTitle = shallowRef("");
const isCreateDrawerOpen = shallowRef(false);
const isManageDrawerOpen = shallowRef(false);
const selectedPermission = shallowRef(null);
const selectedUser = shallowRef("");
const userEncryptionKey = shallowRef("");

watch(
  ledger,
  () => {
    permissions.value = [...(getCollection("permissions")?.data || [])];
    users.value = [...(getCollection("users")?.data || [])];
  },
  { immediate: true }
);

// Get permissions owned by current user
const myPermissions = computed(() => {
  return permissions.value.filter(
    (permission) => permission.data.identity === publicKeyPEM.value
  );
});

// Get permissions shared with current user
const sharedPermissions = computed(() => {
  return permissions.value.filter(
    (permission) => permission.data.identity !== publicKeyPEM.value
  );
});

// Get users for a specific permission
function getPermissionUsers(permissionTitle) {
  return permissions.value.filter(
    (permission) => permission.data.title === permissionTitle
  );
}

// Create new permission
async function handleCreatePermission() {
  if (!newPermissionTitle.value.trim()) return;
  
  await createPermission(newPermissionTitle.value.trim());
  newPermissionTitle.value = "";
  isCreateDrawerOpen.value = false;
}

// Share permission with user
async function handleSharePermission() {
  if (!selectedPermission.value || !selectedUser.value || !userEncryptionKey.value) return;
  
  await addUserPermission(
    selectedPermission.value.data.title,
    selectedUser.value,
    userEncryptionKey.value
  );
  
  selectedUser.value = "";
  userEncryptionKey.value = "";
  isManageDrawerOpen.value = false;
}

function openManageDrawer(permission) {
  selectedPermission.value = permission;
  isManageDrawerOpen.value = true;
}</script>
<template>
  <div class="p-4 max-w-6xl">
    <!-- Header -->
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-2xl font-bold">🔐 Permissions</h1>
        <p class="text-base-content/70">Manage encrypted permissions and access control</p>
      </div>
      <SButton @click="isCreateDrawerOpen = true" type="primary">
        + Create Permission
      </SButton>
    </div>

    <!-- My Permissions -->
    <div class="mb-8">
      <h2 class="text-lg font-semibold mb-4">📋 My Permissions</h2>
      
      <div v-if="myPermissions.length === 0" class="text-center py-8 text-base-content/50">
        <div class="text-4xl mb-2">🔑</div>
        <p>No permissions created yet</p>
        <p class="text-sm">Create your first permission to get started</p>
      </div>
      
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="permission in myPermissions"
          :key="permission.id"
          class="card bg-base-100 shadow-sm border border-base-300"
        >
          <div class="card-body p-4">
            <div class="flex justify-between items-start">
              <div class="flex-1">
                <h3 class="font-semibold">{{ permission.data.title }}</h3>
                <p class="text-sm text-base-content/70 mt-1">
                  Owner permission
                </p>
                <div class="mt-2">
                  <span class="badge badge-primary badge-sm">
                    {{ getPermissionUsers(permission.data.title).length }} users
                  </span>
                </div>
              </div>
              <SButton 
                @click="openManageDrawer(permission)"
                type="ghost" 
                class="btn-sm"
              >
                ⚙️
              </SButton>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Shared Permissions -->
    <div v-if="sharedPermissions.length > 0">
      <h2 class="text-lg font-semibold mb-4">🤝 Shared with Me</h2>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="permission in sharedPermissions"
          :key="permission.id"
          class="card bg-base-100 shadow-sm border border-base-300"
        >
          <div class="card-body p-4">
            <div class="flex justify-between items-start">
              <div class="flex-1">
                <h3 class="font-semibold">{{ permission.data.title }}</h3>
                <div class="flex items-center gap-2 mt-1">
                  <IdentityAvatar :identity="permission.data.identity" size="sm" />
                  <span class="text-sm text-base-content/70">Shared by owner</span>
                </div>
              </div>
              <span class="badge badge-secondary badge-sm">
                Shared
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Permission Drawer -->
    <SDrawerRight v-model="isCreateDrawerOpen" title="Create New Permission">
      <div class="p-4 space-y-4">
        <div class="form-control">
          <label class="label">
            <span class="label-text">Permission Title</span>
          </label>
          <input
            v-model="newPermissionTitle"
            type="text"
            placeholder="e.g., Project Alpha Access"
            class="input input-bordered"
            @keyup.enter="handleCreatePermission"
          />
        </div>
        
        <div class="alert alert-info">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <div>
            <h3 class="font-bold">About Permissions</h3>
            <div class="text-sm">
              Permissions create encrypted access tokens that can be shared with users.
              Each permission generates its own encryption keys.
            </div>
          </div>
        </div>
        
        <div class="flex gap-2">
          <SButton 
            @click="handleCreatePermission" 
            type="primary" 
            class="flex-1"
            :disabled="!newPermissionTitle.trim()"
          >
            🔑 Create Permission
          </SButton>
          <SButton @click="isCreateDrawerOpen = false" type="ghost">
            Cancel
          </SButton>
        </div>
      </div>
    </SDrawerRight>

    <!-- Manage Permission Drawer -->
    <SDrawerRight v-model="isManageDrawerOpen" title="Manage Permission">
      <div v-if="selectedPermission" class="p-4 space-y-4">
        <div class="card bg-base-200">
          <div class="card-body p-4">
            <h3 class="font-semibold">{{ selectedPermission.data.title }}</h3>
            <p class="text-sm text-base-content/70">
              Permission ID: {{ selectedPermission.id.substring(0, 8) }}...
            </p>
          </div>
        </div>

        <!-- Current Users -->
        <div>
          <h4 class="font-medium mb-2">Current Users</h4>
          <div class="space-y-2">
            <div
              v-for="user in getPermissionUsers(selectedPermission.data.title)"
              :key="user.id"
              class="flex items-center gap-3 p-2 bg-base-100 rounded"
            >
              <IdentityAvatar :identity="user.data.identity" size="sm" />
              <span class="text-sm flex-1">
                {{ user.data.identity === publicKeyPEM ? 'You (Owner)' : 'Shared User' }}
              </span>
            </div>
          </div>
        </div>

        <!-- Share with User -->
        <div class="divider">Share Permission</div>
        
        <div class="form-control">
          <label class="label">
            <span class="label-text">User Identity</span>
          </label>
          <select v-model="selectedUser" class="select select-bordered">
            <option value="">Select a user...</option>
            <option 
              v-for="user in users" 
              :key="user.id"
              :value="user.data.identity"
            >
              {{ user.data.identity === publicKeyPEM ? 'You' : user.data.identity.substring(0, 20) + '...' }}
            </option>
          </select>
        </div>
        
        <div class="form-control">
          <label class="label">
            <span class="label-text">User's Encryption Key</span>
          </label>
          <textarea
            v-model="userEncryptionKey"
            placeholder="User's public encryption key"
            class="textarea textarea-bordered"
            rows="3"
          ></textarea>
        </div>
        
        <div class="alert alert-warning">
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <div class="text-sm">
            You need the user's public encryption key to share permissions securely.
          </div>
        </div>
        
        <div class="flex gap-2">
          <SButton 
            @click="handleSharePermission" 
            type="primary" 
            class="flex-1"
            :disabled="!selectedUser || !userEncryptionKey.trim()"
          >
            🤝 Share Permission
          </SButton>
          <SButton @click="isManageDrawerOpen = false" type="ghost">
            Close
          </SButton>
        </div>
      </div>
    </SDrawerRight>
  </div>
</template>
