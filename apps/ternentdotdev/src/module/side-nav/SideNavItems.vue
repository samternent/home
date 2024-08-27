<script setup>
import { computed, shallowRef } from "vue";
import { useRouter, useRoute } from "vue-router";
import { SMenu, SButton, SIndicator } from "ternent-ui/components";

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

const router = useRouter();
const route = useRoute();
function menuSelect(item) {
  router.push(item.to);
}

const activeMenuItem = shallowRef("");
const activeMenu = computed({
  get() {
    return activeMenuItem.value;
  },
  set: (item) => {
    activeMenuItem.value = item.to;
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
          <SMenu
            @select="menuSelect"
            v-model="activeMenu"
            v-if="item.children"
            :items="item.children"
            position="right"
          >
            <template #activator="{ openMenu, isMenuOpen }">
              <RouterLink
                v-if="!collapsed"
                :to="item.to"
                class="link hover:link-active font-light line-clamp-1 break-all py-2 flex gap-2 items-center text-base transition-all"
                :class="{ 'justify-center': collapsed }"
                active-class="link-active"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="1.3"
                  stroke="currentColor"
                  class="w-6 h-6"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    :d="item.d"
                  />
                </svg>

                {{ item.name }}</RouterLink
              >
              <button
                v-else
                @click="openMenu"
                class="link w-full hover:link-active font-light line-clamp-1 break-all py-2 flex gap-2 items-center text-base transition-all"
                :class="{
                  'justify-center': collapsed,
                  'link-active': $route.path.startsWith(item.to) || isMenuOpen,
                }"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="1.3"
                  stroke="currentColor"
                  class="w-6 h-6"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    :d="item.d"
                  />
                </svg>
              </button>
            </template>
            <template #item="{ item, closeMenu }">
              <div class="flex justify-between gap-2 items-center">
                <RouterLink
                  :to="item.to"
                  @click="closeMenu"
                  class="font-light flex-1 p-2 hover:font-medium cursor-pointer"
                  active-class="bg-opacity-10 font-medium underline"
                  >{{ item.name }}</RouterLink
                ><SIndicator v-if="item.tag">{{ item.tag }}</SIndicator>
              </div>
            </template>
          </SMenu>
          <RouterLink
            v-else
            :to="item.to"
            class="link hover:link-active font-light line-clamp-1 break-all py-2 flex gap-2 items-center text-base transition-all"
            :class="{ 'justify-center': collapsed }"
            active-class="link-active"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.3"
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
          <ul
            class="flex flex-col max-h-44 overflow-auto bg-base-200 p-2 m-2 opacity-100"
            :class="{
              '!opacity-0 !max-h-0 !p-0 !m-0 !overflow-hidden':
                !$route.matched.some(({ path }) => path.startsWith(item.to)) ||
                collapsed ||
                !item.children?.length,
            }"
          >
            <li
              v-for="child in item.children"
              :key="`path1_${child.to}`"
              class="flex gap-1 py-1 justify-between items-start"
            >
              <RouterLink
                :to="child.to"
                class="font-base flex-1 text-sm line-clamp-1 break-all pb-2 transition-all hover:font-medium"
                :class="{ 'justify-center': collapsed }"
                active-class="font-medium underline"
              >
                {{ child.name }} </RouterLink
              ><SIndicator v-if="child.tag">{{ child.tag }}</SIndicator>
            </li>
          </ul>
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
  background: linear-gradient(to right, oklch(var(--b1)), oklch(var(--b1))),
    linear-gradient(to right, oklch(var(--p)), oklch(var(--s)), oklch(var(--s)));
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
