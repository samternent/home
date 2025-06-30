<script setup>
import { shallowRef, computed } from "vue";
import { onClickOutside } from "@vueuse/core";
import SButton from "./SButton.vue";

const props = defineProps({
  buttonText: {
    type: String,
    default: undefined,
  },
  items: {
    type: Array,
    default: () => [],
  },
  modelValue: {
    type: String,
    default: undefined,
  },
  position: {
    type: String,
    default: "bottom",
    validator: (value) => ["top", "bottom", "right", "left"].includes(value),
  },
  size: {
    type: String,
    default: "md",
    validator: (value) => ["sm", "md", "lg"].includes(value),
  },
});

const emit = defineEmits(["update:modelValue", "select"]);

const showMenu = shallowRef(false);
const dropdownRef = shallowRef(null);

onClickOutside(dropdownRef, () => {
  showMenu.value = false;
});

function selectItem(item) {
  emit("update:modelValue", item);
  emit("select", item);
  showMenu.value = false;
}

function openMenu() {
  showMenu.value = true;
}
function closeMenu() {
  showMenu.value = false;
}

const sizeClasses = computed(() => ({
  sm: "w-48 text-sm",
  md: "w-64 text-base", 
  lg: "w-80 text-lg",
}));

const positionClasses = computed(() => ({
  top: "bottom-full mb-2",
  bottom: "top-full mt-2",
  right: "left-full ml-2 top-0",
  left: "right-full mr-2 top-0",
}));
</script>
<template>
  <div class="relative" ref="dropdownRef">
    <slot name="activator" v-bind="{ openMenu, closeMenu, isMenuOpen: showMenu }">
      <SButton 
        @click="showMenu = !showMenu" 
        variant="outline"
        class="gap-2"
        :class="{ 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-800': showMenu }"
      >
        {{ buttonText }}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="w-4 h-4 transition-transform duration-200"
          :class="{ 'rotate-180': showMenu }"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M19.5 8.25l-7.5 7.5-7.5-7.5"
          />
        </svg>
      </SButton>
    </slot>
    
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="transform scale-95 opacity-0"
      enter-to-class="transform scale-100 opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="transform scale-100 opacity-100"
      leave-to-class="transform scale-95 opacity-0"
    >
      <div
        v-if="showMenu"
        class="absolute z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl backdrop-blur-md overflow-hidden ring-1 ring-black/5 dark:ring-white/10"
        :class="[
          sizeClasses[size],
          positionClasses[position]
        ]"
      >
        <div class="max-h-96 overflow-auto">
          <div class="py-1">
            <div v-for="item in items" :key="`menu-item-${item.value || item.name}`">
              <slot name="item" v-bind="{ item, closeMenu, selectItem }">
                <RouterLink
                  v-if="item.to"
                  :to="item.to"
                  @click="selectItem(item)"
                  class="flex items-center px-3 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors duration-200"
                  :class="{
                    'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-medium': item.value === modelValue || item.name === modelValue,
                    'text-slate-700 dark:text-slate-300': item.value !== modelValue && item.name !== modelValue,
                  }"
                >
                  <span v-if="item.icon" class="mr-3 w-4 h-4 flex-shrink-0" v-html="item.icon" />
                  <span class="flex-1 truncate">{{ item.name }}</span>
                  <span v-if="item.badge" class="ml-2 text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full">
                    {{ item.badge }}
                  </span>
                </RouterLink>
                
                <button
                  v-else
                  @click="selectItem(item)"
                  class="w-full flex items-center px-3 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors duration-200 text-left"
                  :class="{
                    'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-medium': item.value === modelValue || item.name === modelValue,
                    'text-slate-700 dark:text-slate-300': item.value !== modelValue && item.name !== modelValue,
                  }"
                >
                  <span v-if="item.icon" class="mr-3 w-4 h-4 flex-shrink-0" v-html="item.icon" />
                  <span class="flex-1 truncate">{{ item.name }}</span>
                  <span v-if="item.badge" class="ml-2 text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full">
                    {{ item.badge }}
                  </span>
                </button>
              </slot>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>
