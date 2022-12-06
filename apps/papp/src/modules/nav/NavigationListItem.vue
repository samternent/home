<script setup lang="ts">
import { useAppShell } from "../../composables/useAppShell";

defineProps({
  item: {
    type: Object,
    required: true,
  },
  level: {
    type: Number,
    default: 0,
  },
});

const { themeColor } = useAppShell();
</script>
<template>
  <li class="flex flex-col border-gray-50">
    <RouterLink
      v-if="item.path"
      :to="item.path"
      :exact-active-class="`${themeColor} border-b-2 font-medium`"
      class="py-1 mx-4 border-b-2 border-white hover:border-gray-500"
      >{{ item.name }}</RouterLink
    >
    <span
      v-else
      class="py-1 mx-4 border-b-2 border-white cursor-default font-bold"
    >
      {{ item.name }}
    </span>
    <ul
      v-if="item.children"
      class="flex flex-col flex-1 gap-2 mt-2"
      :style="`margin-left: ${(level + 1) * 20}px`"
    >
      <NavigationListItem
        v-for="childItem in item.children"
        :key="childItem.path"
        :item="childItem"
        :level="level + 1"
      />
    </ul>
  </li>
</template>
<style scoped>
.pink {
  @apply border-pink-400;
}
.blue {
  @apply border-blue-400;
}
.orange {
  @apply border-orange-400;
}
.purple {
  @apply border-purple-400;
}
</style>
