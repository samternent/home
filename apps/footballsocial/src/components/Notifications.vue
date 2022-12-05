<script setup>
import { onMounted, shallowRef } from "vue";
import { onClickOutside } from "@vueuse/core";
import { useNotifications } from "../composables/useNotifications";

const { notifications, fetchNotifications } = useNotifications();

onMounted(fetchNotifications);

const showNotifications = shallowRef(false);
const dropdownRef = shallowRef(null);
onClickOutside(dropdownRef, (event) => {
  showNotifications.value = false;
});
</script>
<template>
  <div class="relative" ref="dropdownRef">
    <button @click="showNotifications = !showNotifications" class="flex">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        class="w-6 h-6"
      >
        <path
          fill-rule="evenodd"
          d="M5.25 9a6.75 6.75 0 0113.5 0v.75c0 2.123.8 4.057 2.118 5.52a.75.75 0 01-.297 1.206c-1.544.57-3.16.99-4.831 1.243a3.75 3.75 0 11-7.48 0 24.585 24.585 0 01-4.831-1.244.75.75 0 01-.298-1.205A8.217 8.217 0 005.25 9.75V9zm4.502 8.9a2.25 2.25 0 104.496 0 25.057 25.057 0 01-4.496 0z"
          clip-rule="evenodd"
        />
      </svg>
      <div
        class="w-2 h-2 rounded-full bg-pink-500"
        v-if="notifications.length"
      />
    </button>

    <div
      v-if="showNotifications"
      class="absolute right-0 top-8 flex flex-col overflow-hidden text-left rounded border border-[#3e3e3e] w-64"
    >
      <template v-if="notifications.length">
        <RouterLink
          class="bg-[#1d1d1d] block px-3 py-3 text-left w-full border-b text-sm border-[#242424]"
          v-for="(item, index) in notifications"
          :key="index"
          @click="showNotifications = false"
          :to="{
            path: `/leagues/${item.discussion.competition}/discussions/${item.entity_id}`,
            hash: `#${item.specifier_id}`,
          }"
          ><span class="mention">@{{ item.actor }}</span> mentioned you in a
          comment.
        </RouterLink>
      </template>
      <div class="item" v-else>No result</div>
    </div>
  </div>
</template>
