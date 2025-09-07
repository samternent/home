<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import { SButton, SCard } from "ternent-ui/components";
import { useBreadcrumbs } from "@/module/breadcrumbs/useBreadcrumbs";
import { useAppBuilder } from "@/module/builder/useAppBuilder";

const router = useRouter();
const { apps, removeApp, migrateTasks } = useAppBuilder();

useBreadcrumbs({
  path: "/builder/apps",
  name: "My Apps",
});

const hasApps = computed(() => apps.value.length > 0);

function createNewApp() {
  router.push("/builder/create");
}

function goToTemplates() {
  router.push("/builder/templates");
}

function viewApp(app) {
  router.push(`/ledger/app/${app.id}`);
}

function editApp(app) {
  router.push(`/builder/app/${app.id}/design`);
}

async function deleteApp(app) {
  if (
    confirm(
      `Are you sure you want to delete "${app.name}"? This cannot be undone.`
    )
  ) {
    await removeApp(app.id);
  }
}

async function handleMigrateTasks() {
  try {
    const taskApp = await migrateTasks();
    if (taskApp) {
      alert(`Tasks migrated successfully to "${taskApp.name}" app!`);
    } else {
      alert("No tasks found to migrate.");
    }
  } catch (error) {
    alert("Failed to migrate tasks: " + error.message);
  }
}
</script>

<template>
  <div class="flex-1 p-6 max-w-6xl mx-auto">
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-3xl font-bold">My Apps</h1>
        <p class="text-base-content/60">Manage your custom applications</p>
      </div>
      <div class="space-x-2">
        <SButton @click="handleMigrateTasks" class="btn-outline">
          <span class="mr-2">📦</span>
          Migrate Tasks
        </SButton>
        <SButton @click="goToTemplates" class="btn-secondary">
          <span class="mr-2">📋</span>
          Templates
        </SButton>
        <SButton @click="createNewApp" class="btn-primary">
          <span class="mr-2">➕</span>
          Create App
        </SButton>
      </div>
    </div>

    <!-- No Apps State -->
    <div v-if="!hasApps" class="text-center py-16">
      <div class="text-6xl mb-6">🚀</div>
      <h2 class="text-2xl font-bold mb-4">No Apps Yet</h2>
      <p class="text-base-content/60 mb-8 max-w-md mx-auto">
        Create your first custom application to get started. You can also
        migrate existing tasks.
      </p>
      <div class="space-x-4">
        <SButton @click="createNewApp" class="btn-primary btn-lg">
          <span class="mr-2">✨</span>
          Create First App
        </SButton>
        <SButton @click="goToTemplates" class="btn-outline">
          <span class="mr-2">📋</span>
          Use Template
        </SButton>
        <SButton @click="handleMigrateTasks" class="btn-outline">
          <span class="mr-2">📦</span>
          Migrate Tasks
        </SButton>
      </div>
    </div>

    <!-- Apps Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <SCard
        v-for="app in apps"
        :key="app.id"
        class="hover:shadow-lg transition-shadow group"
      >
        <div class="space-y-4">
          <!-- App Header -->
          <div class="flex items-start justify-between">
            <div class="flex items-center gap-3">
              <span class="text-3xl">{{ app.icon }}</span>
              <div>
                <h3 class="font-bold text-lg">{{ app.name }}</h3>
                <p class="text-sm text-base-content/60">
                  {{ app.description }}
                </p>
              </div>
            </div>
          </div>

          <!-- App Meta -->
          <div class="flex items-center gap-4 text-xs text-base-content/60">
            <span class="badge badge-outline">{{ app.category }}</span>
            <span class="badge badge-outline">{{ app.type }}</span>
            <span>{{ new Date(app.createdAt).toLocaleDateString() }}</span>
          </div>

          <!-- Actions -->
          <div
            class="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <SButton @click="viewApp(app)" class="btn-primary btn-sm flex-1">
              <span class="mr-1">🚀</span>
              Open
            </SButton>
            <SButton @click="editApp(app)" class="btn-secondary btn-sm flex-1">
              <span class="mr-1">✏️</span>
              Edit
            </SButton>
            <SButton @click="deleteApp(app)" class="btn-error btn-sm">
              <span class="mr-1">🗑️</span>
              Delete
            </SButton>
          </div>
        </div>
      </SCard>

      <!-- Create New App Card -->
      <SCard
        class="border-dashed border-2 border-base-300 hover:border-primary cursor-pointer transition-colors flex items-center justify-center min-h-[200px]"
        @click="createNewApp"
      >
        <div class="text-center space-y-3">
          <div class="text-4xl">➕</div>
          <h3 class="font-medium">Create New App</h3>
          <p class="text-sm text-base-content/60">
            Add another custom application
          </p>
        </div>
      </SCard>
    </div>
  </div>
</template>
