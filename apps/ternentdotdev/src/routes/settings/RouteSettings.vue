<script setup>
import { useLocalStorage } from "@vueuse/core";
import { shallowRef, computed } from "vue";
import { useWhiteLabel } from "@/module/brand/useWhiteLabel";
import { SThemeToggle } from "ternent-ui/components";
import { useBreadcrumbs } from "@/module/breadcrumbs/useBreadcrumbs";

const whiteLabel = useWhiteLabel();

const theme = useLocalStorage("app/theme", "sleekLight");

useBreadcrumbs({
  path: "/app/settings",
  name: "Settings",
});
</script>
<template>
  <div class="p-6 max-w-2xl mx-auto">
    <div class="space-y-8">
      <!-- Theme Settings Section -->
      <div class="card bg-base-100 shadow-lg border border-base-300">
        <div class="card-body">
          <h2 class="card-title text-2xl mb-4">🎨 Theme Settings</h2>
          <p class="text-base-content/70 mb-6">Choose your preferred theme for the application</p>
          
          <div class="form-control">
            <label class="label">
              <span class="label-text font-medium">Current Theme</span>
            </label>
            <SThemeToggle 
              v-model="theme" 
              show-dropdown 
              size="lg"
              class="w-full"
            />
          </div>
        </div>
      </div>

      <!-- App Information -->
      <div class="card bg-base-100 shadow-lg border border-base-300">
        <div class="card-body">
          <h2 class="card-title text-2xl mb-4">ℹ️ App Information</h2>
          <div class="stats stats-vertical lg:stats-horizontal shadow">
            <div class="stat">
              <div class="stat-title">App Name</div>
              <div class="stat-value text-lg">{{ whiteLabel.title }}</div>
            </div>
            <div class="stat">
              <div class="stat-title">Current Theme</div>
              <div class="stat-value text-lg">{{ theme }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
