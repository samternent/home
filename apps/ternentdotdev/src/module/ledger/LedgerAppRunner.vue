<script setup>
import { computed, shallowRef, watch, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import {
  SButton,
  SCard,
  STabs,
  SInput,
  SDrawerRight,
} from "ternent-ui/components";
import { provideAppBuilder } from "../../module/builder/useAppBuilder";

const router = useRouter();
const route = useRoute();
const appBuilder = provideAppBuilder();
const { apps, getAppSchemas, addSchemaData, getSchemaData } = appBuilder;

// Always treat apps as an array, even if undefined
const safeApps = computed(() => (Array.isArray(apps.value) ? apps.value : []));

// Get linked data for a specific schema
function getLinkedSchemaData(schemaId) {
  if (!currentAppId.value || !schemaId) {
    return [];
  }
  const data = getSchemaData(currentAppId.value, schemaId);
  console.log("getLinkedSchemaData result:", {
    schemaId,
    data,
    length: data?.length,
  });
  return Array.isArray(data) ? data : [];
}

// Get display value for linked data item
function getLinkedDataDisplayValue(item, linkedSchema) {
  if (!item || !linkedSchema) return "Unknown";

  // Try to find a good display field (name, title, label, or first text field)
  const displayFields = ["name", "title", "label"];
  for (const field of displayFields) {
    if (item[field]) return item[field];
  }

  // Fall back to first text field
  const textField = linkedSchema.fields?.find((f) => f.type === "text");
  if (textField && item[textField.name]) {
    return item[textField.name];
  }

  // Last resort: show ID
  return `Item ${item.id || "Unknown"}`;
}

// Tabs: one per app only
const navTabs = computed(() => {
  return safeApps.value.map((app) => ({
    title: app.name || "Untitled App",
    path: `/t/apps/${app.id}`,
    id: app.id,
    icon: app.icon || "📱",
  }));
});

const hasApps = computed(() => safeApps.value.length > 0);

const currentAppId = computed(() => {
  if (route.params.appId) {
    return route.params.appId;
  }
  // Default to first app if available
  return safeApps.value[0]?.id || null;
});
const currentApp = computed(() => {
  if (!hasApps.value || !currentAppId.value) return null;
  return safeApps.value.find((app) => app.id === currentAppId.value) || null;
});

// Table-based view logic (from RouteLedgerApp.vue)
const schemas = computed(() => {
  if (currentAppId.value && typeof getAppSchemas === "function") {
    const appSchemas = getAppSchemas(currentAppId.value);
    return Array.isArray(appSchemas) ? appSchemas : [];
  }
  return [];
});
const activeSchema = shallowRef(null);
const isFormDrawerOpen = shallowRef(false);
const formData = shallowRef({});
const schemaData = shallowRef([]);

watch(
  [schemas, currentAppId],
  ([newSchemas]) => {
    activeSchema.value = null;
    if (Array.isArray(newSchemas) && newSchemas.length > 0)
      activeSchema.value = newSchemas[0];
  },
  { immediate: true }
);

function updateCurrentSchemaData() {
  if (!activeSchema.value || !currentAppId.value) {
    schemaData.value = [];
    return;
  }
  const data = getSchemaData(currentAppId.value, activeSchema.value.id);
  schemaData.value = [...(data || [])];
}
watch([activeSchema], updateCurrentSchemaData, {
  immediate: true,
});

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
  isFormDrawerOpen.value = true;
}
async function submitForm() {
  if (!activeSchema.value || !currentAppId.value) return;
  try {
    await addSchemaData(activeSchema.value.id, formData.value);
    isFormDrawerOpen.value = false;
    formData.value = {};
    updateCurrentSchemaData();
  } catch (error) {
    console.error("Failed to add data:", error);
  }
}
function cancelForm() {
  isFormDrawerOpen.value = false;
  formData.value = {};
}
function switchSchema(schema) {
  activeSchema.value = schema;
  isFormDrawerOpen.value = false;
}
function goToApp(appId) {
  router.push(`/t/apps/${appId}`);
}
function createNewApp() {
  router.push("/t/builder");
}

onMounted(() => {
  // If we're at /apps root and have apps, redirect to the first app
  if (
    (route.path === "/t/apps" || route.path === "/t/apps/") &&
    safeApps.value.length > 0
  ) {
    router.replace(`/t/apps/${safeApps.value[0].id}`);
  }
});
</script>

<template>
  <div class="flex flex-col flex-1 relative max-w-full overflow-hidden">
    <nav
      class="flex items-center justify-between pt-4 px-6 border-b border-base-300 bg-base-100"
    >
      <div class="flex items-center gap-4">
        <STabs
          :items="navTabs"
          :path="`/t/apps/${currentAppId}`"
          variant="stripe"
          @tab-click="(tab) => router.push(tab.path)"
        />
      </div>
      <div class="flex items-center gap-2">
        <SButton size="sm" variant="primary" @click="createNewApp">
          <span class="mr-1">✨</span> New App
        </SButton>
      </div>
    </nav>
    <div class="flex-1 flex w-full overflow-hidden relative">
      <div class="flex flex-1">
        <div v-if="hasApps && currentApp" class="flex-1 p-6 max-w-6xl mx-auto">
          <div class="flex items-center justify-between mb-8">
            <div class="flex items-center gap-4">
              <div class="text-4xl">{{ currentApp.icon || "📱" }}</div>
              <div>
                <h1 class="text-3xl font-bold">
                  {{ currentApp.name || "My App" }}
                </h1>
                <p class="text-base-content/60">{{ currentApp.description }}</p>
              </div>
            </div>
            <div class="flex gap-2">
              <SButton
                :to="`/t/builder/app/${currentAppId}/design`"
                class="btn-outline"
              >
                <span class="mr-2">🎨</span> Configure
              </SButton>
            </div>
          </div>
          <div v-if="schemas.length === 0" class="text-center py-12">
            <div class="text-6xl mb-4">📋</div>
            <h2 class="text-2xl font-bold mb-2">No Data Types Defined</h2>
            <p class="text-base-content/60 mb-6">
              Your app doesn't have any data types defined yet.
            </p>
            <SButton
              :to="`/t/builder/app/${currentAppId}/design`"
              class="btn-primary"
            >
              Add Data Types
            </SButton>
          </div>
          <div v-else class="space-y-6">
            <div class="tabs tabs-lifted">
              <button
                v-for="schema in schemas"
                :key="schema.id"
                @click="switchSchema(schema)"
                class="tab"
                :class="{ 'tab-active': activeSchema?.id === schema.id }"
              >
                {{ schema.name }}
              </button>
            </div>
            <div v-if="activeSchema">
              <SCard class="space-y-4">
                <div class="flex items-center justify-between">
                  <h2 class="text-xl font-semibold">{{ activeSchema.name }}</h2>
                  <SButton @click="openAddForm" class="btn-primary">
                    <span class="mr-2">➕</span>
                    Add {{ activeSchema.name.slice(0, -1) }}
                  </SButton>
                </div>
                <div v-if="schemaData.length > 0" class="overflow-x-auto">
                  <table class="table table-zebra w-full">
                    <thead>
                      <tr>
                        <th
                          v-for="field in activeSchema.fields"
                          :key="field.id"
                        >
                          {{ field.name }}
                        </th>
                        <th>Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="item in schemaData" :key="item.id">
                        <td
                          v-for="field in activeSchema.fields"
                          :key="field.id"
                        >
                          <span v-if="field.type === 'boolean'">
                            {{ item[field.name] ? "✅" : "❌" }}
                          </span>
                          <span v-else-if="field.type === 'date'">
                            {{
                              item[field.name]
                                ? new Date(
                                    item[field.name]
                                  ).toLocaleDateString()
                                : "-"
                            }}
                          </span>
                          <span v-else-if="field.type === 'select'">
                            {{
                              field.options?.find(
                                (opt) => (opt.value || opt) === item[field.name]
                              )?.label ||
                              item[field.name] ||
                              "-"
                            }}
                          </span>
                          <span v-else-if="field.type === 'link'">
                            {{
                              (() => {
                                if (!item[field.name]) return "-";
                                const linkedSchema = schemas.find(
                                  (s) => s.id === field.linkedSchema
                                );
                                const linkedData = getLinkedSchemaData(
                                  field.linkedSchema
                                );
                                const linkedItem = linkedData.find(
                                  (d) => d.id === item[field.name]
                                );
                                return linkedItem
                                  ? getLinkedDataDisplayValue(
                                      linkedItem,
                                      linkedSchema
                                    )
                                  : `Missing (${item[field.name]})`;
                              })()
                            }}
                          </span>
                          <span v-else>
                            {{ item[field.name] || "-" }}
                          </span>
                        </td>
                        <td>
                          {{ new Date(item.createdAt).toLocaleDateString() }}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div v-else class="text-center py-8">
                  <div class="text-4xl mb-2">📝</div>
                  <p class="text-base-content/60">
                    No {{ activeSchema.name.toLowerCase() }} yet
                  </p>
                  <SButton @click="openAddForm" class="btn-primary btn-sm mt-4">
                    Add First {{ activeSchema.name.slice(0, -1) }}
                  </SButton>
                </div>
              </SCard>
            </div>
          </div>

          <!-- Add Data Drawer -->
          <SDrawerRight
            v-model="isFormDrawerOpen"
            :title="`Add ${activeSchema?.name.slice(0, -1) || 'Item'}`"
          >
            <div class="p-4 space-y-4">
              <div class="alert alert-info">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  class="stroke-current shrink-0 w-6 h-6"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
                <div class="text-sm">
                  Adding a new
                  {{ activeSchema?.name.slice(0, -1).toLowerCase() || "item" }}
                  to your {{ currentApp?.name || "app" }}.
                </div>
              </div>

              <div
                v-for="field in activeSchema?.fields"
                :key="field.id"
                class="form-control"
              >
                <label class="label">
                  <span class="label-text">
                    {{ field.name }}
                    <span v-if="field.required" class="text-error">*</span>
                  </span>
                </label>

                <!-- Text and Email Fields -->
                <SInput
                  v-if="field.type === 'text' || field.type === 'email'"
                  v-model="formData[field.name]"
                  :type="field.type"
                  :placeholder="`Enter ${field.name}`"
                  class="w-full"
                  :required="field.required"
                />

                <!-- Number Fields -->
                <SInput
                  v-else-if="field.type === 'number'"
                  v-model="formData[field.name]"
                  type="number"
                  :placeholder="`Enter ${field.name}`"
                  class="w-full"
                  :required="field.required"
                />

                <!-- Date Fields -->
                <SInput
                  v-else-if="field.type === 'date'"
                  v-model="formData[field.name]"
                  type="date"
                  class="w-full"
                  :required="field.required"
                />

                <!-- Boolean Fields -->
                <div v-else-if="field.type === 'boolean'" class="form-control">
                  <label class="label cursor-pointer justify-start gap-4">
                    <input
                      v-model="formData[field.name]"
                      type="checkbox"
                      :true-value="true"
                      :false-value="false"
                      class="checkbox"
                    />
                    <span class="label-text">{{ field.name }}</span>
                  </label>
                </div>

                <!-- Select Fields -->
                <div v-else-if="field.type === 'select'">
                  <select
                    v-model="formData[field.name]"
                    class="select select-bordered w-full"
                    :required="field.required"
                  >
                    <option value="" disabled>Choose {{ field.name }}</option>
                    <option
                      v-for="option in field.options"
                      :key="option.value || option"
                      :value="option.value || option"
                    >
                      {{ option.label || option }}
                    </option>
                  </select>
                </div>

                <!-- Textarea Fields -->
                <textarea
                  v-else-if="field.type === 'textarea'"
                  v-model="formData[field.name]"
                  :placeholder="`Enter ${field.name}`"
                  class="textarea textarea-bordered w-full"
                  rows="3"
                  :required="field.required"
                ></textarea>

                <!-- Link Fields -->
                <div v-else-if="field.type === 'link'">
                  <select
                    v-model="formData[field.name]"
                    class="select select-bordered w-full"
                    :required="field.required"
                  >
                    <option value="" disabled>Choose {{ field.name }}</option>
                    <option
                      v-for="item in getLinkedSchemaData(field.linkedSchema)"
                      :key="item.id"
                      :value="item.id"
                    >
                      {{
                        getLinkedDataDisplayValue(
                          item,
                          schemas.find((s) => s.id === field.linkedSchema)
                        )
                      }}
                    </option>
                  </select>
                  <div class="label">
                    <span class="label-text-alt text-base-content/60">
                      Links to
                      {{
                        schemas.find((s) => s.id === field.linkedSchema)
                          ?.name || "another data type"
                      }}
                    </span>
                  </div>
                </div>

                <!-- Unsupported Field Types -->
                <div v-else class="alert alert-warning">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="stroke-current shrink-0 h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                  <span class="text-sm"
                    >Unsupported field type: {{ field.type }}</span
                  >
                </div>
              </div>

              <div class="flex gap-2 pt-4">
                <SButton
                  @click="submitForm"
                  type="primary"
                  class="flex-1"
                  :disabled="!formData || Object.keys(formData).length === 0"
                >
                  <span class="mr-2">✔️</span>
                  Add {{ activeSchema?.name.slice(0, -1) || "Item" }}
                </SButton>
                <SButton @click="cancelForm" type="ghost"> Cancel </SButton>
              </div>
            </div>
          </SDrawerRight>
        </div>
        <div v-else class="flex-1 flex items-center justify-center">
          <div class="text-center">
            <div class="text-6xl mb-4">📱</div>
            <h2 class="text-2xl font-bold mb-2">No Apps</h2>
            <p class="text-base-600 mb-6">
              Create your first app to get started
            </p>
            <SButton variant="primary" @click="createNewApp">
              <span class="mr-2">➕</span> Create Your First App
            </SButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
