<script setup>
import { provideCurrentUser } from "./composables/useCurrentUser";
import SetUsername from "./components/SetUsername.vue";

const { user, profile, ready } = provideCurrentUser();
</script>

<template>
  <div class="text-white absolute inset-0 flex flex-col">
    <div class="flex-1 flex flex-col" v-if="ready">
      <!-- <div
        v-if="user && !notificationsDeclined && !notificationsEnabled"
        class="max-w-7xl px-4 py-2 rounded my-2 mx-auto flex items-center w-full justify-end"
      >
        Don't miss a beat.
        <button
          @click="requestNotifcationPermissions"
          class="bg-pink-600 flex ml-4 transition-all text-sm shadow-block-yellow text-white px-3 py-1 rounded no-underline hover:no-underline hover:text-white hover:bg-pink-500"
        >
          Enable Notifications
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            class="w-5 h-5 ml-2"
          >
            <path
              fill-rule="evenodd"
              d="M5.25 9a6.75 6.75 0 0113.5 0v.75c0 2.123.8 4.057 2.118 5.52a.75.75 0 01-.297 1.206c-1.544.57-3.16.99-4.831 1.243a3.75 3.75 0 11-7.48 0 24.585 24.585 0 01-4.831-1.244.75.75 0 01-.298-1.205A8.217 8.217 0 005.25 9.75V9zm4.502 8.9a2.25 2.25 0 104.496 0 25.057 25.057 0 01-4.496 0z"
              clip-rule="evenodd"
            />
          </svg>
        </button>
      </div> -->
      <template v-if="user && !profile?.username">
        <SetUsername />
      </template>
      <RouterView v-else />
    </div>
  </div>
</template>
