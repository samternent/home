<script setup>
import { computed, shallowRef, watch } from "vue";
import { useRouter } from "vue-router";
import { SButton, SCard, SInput, STabs } from "ternent-ui/components";
import { useAppBuilder } from "@/module/builder/useAppBuilder.js";
import { useBreadcrumbs } from "@/module/breadcrumbs/useBreadcrumbs";

const props = defineProps({
  appId: {
    type: String,
    required: true,
  },
});

const router = useRouter();
const {
  getApp,
  getAppSchemas,
  getAppViews,
  updateApp,
  createSchema,
  createView,
} = useAppBuilder();

const app = computed(() => getApp(props.appId));
const schemas = computed(() => getAppSchemas(props.appId));
const views = computed(() => getAppViews(props.appId));

useBreadcrumbs({
  path: `/t/builder/app/${props.appId}`,
  name: app.value?.name || "App Editor",
});

const activeTab = shallowRef("overview");
const isEditing = shallowRef(false);

// Form data
const appForm = shallowRef({
  name: "",
  description: "",
  icon: "",
});

const schemaForm = shallowRef({
  name: "",
  fields: [],
});

const newField = shallowRef({
  name: "",
  type: "text",
  required: false,
});

// Watch for app changes
watch(
  app,
  (newApp) => {
    if (newApp) {
      appForm.value = {
        name: newApp.name,
        description: newApp.description,
        icon: newApp.icon,
      };
    }
  },
  { immediate: true }
);

// Available field types
const fieldTypes = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "email", label: "Email" },
  { value: "date", label: "Date" },
  { value: "boolean", label: "Checkbox" },
  { value: "select", label: "Dropdown" },
  { value: "textarea", label: "Long Text" },
];

async function saveApp() {
  await updateApp(props.appId, appForm.value);
  isEditing.value = false;
}

function addField() {
  if (!newField.value.name) return;

  schemaForm.value.fields.push({
    id: Date.now().toString(),
    name: newField.value.name,
    type: newField.value.type,
    required: newField.value.required,
  });

  newField.value = {
    name: "",
    type: "text",
    required: false,
  };
}

function removeField(fieldId) {
  const index = schemaForm.value.fields.findIndex((f) => f.id === fieldId);
  if (index !== -1) {
    schemaForm.value.fields.splice(index, 1);
  }
}

async function saveSchema() {
  if (!schemaForm.value.name || schemaForm.value.fields.length === 0) return;

  await createSchema(props.appId, schemaForm.value);

  // Reset form
  schemaForm.value = {
    name: "",
    fields: [],
  };
}

async function createListView(schema) {
  await createView(props.appId, {
    name: `${schema.name} List`,
    type: "list",
    schemaId: schema.id,
    config: {
      displayFields: schema.fields.slice(0, 3).map((f) => f.name),
    },
  });
}

function openRuntime() {
  router.push(`/t/builder/runtime/${props.appId}`);
}
</script>

<template>
  <div class="flex-1 p-6 max-w-6xl mx-auto" v-if="app">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-4">
        <div class="text-4xl">{{ app.icon }}</div>
        <div>
          <h1 v-if="!isEditing" class="text-3xl font-bold">{{ app.name }}</h1>
          <SInput
            v-else
            v-model="appForm.name"
            size="lg"
            class="text-3xl font-bold"
          />
          <p class="text-base-content/60">{{ app.description }}</p>
        </div>
      </div>

      <div class="flex gap-2">
        <SButton v-if="!isEditing" variant="outline" @click="isEditing = true">
          Edit App
        </SButton>
        <template v-else>
          <SButton variant="ghost" @click="isEditing = false">Cancel</SButton>
          <SButton @click="saveApp">Save</SButton>
        </template>

        <SButton variant="primary" @click="openRuntime">
          🚀 Launch App
        </SButton>
      </div>
    </div>

    <!-- Tabs -->
    <STabs
      v-model="activeTab"
      :tabs="[
        { id: 'overview', label: 'Overview' },
        { id: 'schemas', label: 'Data Models' },
        { id: 'views', label: 'Views' },
        { id: 'permissions', label: 'Permissions' },
      ]"
      class="mb-6"
    />

    <!-- Overview Tab -->
    <div v-if="activeTab === 'overview'" class="space-y-6">
      <div class="grid md:grid-cols-3 gap-6">
        <SCard>
          <div class="text-center space-y-2">
            <div class="text-3xl">📊</div>
            <h3 class="font-bold">{{ schemas.length }}</h3>
            <p class="text-sm text-base-content/60">Data Models</p>
          </div>
        </SCard>

        <SCard>
          <div class="text-center space-y-2">
            <div class="text-3xl">👁️</div>
            <h3 class="font-bold">{{ views.length }}</h3>
            <p class="text-sm text-base-content/60">Views</p>
          </div>
        </SCard>

        <SCard>
          <div class="text-center space-y-2">
            <div class="text-3xl">⚡</div>
            <h3 class="font-bold">Ready</h3>
            <p class="text-sm text-base-content/60">Status</p>
          </div>
        </SCard>
      </div>

      <SCard class="space-y-4">
        <h2 class="text-xl font-bold">App Configuration</h2>
        <div v-if="isEditing" class="grid md:grid-cols-2 gap-4">
          <div>
            <label class="label">App Name</label>
            <SInput v-model="appForm.name" />
          </div>
          <div>
            <label class="label">Icon (Emoji)</label>
            <SInput v-model="appForm.icon" />
          </div>
          <div class="md:col-span-2">
            <label class="label">Description</label>
            <textarea
              v-model="appForm.description"
              class="textarea textarea-bordered w-full"
              rows="3"
            ></textarea>
          </div>
        </div>
        <div v-else>
          <p><strong>Name:</strong> {{ app.name }}</p>
          <p><strong>Description:</strong> {{ app.description }}</p>
          <p>
            <strong>Created:</strong>
            {{ new Date(app.createdAt).toLocaleDateString() }}
          </p>
          <p>
            <strong>Updated:</strong>
            {{ new Date(app.updatedAt).toLocaleDateString() }}
          </p>
        </div>
      </SCard>
    </div>

    <!-- Schemas Tab -->
    <div v-if="activeTab === 'schemas'" class="space-y-6">
      <!-- Create Schema Form -->
      <SCard class="space-y-4">
        <h2 class="text-xl font-bold">Create Data Model</h2>

        <div>
          <label class="label">Model Name</label>
          <SInput
            v-model="schemaForm.name"
            placeholder="e.g. Users, Products, Tasks"
          />
        </div>

        <div class="space-y-3">
          <label class="label">Fields</label>

          <!-- Add Field Form -->
          <div class="grid grid-cols-12 gap-2 items-end">
            <div class="col-span-4">
              <SInput v-model="newField.name" placeholder="Field name" />
            </div>
            <div class="col-span-3">
              <select
                v-model="newField.type"
                class="select select-bordered w-full"
              >
                <option
                  v-for="type in fieldTypes"
                  :key="type.value"
                  :value="type.value"
                >
                  {{ type.label }}
                </option>
              </select>
            </div>
            <div class="col-span-2">
              <label class="label cursor-pointer">
                <input
                  type="checkbox"
                  v-model="newField.required"
                  class="checkbox"
                />
                <span class="label-text ml-2">Required</span>
              </label>
            </div>
            <div class="col-span-3">
              <SButton @click="addField" :disabled="!newField.name"
                >Add Field</SButton
              >
            </div>
          </div>

          <!-- Fields List -->
          <div v-if="schemaForm.fields.length > 0" class="space-y-2">
            <div
              v-for="field in schemaForm.fields"
              :key="field.id"
              class="flex items-center justify-between p-3 bg-base-200 rounded-lg"
            >
              <div>
                <span class="font-medium">{{ field.name }}</span>
                <span class="text-sm text-base-content/60 ml-2"
                  >({{ field.type }})</span
                >
                <span
                  v-if="field.required"
                  class="badge badge-error badge-xs ml-2"
                  >Required</span
                >
              </div>
              <SButton size="sm" variant="ghost" @click="removeField(field.id)"
                >Remove</SButton
              >
            </div>
          </div>
        </div>

        <SButton
          @click="saveSchema"
          :disabled="!schemaForm.name || schemaForm.fields.length === 0"
          class="btn-primary"
        >
          Create Model
        </SButton>
      </SCard>

      <!-- Existing Schemas -->
      <div v-if="schemas.length > 0" class="space-y-4">
        <h2 class="text-xl font-bold">Existing Models</h2>
        <div class="grid gap-4">
          <SCard v-for="schema in schemas" :key="schema.id" class="space-y-3">
            <div class="flex items-center justify-between">
              <h3 class="font-bold text-lg">{{ schema.name }}</h3>
              <SButton size="sm" @click="createListView(schema)"
                >Create List View</SButton
              >
            </div>
            <div class="space-y-1">
              <div
                v-for="field in schema.fields"
                :key="field.id"
                class="text-sm text-base-content/70"
              >
                <span class="font-medium">{{ field.name }}</span>
                <span class="ml-2">({{ field.type }})</span>
                <span v-if="field.required" class="text-error ml-1">*</span>
              </div>
            </div>
          </SCard>
        </div>
      </div>
    </div>

    <!-- Views Tab -->
    <div v-if="activeTab === 'views'" class="space-y-6">
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-bold">App Views</h2>
        <SButton variant="outline">Create View</SButton>
      </div>

      <div v-if="views.length === 0" class="text-center py-12">
        <div class="text-4xl mb-4">👁️</div>
        <h3 class="text-lg font-medium mb-2">No views yet</h3>
        <p class="text-base-content/60 mb-4">
          Create data models first, then build views to display them
        </p>
      </div>

      <div v-else class="grid gap-4">
        <SCard v-for="view in views" :key="view.id" class="space-y-3">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="font-bold">{{ view.name }}</h3>
              <p class="text-sm text-base-content/60">{{ view.type }} view</p>
            </div>
            <div class="flex gap-2">
              <SButton size="sm" variant="outline">Edit</SButton>
              <SButton size="sm">Preview</SButton>
            </div>
          </div>
        </SCard>
      </div>
    </div>

    <!-- Permissions Tab -->
    <div v-if="activeTab === 'permissions'" class="space-y-6">
      <h2 class="text-xl font-bold">Access Control</h2>
      <SCard>
        <p class="text-center py-8 text-base-content/60">
          Permission system coming soon...
        </p>
      </SCard>
    </div>
  </div>

  <div v-else class="flex-1 flex items-center justify-center">
    <div class="text-center">
      <div class="text-4xl mb-4">❌</div>
      <h2 class="text-xl font-bold mb-2">App Not Found</h2>
      <p class="text-base-content/60">
        The requested app could not be found in your ledger.
      </p>
      <RouterLink to="/t/builder" class="btn btn-outline mt-4">
        Back to Builder
      </RouterLink>
    </div>
  </div>
</template>
