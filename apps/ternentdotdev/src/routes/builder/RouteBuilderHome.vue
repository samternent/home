<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import { SButton, SCard } from "ternent-ui/components";
import { useBreadcrumbs } from "@/module/breadcrumbs/useBreadcrumbs";
import { useAppBuilder } from "@/module/builder/useAppBuilder";

const router = useRouter();
const { apps } = useAppBuilder();

useBreadcrumbs({
  path: "/t/builder",
  name: "App Builder",
});

const hasApps = computed(() => apps.value.length > 0);
const recentApps = computed(() =>
  apps.value
    .sort((a, b) => {
      const dateA = new Date(a.updatedAt || a.createdAt || 0);
      const dateB = new Date(b.updatedAt || b.createdAt || 0);
      return dateB - dateA;
    })
    .slice(0, 3)
);

function createNewApp() {
  router.push("/t/builder/create");
}

function goToTemplates() {
  router.push("/t/builder/templates");
}

function viewAllApps() {
  router.push("/t/builder/apps");
}
</script>

<template>
  <div class="flex-1 p-6 max-w-6xl mx-auto">
    <!-- Hero Section -->
    <div class="text-center mb-12">
      <div class="text-6xl mb-4">🚀</div>
      <h1 class="text-4xl font-bold mb-4">App Builder</h1>
      <p class="text-xl text-base-content/60 mb-8">
        Create custom applications with no code required
      </p>

      <div class="flex justify-center gap-4">
        <SButton variant="primary" size="xs" @click="createNewApp">
          <span class="mr-2">✨</span>
          Create New App
        </SButton>
        <SButton variant="secondary" size="lg" @click="goToTemplates">
          <span class="mr-2">📋</span>
          Use Template
        </SButton>
        <SButton v-if="hasApps" variant="ghost" size="xl" @click="viewAllApps">
          <span class="mr-2">📱</span>
          View All Apps ({{ apps.length }})
        </SButton>
      </div>
    </div>

    <!-- Recent Apps Section -->
    <div v-if="hasApps" class="mb-12">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-2xl font-bold">Recent Apps</h2>
        <SButton @click="viewAllApps" class="btn-outline btn-sm">
          View All
        </SButton>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SCard
          v-for="app in recentApps"
          :key="app.id"
          class="hover:shadow-lg transition-shadow cursor-pointer"
          @click="router.push(`/t/builder/app/${app.id}`)"
        >
          <div class="flex items-start justify-between mb-4">
            <div class="text-3xl">{{ app.icon }}</div>
            <div class="text-xs text-base-content/50">
              {{
                new Date(app.updatedAt || app.createdAt).toLocaleDateString()
              }}
            </div>
          </div>

          <h3 class="font-semibold text-lg mb-2">{{ app.name }}</h3>
          <p class="text-sm text-base-content/60 mb-4">{{ app.description }}</p>

          <div class="flex items-center gap-2">
            <span class="badge badge-sm badge-outline">{{ app.category }}</span>
            <span class="badge badge-sm" :class="`badge-${app.color}`">{{
              app.type
            }}</span>
          </div>
        </SCard>
      </div>
    </div>

    <!-- Stats Section -->
    <div v-if="hasApps" class="mb-12">
      <h2 class="text-2xl font-bold mb-6">Quick Stats</h2>

      <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
        <SCard class="text-center">
          <div class="text-3xl mb-2">📱</div>
          <div class="text-2xl font-bold">{{ apps.length }}</div>
          <div class="text-sm text-base-content/60">Total Apps</div>
        </SCard>

        <SCard class="text-center">
          <div class="text-3xl mb-2">🏭</div>
          <div class="text-2xl font-bold">
            {{ apps.filter((a) => a.category === "productivity").length }}
          </div>
          <div class="text-sm text-base-content/60">Productivity</div>
        </SCard>

        <SCard class="text-center">
          <div class="text-3xl mb-2">💼</div>
          <div class="text-2xl font-bold">
            {{ apps.filter((a) => a.category === "business").length }}
          </div>
          <div class="text-sm text-base-content/60">Business</div>
        </SCard>

        <SCard class="text-center">
          <div class="text-3xl mb-2">🎨</div>
          <div class="text-2xl font-bold">
            {{ apps.filter((a) => a.category === "custom").length }}
          </div>
          <div class="text-sm text-base-content/60">Custom</div>
        </SCard>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="!hasApps" class="text-center py-12">
      <div class="text-6xl mb-4">📱</div>
      <h2 class="text-2xl font-bold mb-2">No Apps Yet</h2>
      <p class="text-base-content/60 mb-8">
        Create your first custom application to get started
      </p>
      <SButton @click="createNewApp" class="">
        <span class="mr-2">✨</span>
        Create Your First App
      </SButton>
      <SButton @click="goToTemplates" class="btn-outline btn-lg">
        <span class="mr-2">📋</span>
        Choose Template
      </SButton>
    </div>

    <!-- Features Section -->
    <div class="mb-12">
      <h2 class="text-2xl font-bold mb-6 text-center">
        Why Use Our App Builder?
      </h2>

      <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div class="text-center space-y-4">
          <div class="text-3xl">🧩</div>
          <h3 class="font-semibold">No Code</h3>
          <p class="text-sm text-base-content/60">
            Build powerful apps without writing a single line of code
          </p>
        </div>
        <div class="text-center space-y-4">
          <div class="text-3xl">🌐</div>
          <h3 class="font-semibold">Decentralized</h3>
          <p class="text-sm text-base-content/60">
            No servers, no cloud dependencies
          </p>
        </div>
        <div class="text-center space-y-4">
          <div class="text-3xl">📦</div>
          <h3 class="font-semibold">Multiple Apps</h3>
          <p class="text-sm text-base-content/60">
            Create unlimited custom applications
          </p>
        </div>
        <div class="text-center space-y-4">
          <div class="text-3xl">🚀</div>
          <h3 class="font-semibold">Portable</h3>
          <p class="text-sm text-base-content/60">
            Export and share your entire app configuration
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
