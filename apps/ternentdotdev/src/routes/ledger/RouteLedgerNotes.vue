<script setup>
import { computed, shallowRef, watch } from "vue";
import { SButton, SDrawerRight } from "ternent-ui/components";
import { useBreadcrumbs } from "../../module/breadcrumbs/useBreadcrumbs";
import { useLedger } from "../../module/ledger/useLedger";
import { useIdentity } from "../../module/identity/useIdentity";
import IdentityAvatar from "@/module/identity/IdentityAvatar.vue";

useBreadcrumbs({
  path: "/ledger/notes",
  name: "Notes",
});

const { ledger, getCollection, addItem } = useLedger();
const { publicKeyPEM } = useIdentity();

const notes = shallowRef([]);
const permissions = shallowRef([]);

// Form states
const isCreateDrawerOpen = shallowRef(false);
const isViewDrawerOpen = shallowRef(false);
const selectedNote = shallowRef(null);
const newNote = shallowRef({
  title: "",
  content: "",
  tags: "",
  isPrivate: false,
  permission: ""
});

watch(
  ledger,
  () => {
    notes.value = [...(getCollection("notes")?.data || [])];
    permissions.value = [...(getCollection("permissions")?.data || [])];
  },
  { immediate: true }
);

// Get my permissions for sharing notes
const myPermissions = computed(() => {
  return permissions.value.filter(
    (permission) => permission.data.identity === publicKeyPEM.value
  );
});

// Get notes by category
const notesByTag = computed(() => {
  const grouped = {};
  notes.value.forEach(note => {
    const tags = note.data?.tags ? note.data.tags.split(',').map(t => t.trim()) : ['Untagged'];
    tags.forEach(tag => {
      if (!grouped[tag]) grouped[tag] = [];
      grouped[tag].push(note);
    });
  });
  return grouped;
});

// Create new note
async function handleCreateNote() {
  if (!newNote.value.title.trim() || !newNote.value.content.trim()) return;
  
  const noteData = {
    title: newNote.value.title.trim(),
    content: newNote.value.content.trim(),
    tags: newNote.value.tags.trim(),
    created: new Date().toISOString(),
    author: publicKeyPEM.value,
    wordCount: newNote.value.content.trim().split(/\s+/).length
  };
  
  // Add to ledger with optional permission for encryption
  // If private is checked but no permission selected (or none available), store unencrypted with a warning
  const permission = newNote.value.isPrivate && newNote.value.permission 
    ? newNote.value.permission 
    : null;
    
  await addItem(noteData, "notes", permission);
  
  // Clear form
  newNote.value = {
    title: "",
    content: "",
    tags: "",
    isPrivate: false,
    permission: ""
  };
  isCreateDrawerOpen.value = false;
}

function openNote(note) {
  selectedNote.value = note;
  isViewDrawerOpen.value = true;
}

function formatDate(dateString) {
  if (!dateString) return 'Unknown';
  try {
    return new Date(dateString).toLocaleDateString();
  } catch {
    return 'Invalid date';
  }
}

function getPreview(content) {
  if (!content) return '';
  return content.length > 150 ? content.substring(0, 150) + '...' : content;
}
</script>

<template>
  <div class="p-4 max-w-6xl">
    <!-- Header -->
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-2xl font-bold">📝 Notes</h1>
        <p class="text-base-content/70">Create and manage encrypted notes and documents</p>
      </div>
      <SButton @click="isCreateDrawerOpen = true" type="primary">
        + New Note
      </SButton>
    </div>

    <!-- Notes Overview -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div class="stat bg-base-100 rounded-lg shadow-sm border border-base-300 p-4">
        <div class="stat-title">Total Notes</div>
        <div class="stat-value text-primary">{{ notes.length }}</div>
      </div>
      <div class="stat bg-base-100 rounded-lg shadow-sm border border-base-300 p-4">
        <div class="stat-title">Categories</div>
        <div class="stat-value text-secondary">{{ Object.keys(notesByTag).length }}</div>
      </div>
      <div class="stat bg-base-100 rounded-lg shadow-sm border border-base-300 p-4">
        <div class="stat-title">Total Words</div>
        <div class="stat-value text-accent">
          {{ notes.reduce((sum, note) => sum + (note.data?.wordCount || 0), 0) }}
        </div>
      </div>
      <div class="stat bg-base-100 rounded-lg shadow-sm border border-base-300 p-4">
        <div class="stat-title">This Week</div>
        <div class="stat-value text-info">
          {{ notes.filter(note => {
            const noteDate = new Date(note.data?.created);
            const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            return noteDate > weekAgo;
          }).length }}
        </div>
      </div>
    </div>

    <!-- Notes by Category -->
    <div v-if="notes.length === 0" class="text-center py-12 text-base-content/50">
      <div class="text-6xl mb-4">📝</div>
      <h3 class="text-lg font-semibold mb-2">No notes yet</h3>
      <p class="text-base-content/70">Create your first note to get started</p>
    </div>

    <div v-else class="space-y-8">
      <div v-for="(categoryNotes, category) in notesByTag" :key="category">
        <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
          <span class="badge badge-outline">{{ category }}</span>
          <span class="text-sm text-base-content/50">({{ categoryNotes.length }})</span>
        </h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="note in categoryNotes"
            :key="note.id"
            @click="openNote(note)"
            class="card bg-base-100 shadow-sm border border-base-300 cursor-pointer hover:shadow-md transition-shadow"
          >
            <div class="card-body p-4">
              <div class="flex justify-between items-start mb-2">
                <h3 class="font-semibold truncate flex-1">{{ note.data?.title || 'Untitled' }}</h3>
                <span v-if="note.encrypted" class="badge badge-warning badge-sm ml-2">🔒</span>
              </div>
              
              <p class="text-sm text-base-content/70 mb-3">
                {{ note.encrypted ? 'Content is encrypted' : getPreview(note.data?.content) }}
              </p>
              
              <div class="flex justify-between items-center text-xs text-base-content/50">
                <span>{{ formatDate(note.data?.created) }}</span>
                <div class="flex items-center gap-2">
                  <span v-if="note.data?.wordCount">{{ note.data.wordCount }} words</span>
                  <IdentityAvatar :identity="note.data?.author" size="xs" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Note Drawer -->
    <SDrawerRight v-model="isCreateDrawerOpen" title="Create New Note">
      <div class="flex flex-col h-full -m-4">
        <div class="flex-1 overflow-y-auto p-4 space-y-4">
          <div class="form-control">
            <label class="label">
              <span class="label-text">Title</span>
            </label>
            <input
              v-model="newNote.title"
              type="text"
              placeholder="Note title"
              class="input input-bordered w-full"
              @keyup.enter="$refs.contentTextarea?.focus()"
            />
          </div>
          
          <div class="form-control">
            <label class="label">
              <span class="label-text">Content</span>
            </label>
            <textarea
              ref="contentTextarea"
              v-model="newNote.content"
              placeholder="Write your note content here..."
              class="textarea textarea-bordered w-full min-h-64"
              rows="12"
            ></textarea>
          </div>
          
          <div class="form-control">
            <label class="label">
              <span class="label-text">Tags (comma separated)</span>
            </label>
            <input
              v-model="newNote.tags"
              type="text"
              placeholder="work, ideas, personal"
              class="input input-bordered w-full"
            />
          </div>
          
          <div class="form-control">
            <label class="label cursor-pointer">
              <span class="label-text">Private (encrypted)</span>
              <input 
                v-model="newNote.isPrivate" 
                type="checkbox" 
                class="checkbox"
              />
            </label>
          </div>
          
          <div v-if="newNote.isPrivate" class="form-control">
            <label class="label">
              <span class="label-text">Permission</span>
            </label>
            <select v-model="newNote.permission" class="select select-bordered w-full">
              <option value="">{{ myPermissions.length === 0 ? 'No permissions available' : 'Select permission...' }}</option>
              <option 
                v-for="permission in myPermissions" 
                :key="permission.id"
                :value="permission.data.title"
              >
                {{ permission.data.title }}
              </option>
            </select>
            <div v-if="myPermissions.length === 0" class="label">
              <span class="label-text-alt text-warning">
                ⚠️ No permissions created yet. Note will be stored unencrypted.
              </span>
            </div>
          </div>
          
          <div class="alert alert-info">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <div class="text-sm">
              Notes are stored in the blockchain ledger. 
              <span v-if="newNote.isPrivate && myPermissions.length === 0">
                Create permissions first to enable encryption.
              </span>
              <span v-else-if="newNote.isPrivate">
                Private notes are encrypted using the selected permission.
              </span>
              <span v-else>
                Public notes are stored unencrypted.
              </span>
            </div>
          </div>
        </div>
        
        <div class="border-t border-base-300 p-4 bg-base-100">
          <div class="flex gap-2">
            <SButton 
              @click="handleCreateNote" 
              type="primary" 
              class="flex-1"
              :disabled="!newNote.title.trim() || !newNote.content.trim()"
            >
              📝 Create Note
            </SButton>
            <SButton @click="isCreateDrawerOpen = false" type="ghost">
              Cancel
            </SButton>
          </div>
        </div>
      </div>
    </SDrawerRight>

    <!-- View Note Drawer -->
    <SDrawerRight v-model="isViewDrawerOpen" title="View Note">
      <div v-if="selectedNote" class="flex flex-col h-full -m-4">
        <div class="flex-1 overflow-y-auto p-4 space-y-4">
          <div class="card bg-base-200">
            <div class="card-body p-4">
              <div class="flex justify-between items-start mb-3">
                <h3 class="font-semibold text-lg">{{ selectedNote.data?.title || 'Untitled' }}</h3>
                <span v-if="selectedNote.encrypted" class="badge badge-warning">🔒 Encrypted</span>
              </div>
              
              <div class="flex items-center gap-3 text-sm text-base-content/70 mb-4">
                <IdentityAvatar :identity="selectedNote.data?.author" size="sm" />
                <span>{{ formatDate(selectedNote.data?.created) }}</span>
                <span v-if="selectedNote.data?.wordCount">{{ selectedNote.data.wordCount }} words</span>
                <span v-if="selectedNote.data?.tags" class="badge badge-outline badge-sm">
                  {{ selectedNote.data.tags }}
                </span>
              </div>
            </div>
          </div>

          <div class="card bg-base-100">
            <div class="card-body p-4">
              <div v-if="selectedNote.encrypted" class="text-center py-8 text-base-content/50">
                <div class="text-4xl mb-2">🔒</div>
                <p>This note is encrypted</p>
                <p class="text-sm">You need the proper permission to decrypt it</p>
              </div>
              <div v-else class="prose max-w-none">
                <p class="whitespace-pre-wrap">{{ selectedNote.data?.content }}</p>
              </div>
            </div>
          </div>
        </div>

        <div class="border-t border-base-300 p-4 bg-base-100">
          <div class="flex gap-2">
            <SButton @click="isViewDrawerOpen = false" type="ghost" class="flex-1">
              Close
            </SButton>
          </div>
        </div>
      </div>
    </SDrawerRight>
  </div>
</template>
