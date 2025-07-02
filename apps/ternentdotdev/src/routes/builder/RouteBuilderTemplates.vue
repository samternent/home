<script setup>
import { shallowRef, computed } from "vue";
import { useRouter } from "vue-router";
import { SButton, SCard, SInput } from "ternent-ui/components";
import { useAppBuilder } from "@/module/builder/useAppBuilder.js";
import { useBreadcrumbs } from "@/module/breadcrumbs/useBreadcrumbs";

const router = useRouter();
const { importAppTemplate } = useAppBuilder();

useBreadcrumbs({
  path: "/builder/templates",
  name: "Templates",
});

const searchQuery = shallowRef("");
const selectedCategory = shallowRef("all");

const templates = [
  {
    id: "task-manager",
    name: "Task Manager",
    description: "Simple project and task management with boards, lists, and due dates",
    icon: "📋",
    category: "productivity",
    features: ["Task tracking", "Due dates", "Priority levels", "Status updates"],
    template: {
      config: {
        name: "Task Manager",
        description: "Manage your tasks and projects",
        icon: "📋",
        category: "productivity",
        color: "primary"
      },
      schemas: [
        {
          id: "tasks",
          name: "Tasks",
          fields: [
            { id: "title", name: "Title", type: "text", required: true },
            { id: "description", name: "Description", type: "textarea", required: false },
            { id: "status", name: "Status", type: "select", required: true, options: ["Todo", "In Progress", "Done"] },
            { id: "priority", name: "Priority", type: "select", required: false, options: ["Low", "Medium", "High"] },
            { id: "dueDate", name: "Due Date", type: "date", required: false }
          ]
        }
      ],
      views: [
        {
          id: "task-list",
          name: "Task List",
          type: "list",
          schemaId: "tasks",
          config: { sortBy: "dueDate", groupBy: "status" }
        }
      ]
    }
  },
  {
    id: "crm",
    name: "Customer CRM",
    description: "Customer relationship management with contacts, deals, and interactions",
    icon: "👥",
    category: "business",
    features: ["Contact management", "Deal tracking", "Communication history"],
    template: {
      config: {
        name: "Customer CRM",
        description: "Manage customer relationships",
        icon: "👥",
        category: "business",
        color: "success"
      },
      schemas: [
        {
          id: "contacts",
          name: "Contacts",
          fields: [
            { id: "name", name: "Name", type: "text", required: true },
            { id: "email", name: "Email", type: "email", required: true },
            { id: "phone", name: "Phone", type: "text", required: false },
            { id: "company", name: "Company", type: "text", required: false },
            { id: "status", name: "Status", type: "select", required: true, options: ["Lead", "Prospect", "Customer"] }
          ]
        }
      ],
      views: [
        {
          id: "contact-list",
          name: "All Contacts",
          type: "list",
          schemaId: "contacts",
          config: { sortBy: "name", groupBy: "status" }
        }
      ]
    }
  },
  {
    id: "inventory",
    name: "Inventory Tracker",
    description: "Track products, stock levels, suppliers, and orders",
    icon: "📦",
    category: "business",
    features: ["Product catalog", "Stock tracking", "Supplier management"],
    template: {
      config: {
        name: "Inventory Tracker",
        description: "Track your inventory and stock",
        icon: "📦",
        category: "business",
        color: "warning"
      },
      schemas: [
        {
          id: "products",
          name: "Products",
          fields: [
            { id: "name", name: "Product Name", type: "text", required: true },
            { id: "sku", name: "SKU", type: "text", required: true },
            { id: "quantity", name: "Quantity", type: "number", required: true },
            { id: "price", name: "Price", type: "number", required: true },
            { id: "supplier", name: "Supplier", type: "text", required: false }
          ]
        }
      ],
      views: [
        {
          id: "product-list",
          name: "Products",
          type: "list",
          schemaId: "products",
          config: { sortBy: "name" }
        }
      ]
    }
  }
];

const categories = [
  { value: "all", label: "All Categories" },
  { value: "productivity", label: "Productivity" },
  { value: "business", label: "Business" },
  { value: "personal", label: "Personal" },
  { value: "collaboration", label: "Collaboration" },
];

const filteredTemplates = computed(() => {
  let filtered = templates;
  
  if (selectedCategory.value !== "all") {
    filtered = filtered.filter(t => t.category === selectedCategory.value);
  }
  
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(t => 
      t.name.toLowerCase().includes(query) ||
      t.description.toLowerCase().includes(query) ||
      t.features.some(f => f.toLowerCase().includes(query))
    );
  }
  
  return filtered;
});

async function useTemplate(template) {
  try {
    const appId = await importAppTemplate(template.template);
    if (appId) {
      router.push(`/builder/app/${appId}/design`);
    } else {
      router.push("/builder/apps");
    }
  } catch (error) {
    console.error("Failed to import template:", error);
    alert("Failed to import template: " + error.message);
  }
}
</script>

<template>
  <div class="flex-1 p-6 max-w-6xl mx-auto">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">App Templates</h1>
      <p class="text-base-content/60">Start with pre-built templates for common use cases</p>
    </div>

    <!-- Filters -->
    <div class="flex flex-col sm:flex-row gap-4 mb-8">
      <SInput
        v-model="searchQuery"
        placeholder="Search templates..."
        class="flex-1"
      />
      <select v-model="selectedCategory" class="select select-bordered w-full sm:w-48">
        <option v-for="category in categories" :key="category.value" :value="category.value">
          {{ category.label }}
        </option>
      </select>
    </div>

    <!-- Templates Grid -->
    <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      <SCard
        v-for="template in filteredTemplates"
        :key="template.id"
        class="space-y-4 hover:shadow-lg transition-shadow cursor-pointer"
        @click="useTemplate(template)"
      >
        <div class="flex items-center gap-3">
          <div class="text-3xl">{{ template.icon }}</div>
          <div class="flex-1">
            <h3 class="text-lg font-semibold">{{ template.name }}</h3>
            <div class="badge badge-outline badge-sm">{{ template.category }}</div>
          </div>
        </div>
        
        <p class="text-sm text-base-content/70">{{ template.description }}</p>
        
        <div class="space-y-2">
          <h4 class="text-sm font-medium text-base-content/80">Features:</h4>
          <div class="flex flex-wrap gap-1">
            <span
              v-for="feature in template.features"
              :key="feature"
              class="badge badge-ghost badge-xs"
            >
              {{ feature }}
            </span>
          </div>
        </div>
        
        <SButton @click.stop="useTemplate(template)" class="w-full btn-primary">
          Use This Template
        </SButton>
      </SCard>
    </div>

    <!-- Empty State -->
    <div v-if="filteredTemplates.length === 0" class="text-center py-12">
      <div class="text-6xl mb-4">🔍</div>
      <h2 class="text-2xl font-bold mb-2">No Templates Found</h2>
      <p class="text-base-content/60">Try adjusting your search or category filter</p>
    </div>

    <!-- Create Custom -->
    <div class="mt-12 text-center">
      <SCard class="max-w-md mx-auto space-y-4">
        <div class="text-4xl">✨</div>
        <h3 class="text-xl font-semibold">Need Something Custom?</h3>
        <p class="text-sm text-base-content/60">
          Create your own app from scratch with our visual builder
        </p>
        <SButton @click="router.push('/builder/create')" class="btn-outline">
          Start from Scratch
        </SButton>
      </SCard>
    </div>
  </div>
</template>
