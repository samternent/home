<script setup>
import { computed, shallowRef, watch } from "vue";
import { useRouter } from "vue-router";
import { SButton, SCard, SInput } from "ternent-ui/components";
import { useAppBuilder } from "@/module/builder/useAppBuilder";

const router = useRouter();

const props = defineProps({
  app: {
    type: Object,
    required: true
  }
});

const { getAppSchemas, getSchemaData, addSchemaData } = useAppBuilder();

const schemas = computed(() => getAppSchemas(props.app.id));
const activeSchema = shallowRef(null);
const showForm = shallowRef(false);
const formData = shallowRef({});

// Initialize with first schema if available and reset when app changes
watch([schemas, () => props.app.id], ([newSchemas]) => {
  activeSchema.value = null; // Reset active schema when app changes
  if (newSchemas.length > 0) {
    activeSchema.value = newSchemas[0];
  }
}, { immediate: true });

// Get data for active schema
const schemaData = computed(() => {
  if (!activeSchema.value) return [];
  return getSchemaData(props.app.id, activeSchema.value.id);
});

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
  } catch (error) {
    console.error("Failed to add item:", error);
  }
}

function toggleCompleted(item) {
  // For task-like items, toggle completion
  if (item.hasOwnProperty('completed')) {
    // Update the item (simplified - would need proper update function)
    console.log("Toggle completed for:", item);
  }
}
</script>

<template>
  <div class="space-y-4">
    <!-- App Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <span class="text-2xl">{{ app.icon }}</span>
        <div>
          <h2 class="text-xl font-bold">{{ app.name }}</h2>
          <p class="text-sm text-base-content/60">{{ app.description }}</p>
        </div>
      </div>
      <SButton @click="openAddForm" class="btn-primary">
        <span class="mr-2">➕</span>
        Add Item
      </SButton>
    </div>

    <!-- Schema Tabs (if multiple) -->
    <div v-if="schemas.length > 1" class="tabs tabs-boxed">
      <button
        v-for="schema in schemas"
        :key="schema.id"
        @click="activeSchema = schema"
        class="tab"
        :class="{ 'tab-active': activeSchema?.id === schema.id }"
      >
        {{ schema.name }}
      </button>
    </div>

    <!-- No Schema State -->
    <SCard v-if="schemas.length === 0" class="text-center py-8">
      <div class="text-4xl mb-4">📝</div>
      <h3 class="text-lg font-medium mb-2">No Data Structure</h3>
      <p class="text-base-content/60 mb-4">
        This app doesn't have any data structure defined yet.
      </p>
      <SButton @click="router.push('/builder')" class="btn-primary">
        Configure App
      </SButton>
    </SCard>

    <!-- Data List -->
    <div v-else-if="activeSchema">
      <!-- No Data State -->
      <SCard v-if="schemaData.length === 0" class="text-center py-8">
        <div class="text-4xl mb-4">{{ app.icon }}</div>
        <h3 class="text-lg font-medium mb-2">No {{ activeSchema.name }}s Yet</h3>
        <p class="text-base-content/60 mb-4">
          Start by adding your first {{ activeSchema.name.toLowerCase() }}.
        </p>
        <SButton @click="openAddForm" class="btn-primary">
          <span class="mr-2">➕</span>
          Add {{ activeSchema.name }}
        </SButton>
      </SCard>

      <!-- Data Items -->
      <div v-else class="space-y-3">
        <SCard
          v-for="item in schemaData"
          :key="item.id"
          class="hover:shadow-md transition-shadow"
        >
          <div class="flex items-center justify-between">
            <div class="flex-1">
              <!-- Display fields based on type -->
              <div v-for="field in activeSchema.fields" :key="field.name" class="mb-2 last:mb-0">
                <template v-if="field.type === 'boolean'">
                  <div class="flex items-center gap-2">
                    <input
                      type="checkbox"
                      :checked="item[field.name]"
                      @change="toggleCompleted(item)"
                      class="checkbox checkbox-sm"
                    />
                    <span class="text-sm text-base-content/60">{{ field.name }}</span>
                  </div>
                </template>
                <template v-else-if="field.name === 'name' || field.name === 'title'">
                  <h4 class="font-medium" :class="{ 'line-through opacity-60': item.completed }">
                    {{ item[field.name] }}
                  </h4>
                </template>
                <template v-else>
                  <div class="text-sm">
                    <span class="text-base-content/60">{{ field.name }}:</span>
                    {{ item[field.name] }}
                  </div>
                </template>
              </div>
            </div>
            <div class="text-xs text-base-content/40">
              {{ new Date(item.createdAt).toLocaleDateString() }}
            </div>
          </div>
        </SCard>
      </div>
    </div>

    <!-- Add Item Modal -->
    <div v-if="showForm" class="modal modal-open">
      <div class="modal-box">
        <h3 class="font-bold text-lg">Add {{ activeSchema?.name }}</h3>
        
        <div class="py-4 space-y-4">
          <div v-for="field in activeSchema?.fields" :key="field.name">
            <label class="label">
              <span class="label-text">{{ field.name }}</span>
              <span v-if="field.required" class="text-error">*</span>
            </label>
            
            <SInput
              v-if="field.type === 'text' || field.type === 'email'"
              v-model="formData[field.name]"
              :type="field.type"
              class="w-full"
              :required="field.required"
            />
            
            <textarea
              v-else-if="field.type === 'textarea'"
              v-model="formData[field.name]"
              class="textarea textarea-bordered w-full"
              rows="3"
              :required="field.required"
            ></textarea>
            
            <input
              v-else-if="field.type === 'number'"
              v-model.number="formData[field.name]"
              type="number"
              class="input input-bordered w-full"
              :required="field.required"
            />
            
            <input
              v-else-if="field.type === 'date'"
              v-model="formData[field.name]"
              type="date"
              class="input input-bordered w-full"
              :required="field.required"
            />
            
            <div v-else-if="field.type === 'boolean'" class="form-control">
              <label class="label cursor-pointer justify-start gap-3">
                <input
                  v-model="formData[field.name]"
                  type="checkbox"
                  class="checkbox"
                />
                <span class="label-text">Yes</span>
              </label>
            </div>
          </div>
        </div>
        
        <div class="modal-action">
          <SButton @click="showForm = false" class="btn-outline">Cancel</SButton>
          <SButton @click="submitForm" class="btn-primary">Add</SButton>
        </div>
      </div>
    </div>
  </div>
</template>
