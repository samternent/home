<script setup>
import { useBreadcrumbs } from "../../module/breadcrumbs/useBreadcrumbs";
import UserProfileManager from "../../module/user-management/UserProfileManager.vue";
import { provideUserProfiles } from "../../module/user-management/useUserProfiles";

// Provide user profiles at the route level
provideUserProfiles();

useBreadcrumbs({
  path: "/app/profile/management",
  name: "Profile Management",
});
</script>

<template>
  <div class="flex flex-col flex-1 overflow-y-scroll">
    <div class="flex-1 mx-4 border-x border-base-300 flex flex-col bg-base-100">
      <UserProfileManager />
    </div>
  </div>
</template>
