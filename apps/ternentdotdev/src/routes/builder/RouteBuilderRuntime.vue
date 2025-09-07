<script setup>
import { computed, shallowRef } from "vue";
import { useRouter } from "vue-router";
import { SButton, SCard, SInput } from "ternent-ui/components";
import { useAppBuilder } from "@/module/builder/useAppBuilder.js";
import { useLedger } from "@/module/ledger/useLedger";
import { useBreadcrumbs } from "@/module/breadcrumbs/useBreadcrumbs";

const props = defineProps({
  appId: {
    type: String,
    required: true,
  },
});

const router = useRouter();
const { getApp, getAppSchemas, getAppViews } = useAppBuilder();
const { addItem, getCollection } = useLedger();

const app = computed(() => getApp(props.appId));
const schemas = computed(() => getAppSchemas(props.appId));
const views = computed(() => getAppViews(props.appId));

const activeView = shallowRef(null);
const formData = shallowRef({});
const showForm = shallowRef(false);

useBreadcrumbs({
  path: `/builder/runtime/${props.appId}`,
  name: `${app.value?.name || "App"} Runtime`,
});

// Get data for a specific schema
function getSchemaData(schemaId) {
  const collectionName = `app_${props.appId}_${schemaId}`;
  const collection = getCollection(collectionName);
  return collection?.data || [];
}

// Add data to a schema
async function addSchemaData(schemaId, data) {
  const collectionName = `app_${props.appId}_${schemaId}`;
  await addItem(data, collectionName);
}

// Initialize active view
if (views.value.length > 0) {
  activeView.value = views.value[0];
}

// Get schema for active view
const activeSchema = computed(() => {
  if (!activeView.value) return null;
  return schemas.value.find((s) => s.id === activeView.value.schemaId);
});

// Get data for active view
const viewData = computed(() => {
  if (!activeView.value || !activeSchema.value) return [];
  return getSchemaData(activeSchema.value.id);
});

// Initialize form data when schema changes
function initFormData() {
  if (!activeSchema.value) return;

  const newFormData = {};
  activeSchema.value.fields.forEach((field) => {
    newFormData[field.name] = field.type === "boolean" ? false : "";
  });
  formData.value = newFormData;
}

function openAddForm() {
  initFormData();
  showForm.value = true;
}

async function submitForm() {
  if (!activeSchema.value) return;

  const data = {
    id: Date.now().toString(),
    ...formData.value,
    createdAt: new Date().toISOString(),
  };

  await addSchemaData(activeSchema.value.id, data);
  showForm.value = false;
  formData.value = {};
}

function renderField(field, value) {
  switch (field.type) {
    case "date":
      return new Date(value).toLocaleDateString();
    case "boolean":
      return value ? "✅" : "❌";
    default:
      return value || "-";
  }
}

function getInputType(fieldType) {
  switch (fieldType) {
    case "email":
      return "email";
    case "number":
      return "number";
    case "date":
      return "date";
    default:
      return "text";
  }
}
</script>

<template>
  <div class="flex-1 bg-base-100" v-if="app">
    <!-- App Header -->
    <div class="bg-base-200 border-b border-base-300 px-6 py-4">
      <div class="flex items-center justify-between max-w-6xl mx-auto">
        <div class="flex items-center gap-4">
          <div class="text-3xl">{{ app.icon }}</div>
          <div>
            <h1 class="text-2xl font-bold">{{ app.name }}</h1>
            <p class="text-base-content/60">{{ app.description }}</p>
          </div>
        </div>

        <div class="flex gap-2">
          <RouterLink
            :to="`/builder/app/${props.appId}`"
            class="btn btn-outline btn-sm"
          >
            🔧 Edit App
          </RouterLink>
          <SButton variant="ghost" @click="router.back()" size="sm">
            Close
          </SButton>
        </div>
      </div>
    </div>

    <div class="flex max-w-6xl mx-auto">
      <!-- Sidebar Navigation -->
      <div
        class="w-64 bg-base-200/50 border-r border-base-300 min-h-screen p-4"
      >
        <h3
          class="font-bold text-sm text-base-content/60 uppercase tracking-wide mb-3"
        >
          Views
        </h3>

        <div v-if="views.length === 0" class="text-center py-8">
          <div class="text-2xl mb-2">👁️</div>
          <p class="text-sm text-base-content/60">No views available</p>
          <RouterLink
            :to="`/builder/app/${props.appId}`"
            class="btn btn-outline btn-xs mt-2"
          >
            Create Views
          </RouterLink>
        </div>

        <div v-else class="space-y-1">
          <button
            v-for="view in views"
            :key="view.id"
            @click="activeView = view"
            class="w-full text-left px-3 py-2 rounded-lg transition hover:bg-base-300"
            :class="{
              'bg-primary text-primary-content': activeView?.id === view.id,
              'text-base-content/70': activeView?.id !== view.id,
            }"
          >
            <div class="font-medium text-sm">{{ view.name }}</div>
            <div class="text-xs opacity-70">{{ view.type }}</div>
          </button>
        </div>
      </div>

      <!-- Main Content -->
      <div class="flex-1 p-6">
        <div v-if="!activeView" class="text-center py-12">
          <div class="text-4xl mb-4">📱</div>
          <h2 class="text-xl font-bold mb-2">Select a View</h2>
          <p class="text-base-content/60">
            Choose a view from the sidebar to get started
          </p>
        </div>

        <div v-else-if="!activeSchema" class="text-center py-12">
          <div class="text-4xl mb-4">❌</div>
          <h2 class="text-xl font-bold mb-2">Schema Not Found</h2>
          <p class="text-base-content/60">
            The data model for this view is missing
          </p>
        </div>

        <div v-else>
          <!-- View Header -->
          <div class="flex items-center justify-between mb-6">
            <div>
              <h2 class="text-2xl font-bold">{{ activeView.name }}</h2>
              <p class="text-base-content/60">
                {{ activeSchema.name }} {{ activeView.type }}
              </p>
            </div>
            <SButton @click="openAddForm" class="btn-primary">
              Add {{ activeSchema.name }}
            </SButton>
          </div>

          <!-- List View -->
          <div v-if="activeView.type === 'list'">
            <div
              v-if="viewData.length === 0"
              class="text-center py-12 bg-base-200/30 rounded-lg"
            >
              <div class="text-3xl mb-3">📄</div>
              <h3 class="font-medium mb-2">No {{ activeSchema.name }} yet</h3>
              <p class="text-sm text-base-content/60 mb-4">
                Add your first item to get started
              </p>
              <SButton @click="openAddForm" size="sm"
                >Add {{ activeSchema.name }}</SButton
              >
            </div>

            <div v-else class="space-y-3">
              <SCard
                v-for="item in viewData"
                :key="item.data.id"
                class="hover:shadow-lg transition"
              >
                <div class="grid gap-2">
                  <div
                    v-for="field in activeSchema.fields.slice(0, 4)"
                    :key="field.name"
                    class="flex justify-between"
                  >
                    <span class="font-medium text-sm">{{ field.name }}:</span>
                    <span class="text-sm">{{
                      renderField(field, item.data[field.name])
                    }}</span>
                  </div>
                  <div class="text-xs text-base-content/50 mt-2">
                    Created:
                    {{ new Date(item.data.createdAt).toLocaleString() }}
                  </div>
                </div>
              </SCard>
            </div>
          </div>
        </div>

        <!-- Add Form Modal -->
        <div
          v-if="showForm"
          class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        >
          <SCard class="w-full max-w-md mx-4">
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <h3 class="text-lg font-bold">Add {{ activeSchema?.name }}</h3>
                <SButton size="sm" variant="ghost" @click="showForm = false"
                  >×</SButton
                >
              </div>

              <form @submit.prevent="submitForm" class="space-y-4">
                <div v-for="field in activeSchema?.fields" :key="field.name">
                  <label class="label">
                    <span class="label-text">
                      {{ field.name }}
                      <span v-if="field.required" class="text-error">*</span>
                    </span>
                  </label>

                  <!-- Text/Email/Number/Date inputs -->
                  <SInput
                    v-if="
                      ['text', 'email', 'number', 'date'].includes(field.type)
                    "
                    v-model="formData[field.name]"
                    :type="getInputType(field.type)"
                    :required="field.required"
                  />

                  <!-- Textarea -->
                  <textarea
                    v-else-if="field.type === 'textarea'"
                    v-model="formData[field.name]"
                    :required="field.required"
                    class="textarea textarea-bordered w-full"
                    rows="3"
                  ></textarea>

                  <!-- Checkbox -->
                  <input
                    v-else-if="field.type === 'boolean'"
                    v-model="formData[field.name]"
                    type="checkbox"
                    class="checkbox"
                  />

                  <!-- Select dropdown -->
                  <select
                    v-else-if="field.type === 'select'"
                    v-model="formData[field.name]"
                    :required="field.required"
                    class="select select-bordered w-full"
                  >
                    <option value="">Choose...</option>
                    <option value="option1">Option 1</option>
                    <option value="option2">Option 2</option>
                  </select>
                </div>

                <div class="flex gap-2 pt-4">
                  <SButton
                    type="button"
                    variant="ghost"
                    @click="showForm = false"
                  >
                    Cancel
                  </SButton>
                  <SButton type="submit" class="btn-primary"> Save </SButton>
                </div>
              </form>
            </div>
          </SCard>
        </div>
      </div>
    </div>
  </div>

  <div v-else class="flex-1 flex items-center justify-center">
    <div class="text-center">
      <div class="text-4xl mb-4">❌</div>
      <h2 class="text-xl font-bold mb-2">App Not Found</h2>
      <p class="text-base-content/60">The requested app could not be found.</p>
      <RouterLink to="/t/builder" class="btn btn-outline mt-4">
        Back to Builder
      </RouterLink>
    </div>
  </div>
</template>
