<script setup>
import { computed, shallowRef, watch } from "vue";
import { SButton, SCard, SInput } from "ternent-ui/components";
import { useBreadcrumbs } from "@/module/breadcrumbs/useBreadcrumbs";
import { useAppBuilder } from "@/module/builder/useAppBuilder";
import { useLedger } from "@/module/ledger/useLedger";

const props = defineProps({
  appId: {
    type: String,
    required: true,
  },
});

const { 
  getApp, 
  getAppSchemas, 
  addSchemaData, 
  getSchemaData,
  updateSchemaData,
  removeSchemaData 
} = useAppBuilder();
const { ledger } = useLedger();

// Get app data
const app = computed(() => getApp(props.appId));
const schemas = computed(() => getAppSchemas(props.appId));

useBreadcrumbs({
  path: `/builder/app/${props.appId}`,
  name: computed(() => app.value ? `${app.value.name} Dashboard` : "App Dashboard"),
});

const activeSchema = shallowRef(null);
const showForm = shallowRef(false);
const formData = shallowRef({});
const schemaData = shallowRef([]);

// Initialize with first schema if available and reset when app changes
watch([schemas, () => props.appId], ([newSchemas]) => {
  activeSchema.value = null; // Reset active schema when app changes
  if (newSchemas.length > 0) {
    activeSchema.value = newSchemas[0];
  }
}, { immediate: true });

// Update schema data when active schema changes
function updateCurrentSchemaData() {
  if (!activeSchema.value) {
    schemaData.value = [];
    return;
  }
  
  const data = getSchemaData(props.appId, activeSchema.value.id);
  schemaData.value = [...(data || [])];
}

// Watch for changes
watch([() => ledger.value, activeSchema], updateCurrentSchemaData, { immediate: true });

// Initialize form data when schema changes
function initFormData() {
  if (!activeSchema.value) return;
  
  const newFormData = {};
  activeSchema.value.fields.forEach(field => {
    newFormData[field.name] = field.type === 'boolean' ? false : '';
  });
  formData.value = newFormData;
}

function openAddForm() {
  initFormData();
  showForm.value = true;
}

async function submitForm() {
  if (!activeSchema.value) return;
  
  try {
    await addSchemaData(activeSchema.value.id, formData.value);
    showForm.value = false;
    formData.value = {};
    updateCurrentSchemaData(); // Refresh the data
  } catch (error) {
    console.error("Failed to add data:", error);
  }
}

function cancelForm() {
  showForm.value = false;
  formData.value = {};
}

function switchSchema(schema) {
  activeSchema.value = schema;
  showForm.value = false;
}
</script>

<template>
  <div class="flex-1 p-6 max-w-6xl mx-auto">
    <!-- App Header -->
    <div class="flex items-center justify-between mb-8">
      <div class="flex items-center gap-4">
        <div class="text-4xl">{{ app?.icon || "📱" }}</div>
        <div>
          <h1 class="text-3xl font-bold">{{ app?.name || "My App" }}</h1>
          <p class="text-base-content/60">{{ app?.description }}</p>
        </div>
      </div>
      <div class="flex gap-2">
        <SButton :to="`/builder/app/${props.appId}/design`" class="btn-outline">
          <span class="mr-2">🎨</span>
          Design
        </SButton>
        <SButton :to="`/ledger/app/${props.appId}`" class="btn-primary">
          <span class="mr-2">🚀</span>
          Run App
        </SButton>
        <SButton to="/builder/apps" class="btn-outline">
          <span class="mr-2">📊</span>
          All Apps
        </SButton>
      </div>
    </div>

    <!-- No App State -->
    <div v-if="!app" class="text-center py-12">
      <div class="text-6xl mb-4">📱</div>
      <h2 class="text-2xl font-bold mb-2">App Not Found</h2>
      <p class="text-base-content/60 mb-6">
        The requested app doesn't exist or couldn't be loaded.
      </p>
      <SButton to="/builder/apps" class="btn-primary">
        View All Apps
      </SButton>
    </div>

    <!-- No Schemas State -->
    <div v-else-if="schemas.length === 0" class="text-center py-12">
      <div class="text-6xl mb-4">📋</div>
      <h2 class="text-2xl font-bold mb-2">No Data Types Defined</h2>
      <p class="text-base-content/60 mb-6">
        Your app doesn't have any data types defined yet.
      </p>
      <SButton :to="`/builder/app/${props.appId}/design`" class="btn-primary">
        Add Data Types
      </SButton>
    </div>

    <!-- App Interface -->
    <div v-else class="space-y-6">
      <!-- Schema Tabs -->
      <div class="tabs tabs-bordered">
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

      <!-- Active Schema Content -->
      <div v-if="activeSchema">
        <SCard class="space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-xl font-semibold">{{ activeSchema.name }}</h2>
            <SButton @click="openAddForm" class="btn-primary">
              <span class="mr-2">➕</span>
              Add {{ activeSchema.name.slice(0, -1) }}
            </SButton>
          </div>

          <!-- Data Table -->
          <div v-if="schemaData.length > 0" class="overflow-x-auto">
            <table class="table table-zebra w-full">
              <thead>
                <tr>
                  <th v-for="field in activeSchema.fields" :key="field.id">
                    {{ field.name }}
                  </th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in schemaData" :key="item.id">
                  <td v-for="field in activeSchema.fields" :key="field.id">
                    <span v-if="field.type === 'boolean'">
                      {{ item[field.name] ? '✅' : '❌' }}
                    </span>
                    <span v-else-if="field.type === 'date'">
                      {{ item[field.name] ? new Date(item[field.name]).toLocaleDateString() : '-' }}
                    </span>
                    <span v-else>
                      {{ item[field.name] || '-' }}
                    </span>
                  </td>
                  <td>
                    {{ new Date(item.createdAt).toLocaleDateString() }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Empty State -->
          <div v-else class="text-center py-8">
            <div class="text-4xl mb-2">📝</div>
            <p class="text-base-content/60">No {{ activeSchema.name.toLowerCase() }} yet</p>
            <SButton @click="openAddForm" class="btn-primary btn-sm mt-4">
              Add First {{ activeSchema.name.slice(0, -1) }}
            </SButton>
          </div>
        </SCard>
      </div>
    </div>

    <!-- Add Form Modal -->
    <div v-if="showForm" class="modal modal-open">
      <div class="modal-box">
        <h3 class="font-bold text-lg mb-4">Add {{ activeSchema?.name.slice(0, -1) }}</h3>
        
        <div class="space-y-4">
          <div v-for="field in activeSchema?.fields" :key="field.id">
            <label class="label">
              <span class="label-text">
                {{ field.name }}
                <span v-if="field.required" class="text-error">*</span>
              </span>
            </label>
            
            <!-- Text Input -->
            <SInput
              v-if="field.type === 'text' || field.type === 'email'"
              v-model="formData[field.name]"
              :type="field.type"
              :placeholder="field.name"
              class="w-full"
            />
            
            <!-- Number Input -->
            <SInput
              v-else-if="field.type === 'number'"
              v-model.number="formData[field.name]"
              type="number"
              :placeholder="field.name"
              class="w-full"
            />
            
            <!-- Date Input -->
            <input
              v-else-if="field.type === 'date'"
              v-model="formData[field.name]"
              type="date"
              class="input input-bordered w-full"
            />
            
            <!-- Textarea -->
            <textarea
              v-else-if="field.type === 'textarea'"
              v-model="formData[field.name]"
              :placeholder="field.name"
              class="textarea textarea-bordered w-full"
              rows="3"
            ></textarea>
            
            <!-- Select -->
            <select
              v-else-if="field.type === 'select'"
              v-model="formData[field.name]"
              class="select select-bordered w-full"
            >
              <option value="">Choose {{ field.name }}</option>
              <option v-for="option in field.options" :key="option" :value="option">
                {{ option }}
              </option>
            </select>
            
            <!-- Boolean -->
            <div v-else-if="field.type === 'boolean'" class="form-control">
              <label class="label cursor-pointer justify-start gap-4">
                <input
                  v-model="formData[field.name]"
                  type="checkbox"
                  class="checkbox"
                />
                <span class="label-text">{{ field.name }}</span>
              </label>
            </div>
          </div>
        </div>
        
        <div class="modal-action">
          <SButton @click="cancelForm" class="btn-outline">Cancel</SButton>
          <SButton @click="submitForm" class="btn-primary">Add</SButton>
        </div>
      </div>
    </div>
  </div>
</template>
