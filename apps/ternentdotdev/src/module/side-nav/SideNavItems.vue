<script setup>
import { computed } from "vue";

defineProps({
  items: {
    type: Array,
    required: true,
  },
  collapsed: {
    type: Boolean,
    default: false,
  },
});
</script>
<template>
  <div class="flex flex-col w-full items-center justify-between px-2">
    <div
      class="flex flex-1 w-full flex-col transition-text duration-200"
      :class="{ 'text-xs': collapsed }"
    >
      <ul class="flex flex-col gap-2">
        <li v-for="item in items" :key="`path_${item.to}`">
          <RouterLink
            :to="item.to"
            class="link hover:link-active font-medium line-clamp-1 break-all py-2 flex gap-2 items-center h-14 text-base transition-all"
            :class="{ 'justify-center': collapsed }"
            active-class="link-active"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1"
              stroke="currentColor"
              class="w-6 h-6"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                :d="item.d"
              />
            </svg>

            <Transition
              enterFromClass="opacity-0"
              enterActiveClass="transition-opacity duration-300 delay-100"
              enterToClass="opacity-100"
              leaveFromClass="opacity-100"
              leaveActiveClass="absolute transition-opacity duration-0"
              leaveToClass="opacity-0"
            >
              <span v-if="!collapsed">{{ item.name }}</span></Transition
            ></RouterLink
          >
          <Transition name="fade">
            <ul
              v-if="
                $route.matched.some(({ path }) => path.startsWith(item.to)) &&
                !collapsed
              "
              class="flex flex-col h-44 overflow-auto bg-base-200 p-2 m-2"
            >
              <li v-for="child in item.children" :key="`path1_${child.to}`">
                <RouterLink
                  :to="child.to"
                  class="font-base line-clamp-1 break-all text-base pb-2 transition-all"
                  :class="{ 'justify-center': collapsed }"
                  active-class="font-medium italic scale-105 text-primary"
                >
                  {{ child.name }}</RouterLink
                >
              </li>
            </ul>
          </Transition>
        </li>
      </ul>
    </div>
  </div>
</template>
<style scoped>
.link {
  color: inherit;
  text-decoration: none;
}

.link {
  background: linear-gradient(
      to right,
      rgba(100, 200, 200, 0.2),
      rgba(100, 200, 200, 0.2)
    ),
    linear-gradient(
      to right,
      rgba(255, 0, 0, 1),
      rgba(255, 0, 180, 1),
      rgba(0, 100, 200, 1)
    );
  background-size: 100% 3px, 0 3px;
  background-position: 100% 100%, 0 100%;
  background-repeat: no-repeat;
  transition: background-size 400ms;
}

.link-active,
.link:hover {
  background-size: 0 3px, 100% 3px;
}
</style>
