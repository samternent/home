<script setup>
import { computed, shallowRef, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { SButton, SCard, SInput, STabs } from "ternent-ui/components";
import { useBreadcrumbs } from "@/module/breadcrumbs/useBreadcrumbs";
import { useAppBuilder } from "@/module/builder/useAppBuilder";

const props = defineProps({
  appId: {
    type: String,
    required: true,
  },
});

const router = useRouter();
const route = useRoute();
const {
  getApp,
  updateApp,
  getAppSchemas,
  createSchema,
  updateSchema,
  removeSchema,
  getAppViews,
  createView,
  updateView,
  removeView,
} = useAppBuilder();

// Get app data
const app = computed(() => getApp(props.appId));
const schemas = computed(() => getAppSchemas(props.appId));
const views = computed(() => getAppViews(props.appId));

useBreadcrumbs({
  path: `/t/builder/app/${props.appId}/design`,
  name: computed(() => (app.value ? `Design ${app.value.name}` : "Design App")),
});

const activeTab = shallowRef("overview");
const isEditing = shallowRef(false);

// Form data
const appForm = shallowRef({
  name: "",
  description: "",
  icon: "",
  category: "",
  color: "",
});

const schemaForm = shallowRef({
  name: "",
  fields: [],
});

const viewForm = shallowRef({
  name: "",
  type: "table",
  config: {},
});

const newField = shallowRef({
  name: "",
  type: "text",
  required: false,
});

const fieldTypes = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "email", label: "Email" },
  { value: "date", label: "Date" },
  { value: "boolean", label: "Yes/No" },
  { value: "select", label: "Dropdown" },
  { value: "textarea", label: "Long Text" },
];

const viewTypes = [
  { value: "table", label: "Table View" },
  { value: "kanban", label: "Kanban Board" },
  { value: "calendar", label: "Calendar" },
  { value: "chart", label: "Chart" },
];

// Watch for app changes
watch(
  () => app.value,
  (newApp) => {
    if (newApp) {
      appForm.value = {
        name: newApp.name || "",
        description: newApp.description || "",
        icon: newApp.icon || "📱",
        category: newApp.category || "custom",
        color: newApp.color || "primary",
      };
    }
  },
  { immediate: true }
);

function startEditing() {
  isEditing.value = true;
}

async function saveChanges() {
  if (!app.value) return;

  try {
    await updateApp(props.appId, {
      ...appForm.value,
      updatedAt: new Date().toISOString(),
    });

    isEditing.value = false;
  } catch (error) {
    console.error("Failed to save app changes:", error);
  }
}

function cancelEditing() {
  // Reset form
  if (app.value) {
    appForm.value = {
      name: app.value.name || "",
      description: app.value.description || "",
      icon: app.value.icon || "📱",
      category: app.value.category || "custom",
      color: app.value.color || "primary",
    };
  }
  isEditing.value = false;
}

function addField() {
  if (newField.value.name.trim()) {
    schemaForm.value.fields.push({
      ...newField.value,
      id: Date.now().toString(),
    });

    // Reset form
    newField.value = {
      name: "",
      type: "text",
      required: false,
    };
  }
}

function removeField(fieldId) {
  schemaForm.value.fields = schemaForm.value.fields.filter(
    (f) => f.id !== fieldId
  );
}

async function addSchema() {
  if (schemaForm.value.name.trim() && schemaForm.value.fields.length > 0) {
    try {
      await createSchema(props.appId, {
        ...schemaForm.value,
        createdAt: new Date().toISOString(),
      });

      // Reset form
      schemaForm.value = {
        name: "",
        fields: [],
      };
    } catch (error) {
      console.error("Failed to add schema:", error);
    }
  }
}

async function removeSchemaById(schemaId) {
  try {
    await removeSchema(props.appId, schemaId);
  } catch (error) {
    console.error("Failed to remove schema:", error);
  }
}

async function addView() {
  if (viewForm.value.name.trim()) {
    try {
      await createView(props.appId, {
        ...viewForm.value,
        createdAt: new Date().toISOString(),
      });

      // Reset form
      viewForm.value = {
        name: "",
        type: "table",
        config: {},
      };
    } catch (error) {
      console.error("Failed to add view:", error);
    }
  }
}

async function removeViewById(viewId) {
  try {
    await removeView(props.appId, viewId);
  } catch (error) {
    console.error("Failed to remove view:", error);
  }
}

function viewApp() {
  router.push(`/t/ledger/app/${props.appId}`);
}
</script>

<template>
  <div class="flex-1 p-6 max-w-6xl mx-auto">
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-3xl font-bold">
          {{ app?.icon || "📱" }} Design {{ app?.name || "App" }}
        </h1>
        <p class="text-base-content/60">
          Configure your app structure and views
        </p>
      </div>
      <div v-if="app" class="space-x-2">
        <SButton @click="viewApp" class="btn-primary">
          <span class="mr-2">🚀</span>
          View App
        </SButton>
        <SButton :to="`/t/builder/app/${props.appId}`" class="btn-outline">
          <span class="mr-2">📊</span>
          App Dashboard
        </SButton>
        <SButton to="/t/builder/apps" class="btn-outline">
          <span class="mr-2">🏠</span>
          All Apps
        </SButton>
      </div>
    </div>

    <div v-if="!app" class="text-center py-12">
      <div class="text-6xl mb-4">🚀</div>
      <h2 class="text-2xl font-bold mb-2">App Not Found</h2>
      <p class="text-base-content/60 mb-6">
        The requested app doesn't exist or couldn't be loaded.
      </p>
      <SButton to="/t/builder/apps" class="btn-primary">
        View All Apps
      </SButton>
    </div>

    <div v-else>
      <!-- Tabs -->
      <STabs
        v-model="activeTab"
        :items="[
          { key: 'overview', label: 'Overview' },
          { key: 'schema', label: 'Data Structure' },
          { key: 'views', label: 'Views' },
          { key: 'preview', label: 'Preview' },
        ]"
        path=""
        class="mb-6"
      />

      <!-- Overview Tab -->
      <SCard v-if="activeTab === 'overview'" class="space-y-6">
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-semibold">App Overview</h2>
          <SButton
            v-if="!isEditing"
            @click="startEditing"
            class="btn-primary btn-sm"
          >
            Edit
          </SButton>
          <div v-else class="space-x-2">
            <SButton @click="saveChanges" class="btn-primary btn-sm"
              >Save</SButton
            >
            <SButton @click="cancelEditing" class="btn-outline btn-sm"
              >Cancel</SButton
            >
          </div>
        </div>

        <div v-if="!isEditing" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 class="font-medium text-base-content/70 mb-1">Name</h3>
              <p class="text-lg">{{ app.name }}</p>
            </div>
            <div>
              <h3 class="font-medium text-base-content/70 mb-1">Icon</h3>
              <p class="text-2xl">{{ app.icon }}</p>
            </div>
          </div>

          <div>
            <h3 class="font-medium text-base-content/70 mb-1">Description</h3>
            <p>{{ app.description }}</p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 class="font-medium text-base-content/70 mb-1">Category</h3>
              <p class="capitalize">{{ app.category }}</p>
            </div>
            <div>
              <h3 class="font-medium text-base-content/70 mb-1">Color Theme</h3>
              <p class="capitalize">{{ app.color }}</p>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 class="font-medium text-base-content/70 mb-1">Data Types</h3>
              <p class="text-lg">{{ schemas.length }} configured</p>
            </div>
            <div>
              <h3 class="font-medium text-base-content/70 mb-1">Views</h3>
              <p class="text-lg">{{ views.length }} configured</p>
            </div>
          </div>
        </div>

        <div v-else class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SInput
              v-model="appForm.name"
              label="App Name"
              placeholder="My Awesome App"
            />
            <SInput v-model="appForm.icon" label="Icon" placeholder="📱" />
          </div>

          <SInput
            v-model="appForm.description"
            label="Description"
            placeholder="What does your app do?"
          />

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SInput
              v-model="appForm.category"
              label="Category"
              placeholder="productivity"
            />
            <SInput
              v-model="appForm.color"
              label="Color Theme"
              placeholder="primary"
            />
          </div>
        </div>
      </SCard>

      <!-- Schema Tab -->
      <div v-if="activeTab === 'schema'" class="space-y-6">
        <!-- Add New Schema -->
        <SCard class="space-y-4">
          <h2 class="text-xl font-semibold">Add Data Type</h2>

          <SInput
            v-model="schemaForm.name"
            label="Data Type Name"
            placeholder="e.g., Tasks, Contacts, Products"
          />

          <div class="space-y-3">
            <h3 class="font-medium">Fields</h3>

            <!-- Add Field Form -->
            <div class="flex gap-2 items-end">
              <SInput
                v-model="newField.name"
                placeholder="Field name"
                class="flex-1"
                size="sm"
              />
              <select v-model="newField.type" class="select select-sm">
                <option
                  v-for="type in fieldTypes"
                  :key="type.value"
                  :value="type.value"
                >
                  {{ type.label }}
                </option>
              </select>
              <label class="flex items-center gap-1 text-sm">
                <input
                  type="checkbox"
                  v-model="newField.required"
                  class="checkbox checkbox-sm"
                />
                Required
              </label>
              <SButton @click="addField" size="sm" class="btn-primary"
                >Add Field</SButton
              >
            </div>

            <!-- Current Fields -->
            <div class="space-y-2">
              <div
                v-for="field in schemaForm.fields"
                :key="field.id"
                class="flex items-center justify-between p-2 bg-base-200 rounded"
              >
                <div class="flex items-center gap-2">
                  <span class="font-medium">{{ field.name }}</span>
                  <span class="text-xs text-base-content/60"
                    >({{ field.type }})</span
                  >
                  <span v-if="field.required" class="text-xs text-error"
                    >Required</span
                  >
                </div>
                <button
                  @click="removeField(field.id)"
                  class="btn btn-xs btn-error"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>

          <SButton
            @click="addSchema"
            :disabled="
              !schemaForm.name.trim() || schemaForm.fields.length === 0
            "
            class="btn-primary"
          >
            Add Data Type
          </SButton>
        </SCard>

        <!-- Existing Schemas -->
        <SCard v-if="schemas.length > 0">
          <h2 class="text-xl font-semibold mb-4">Current Data Types</h2>
          <div class="space-y-4">
            <div
              v-for="schema in schemas"
              :key="schema.id"
              class="p-4 bg-base-200 rounded-lg"
            >
              <div class="flex items-center justify-between mb-2">
                <h3 class="font-semibold">{{ schema.name }}</h3>
                <SButton
                  @click="removeSchemaById(schema.id)"
                  class="btn-error btn-sm"
                >
                  Remove
                </SButton>
              </div>
              <div class="space-y-1">
                <div
                  v-for="field in schema.fields"
                  :key="field.id"
                  class="text-sm text-base-content/70"
                >
                  {{ field.name }} ({{ field.type }}){{
                    field.required ? " *" : ""
                  }}
                </div>
              </div>
            </div>
          </div>
        </SCard>
      </div>

      <!-- Views Tab -->
      <div v-if="activeTab === 'views'" class="space-y-6">
        <!-- Add New View -->
        <SCard class="space-y-4">
          <h2 class="text-xl font-semibold">Add View</h2>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SInput
              v-model="viewForm.name"
              label="View Name"
              placeholder="e.g., Task Board, Contact List"
            />
            <div>
              <label class="label">
                <span class="label-text font-medium">View Type</span>
              </label>
              <select
                v-model="viewForm.type"
                class="select select-bordered w-full"
              >
                <option
                  v-for="type in viewTypes"
                  :key="type.value"
                  :value="type.value"
                >
                  {{ type.label }}
                </option>
              </select>
            </div>
          </div>

          <SButton
            @click="addView"
            :disabled="!viewForm.name.trim()"
            class="btn-primary"
          >
            Add View
          </SButton>
        </SCard>

        <!-- Existing Views -->
        <SCard v-if="views.length > 0">
          <h2 class="text-xl font-semibold mb-4">Current Views</h2>
          <div class="space-y-4">
            <div
              v-for="view in views"
              :key="view.id"
              class="p-4 bg-base-200 rounded-lg"
            >
              <div class="flex items-center justify-between mb-2">
                <div>
                  <h3 class="font-semibold">{{ view.name }}</h3>
                  <p class="text-sm text-base-content/60">
                    {{ view.type }} view
                  </p>
                </div>
                <SButton
                  @click="removeViewById(view.id)"
                  class="btn-error btn-sm"
                >
                  Remove
                </SButton>
              </div>
            </div>
          </div>
        </SCard>
      </div>

      <!-- Preview Tab -->
      <SCard v-if="activeTab === 'preview'" class="space-y-6">
        <h2 class="text-xl font-semibold">App Preview</h2>
        <div class="text-center py-8 text-base-content/60">
          <div class="text-4xl mb-4">🔍</div>
          <p>App preview coming soon...</p>
          <p class="text-sm">This will show how your app will look to users</p>
        </div>
      </SCard>
    </div>
  </div>
</template>
