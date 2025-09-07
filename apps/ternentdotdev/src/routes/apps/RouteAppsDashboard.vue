<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import { SButton, SCard } from "ternent-ui/components";
import { provideLedgerApps } from "@/module/ledger/useLedgerApps";

const router = useRouter();
const { apps } = provideLedgerApps();

// Use apps as an array
const appsArray = computed(() => (Array.isArray(apps) ? apps : []));

function createNewApp() {
  router.push("/t/apps/new");
}

function browseTemplates() {
  router.push("/t/builder/templates");
}
</script>

<template>
  <div class="h-full flex flex-col">
    <!-- Header -->
    <div class="flex items-center justify-between p-4 border-b border-base-300">
      <div class="flex items-center gap-3">
        <h1 class="text-2xl font-bold">My Apps</h1>
        <div class="badge badge-outline">
          {{ appsArray.length }} {{ appsArray.length === 1 ? "App" : "Apps" }}
        </div>
      </div>
      <div class="flex gap-2">
        <SButton @click="createNewApp" class="btn-primary btn-sm">
          <span class="mr-1">✨</span>
          New App
        </SButton>
        <SButton @click="browseTemplates" class="btn-secondary btn-sm">
          <span class="mr-1">📋</span>
          Templates
        </SButton>
      </div>
    </div>

    <!-- Apps or Empty State -->
    <div
      v-if="appsArray.length === 0"
      class="flex-1 flex items-center justify-center"
    >
      <div class="text-center space-y-6 max-w-md">
        <div class="text-6xl">📱</div>
        <div>
          <h2 class="text-2xl font-bold mb-2">No Apps Yet</h2>
          <p class="text-base-content/70 mb-6">
            Create your first app to start organizing your data with complete
            privacy.
          </p>
        </div>
        <div class="space-y-3">
          <SButton @click="createNewApp" class="btn-primary btn-lg w-full">
            <span class="mr-2">✨</span>
            Create Your First App
          </SButton>
          <SButton @click="browseTemplates" class="btn-secondary w-full">
            <span class="mr-2">📋</span>
            Browse Templates
          </SButton>
        </div>
      </div>
    </div>

    <!-- App Grid View -->
    <div v-else class="flex-1 overflow-auto p-4">
      <div
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
      >
        <SCard
          v-for="app in appsArray"
          :key="app.id"
          class="cursor-pointer hover:shadow-lg transition-shadow p-4"
          @click="router.push(`/t/apps/${app.id}`)"
        >
          <div class="flex items-center gap-3 mb-3">
            <div class="text-2xl">{{ app.icon || "📱" }}</div>
            <div class="flex-1">
              <h3 class="font-semibold text-lg">{{ app.name }}</h3>
              <p class="text-sm text-base-content/70">
                {{ app.description || "No description" }}
              </p>
            </div>
          </div>
          <div
            class="flex items-center justify-between text-sm text-base-content/70"
          >
            <span>{{ app.schemas ? app.schemas.length : 0 }} schemas</span>
            <span>{{ app.views ? app.views.length : 0 }} views</span>
          </div>
        </SCard>
      </div>
    </div>
  </div>
</template>
