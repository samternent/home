<script setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { SButton, SCard, SInput } from "ternent-ui/components";
import { useBreadcrumbs } from "@/module/breadcrumbs/useBreadcrumbs";
import { useAppBuilder } from "@/module/builder/useAppBuilder";
import { generateId } from "concords-utils";

const router = useRouter();
const { createApp, createSchema } = useAppBuilder();

useBreadcrumbs({
  path: "/builder/create",
  name: "Create New App",
});

const currentStep = ref(1);
const totalSteps = 3;
const isCreating = ref(false);
const createSuccess = ref(false);

// App definition form
const appForm = ref({
  name: "",
  description: "",
  icon: "📱",
  category: "custom",
  color: "primary",
});

// Schema definition
const schemas = ref([]);
const currentSchema = ref({
  name: "",
  fields: []
});

// Available field types
const fieldTypes = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "email", label: "Email" },
  { value: "date", label: "Date" },
  { value: "boolean", label: "Yes/No" },
  { value: "select", label: "Dropdown" },
  { value: "textarea", label: "Long Text" },
];

const categories = [
  { value: "productivity", label: "Productivity" },
  { value: "business", label: "Business" },
  { value: "personal", label: "Personal" },
  { value: "collaboration", label: "Collaboration" },
  { value: "custom", label: "Custom" },
];

const colors = [
  { value: "primary", label: "Blue" },
  { value: "secondary", label: "Purple" },
  { value: "accent", label: "Teal" },
  { value: "success", label: "Green" },
  { value: "warning", label: "Orange" },
  { value: "error", label: "Red" },
];

const icons = ["📱", "📋", "👥", "📊", "💼", "🎯", "📝", "🔧", "🚀", "⚡", "💡", "🎨", "📈", "🔗", "⚙️", "🌟"];

const newField = ref({
  name: "",
  type: "text",
  required: false,
  options: []
});

const isStepValid = computed(() => {
  switch (currentStep.value) {
    case 1:
      const nameValid = appForm.value.name.trim() !== "";
      const descValid = appForm.value.description.trim() !== "";
      return nameValid && descValid;
    case 2:
      return true; // Schemas are optional - can be added later
    case 3:
      return true; // Review step
    default:
      return false;
  }
});

const validationMessages = computed(() => {
  const messages = [];
  switch (currentStep.value) {
    case 1:
      if (!appForm.value.name.trim()) {
        messages.push("App name is required");
      }
      if (!appForm.value.description.trim()) {
        messages.push("App description is required");
      }
      break;
    case 2:
      // Schemas are optional
      break;
  }
  return messages;
});

function nextStep() {
  if (currentStep.value < totalSteps && isStepValid.value) {
    currentStep.value++;
  }
}

function prevStep() {
  if (currentStep.value > 1) {
    currentStep.value--;
  }
}

function addField() {
  if (newField.value.name.trim()) {
    currentSchema.value.fields.push({
      ...newField.value,
      id: generateId(),
    });
    
    // Reset form
    newField.value = {
      name: "",
      type: "text",
      required: false,
      options: []
    };
  }
}

function removeField(fieldId) {
  currentSchema.value.fields = currentSchema.value.fields.filter(f => f.id !== fieldId);
}

function addSchema() {
  if (currentSchema.value.name.trim() && currentSchema.value.fields.length > 0) {
    schemas.value.push({
      ...currentSchema.value,
      id: generateId(),
    });
    
    // Reset form
    currentSchema.value = {
      name: "",
      fields: []
    };
  }
}

function removeSchema(schemaId) {
  schemas.value = schemas.value.filter(s => s.id !== schemaId);
}

async function createNewApp() {
  if (isCreating.value) return;
  
  try {
    isCreating.value = true;
    
    // Create app with all its data
    const appId = await createApp({
      name: appForm.value.name,
      description: appForm.value.description,
      icon: appForm.value.icon,
      category: appForm.value.category,
      color: appForm.value.color,
    });

    // Add schemas to the new app
    for (const schema of schemas.value) {
      await createSchema(appId, schema);
    }

    createSuccess.value = true;
    
    // Redirect to the new app's design page after a short delay
    setTimeout(() => {
      router.push(`/builder/app/${appId}/design`);
    }, 2000);
  } catch (error) {
    console.error("Failed to create app:", error);
    alert("Failed to create app: " + error.message);
  } finally {
    isCreating.value = false;
  }
}
</script>

<template>
  <div class="flex-1 p-6 max-w-4xl mx-auto">
    <!-- Progress Header -->
    <div class="mb-8">
      <div class="flex items-center justify-between mb-4">
        <h1 class="text-3xl font-bold">Create New App</h1>
        <div class="text-sm text-base-content/60">
          Step {{ currentStep }} of {{ totalSteps }}
        </div>
      </div>
      
      <!-- Progress Bar -->
      <div class="w-full bg-base-300 rounded-full h-2">
        <div 
          class="bg-primary h-2 rounded-full transition-all duration-300"
          :style="{ width: `${(currentStep / totalSteps) * 100}%` }"
        ></div>
      </div>
    </div>

    <!-- Step 1: App Details -->
    <SCard v-if="currentStep === 1" class="space-y-6">
      <h2 class="text-xl font-semibold mb-4">App Details</h2>
      
      <div class="space-y-4">
        <div>
          <label class="label">
            <span class="label-text font-medium">App Name *</span>
          </label>
          <SInput
            v-model="appForm.name"
            placeholder="My Awesome App"
            class="w-full"
            :class="{ 'input-error': !appForm.name.trim() && currentStep > 1 }"
          />
          <div v-if="!appForm.name.trim() && currentStep > 1" class="text-error text-xs mt-1">
            App name is required
          </div>
        </div>
        
        <div>
          <label class="label">
            <span class="label-text font-medium">Description *</span>
          </label>
          <textarea
            v-model="appForm.description"
            placeholder="What does your app do?"
            class="textarea textarea-bordered w-full"
            :class="{ 'textarea-error': !appForm.description.trim() && currentStep > 1 }"
            rows="3"
          ></textarea>
          <div v-if="!appForm.description.trim() && currentStep > 1" class="text-error text-xs mt-1">
            Description is required
          </div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="label">
              <span class="label-text font-medium">Icon</span>
            </label>
            <div class="grid grid-cols-4 md:grid-cols-8 gap-2">
              <button
                v-for="icon in icons"
                :key="icon"
                @click="appForm.icon = icon"
                type="button"
                class="btn btn-sm aspect-square text-lg"
                :class="{ 'btn-primary': appForm.icon === icon, 'btn-outline': appForm.icon !== icon }"
                :title="icon"
              >
                {{ icon }}
              </button>
            </div>
            <div class="text-xs text-base-content/60 mt-1">
              Selected: {{ appForm.icon }}
            </div>
          </div>
          
          <div>
            <label class="label">
              <span class="label-text font-medium">Category</span>
            </label>
            <select v-model="appForm.category" class="select select-bordered w-full">
              <option v-for="category in categories" :key="category.value" :value="category.value">
                {{ category.label }}
              </option>
            </select>
          </div>
          
          <div>
            <label class="label">
              <span class="label-text font-medium">Color Theme</span>
            </label>
            <select v-model="appForm.color" class="select select-bordered w-full">
              <option v-for="color in colors" :key="color.value" :value="color.value">
                {{ color.label }}
              </option>
            </select>
          </div>
        </div>
      </div>
    </SCard>

    <!-- Step 2: Data Structure -->
    <div v-if="currentStep === 2" class="space-y-6">
      <SCard class="space-y-4">
        <h2 class="text-xl font-semibold">Data Structure (Optional)</h2>
        <p class="text-base-content/60">Define what data your app will store, or skip this step and add data types later</p>
        
        <!-- Validation Message -->
        <div v-if="schemas.length === 0" class="alert alert-info">
          <span class="text-sm">You can create your app without data types and add them later in the design page.</span>
        </div>
        
        <!-- Current Schema Form -->
        <div class="space-y-4 p-4 bg-base-200 rounded-lg">
          <h3 class="font-medium">Add Data Type</h3>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SInput
              v-model="currentSchema.name"
              placeholder="e.g., Tasks, Contacts, Products"
              label="Data Type Name"
            />
          </div>
          
          <!-- Fields -->
          <div class="space-y-3">
            <h4 class="font-medium text-sm">Fields</h4>
            
            <!-- Add Field Form -->
            <div class="flex gap-2 items-end">
              <SInput
                v-model="newField.name"
                placeholder="Field name"
                class="flex-1"
                size="sm"
              />
              <select v-model="newField.type" class="select select-bordered select-sm w-32">
                <option v-for="type in fieldTypes" :key="type.value" :value="type.value">
                  {{ type.label }}
                </option>
              </select>
              <label class="flex items-center gap-1 text-sm">
                <input type="checkbox" v-model="newField.required" class="checkbox checkbox-sm" />
                Required
              </label>
              <SButton @click="addField" size="sm" class="btn-primary">Add</SButton>
            </div>
            
            <!-- Current Fields -->
            <div class="space-y-2">
              <div
                v-for="field in currentSchema.fields"
                :key="field.id"
                class="flex items-center justify-between p-2 bg-base-100 rounded"
              >
                <div class="flex items-center gap-2">
                  <span class="font-medium">{{ field.name }}</span>
                  <span class="text-xs text-base-content/60">({{ field.type }})</span>
                  <span v-if="field.required" class="text-xs text-error">Required</span>
                </div>
                <button @click="removeField(field.id)" class="btn btn-xs btn-error">Remove</button>
              </div>
            </div>
          </div>
          
          <SButton
            @click="addSchema"
            :disabled="!currentSchema.name.trim() || currentSchema.fields.length === 0"
            class="btn-secondary"
          >
            Add Data Type
          </SButton>
        </div>
      </SCard>
      
      <!-- Added Schemas -->
      <SCard v-if="schemas.length > 0" class="space-y-4">
        <h3 class="font-semibold">Added Data Types</h3>
        <div class="space-y-3">
          <div
            v-for="schema in schemas"
            :key="schema.id"
            class="p-4 bg-base-200 rounded-lg"
          >
            <div class="flex items-center justify-between mb-2">
              <h4 class="font-medium">{{ schema.name }}</h4>
              <button @click="removeSchema(schema.id)" class="btn btn-xs btn-error">Remove</button>
            </div>
            <div class="text-sm text-base-content/60">
              {{ schema.fields.length }} fields: {{ schema.fields.map(f => f.name).join(', ') }}
            </div>
          </div>
        </div>
      </SCard>
    </div>

    <!-- Step 3: Review -->
    <SCard v-if="currentStep === 3" class="space-y-6">
      <h2 class="text-xl font-semibold">Review & Create</h2>
      
      <div class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 class="font-medium mb-2">App Details</h3>
            <div class="space-y-2 text-sm">
              <div><strong>Name:</strong> {{ appForm.name }}</div>
              <div><strong>Description:</strong> {{ appForm.description }}</div>
              <div><strong>Icon:</strong> {{ appForm.icon }}</div>
              <div><strong>Category:</strong> {{ appForm.category }}</div>
            </div>
          </div>
          
          <div>
            <h3 class="font-medium mb-2">Data Structure</h3>
            <div class="space-y-2 text-sm">
              <div v-for="schema in schemas" :key="schema.id">
                <strong>{{ schema.name }}:</strong> {{ schema.fields.length }} fields
              </div>
            </div>
          </div>
        </div>
      </div>
    </SCard>

    <!-- Success Step -->
    <SCard v-if="createSuccess" class="space-y-6 text-center">
      <div class="text-6xl">🎉</div>
      <h2 class="text-2xl font-semibold text-success">App Created Successfully!</h2>
      <p class="text-base-content/60">
        Your app "{{ appForm.name }}" has been created and configured.
      </p>
      <div class="space-y-3">
        <p class="text-sm">Redirecting to the design interface...</p>
        <div class="flex gap-4 justify-center">
          <SButton @click="router.push('/builder/design')" class="btn-primary">
            <span class="mr-2">🎨</span>
            Go to Design
          </SButton>
          <SButton @click="router.push('/builder/app')" class="btn-secondary">
            <span class="mr-2">🚀</span>
            View App
          </SButton>
        </div>
      </div>
    </SCard>

    <!-- Navigation -->
    <div v-if="!createSuccess" class="flex justify-between mt-8">
      <SButton
        v-if="currentStep > 1"
        @click="prevStep"
        class="btn-outline"
      >
        Previous
      </SButton>
      <div></div>
      
      <SButton
        v-if="currentStep < totalSteps"
        @click="nextStep"
        :disabled="!isStepValid"
        class="btn-primary"
        :class="{ 'tooltip tooltip-left': !isStepValid }"
        :data-tip="!isStepValid ? validationMessages.join(', ') : ''"
      >
        Next
      </SButton>
      
      <SButton
        v-if="currentStep === totalSteps"
        @click="createNewApp"
        :disabled="isCreating"
        class="btn-primary"
        :class="{ 'loading': isCreating }"
      >
        <span v-if="!isCreating" class="mr-2">🚀</span>
        {{ isCreating ? 'Creating...' : 'Create App' }}
      </SButton>
    </div>
  </div>
</template>
