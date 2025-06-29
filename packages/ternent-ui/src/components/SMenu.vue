<script setup>
import { shallowRef } from "vue";
import { onClickOutside } from "@vueuse/core";
import SButton from "./SButton.vue";

defineProps({
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

const sizeClasses = {
  sm: "w-48 text-sm",
  md: "w-64 text-base", 
  lg: "w-80 text-lg",
};
</script>
<template>
  <div class="relative" ref="dropdownRef">
    <slot name="activator" v-bind="{ openMenu, closeMenu, isMenuOpen: showMenu }">
      <SButton 
        @click="showMenu = !showMenu" 
        class="gap-2 hover:scale-105 transition-all duration-200"
        :class="{ 'bg-primary/10': showMenu }"
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
            d="M8.25 15 12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9"
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
        class="absolute z-50 bg-base-100 border border-base-200/60 rounded-xl shadow-lg backdrop-blur-md overflow-hidden"
        :class="[
          sizeClasses[size],
          {
            'bottom-full mb-2': position === 'top',
            'top-full mt-2': position === 'bottom',
            'left-full ml-2 top-0': position === 'right',
            'right-full mr-2 top-0': position === 'left',
          }
        ]"
      >
        <!-- Gradient overlay for depth -->
        <div class="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>
        
        <div class="relative max-h-96 overflow-auto">
          <ul class="py-2">
            <li v-for="item in items" :key="`menu-item-${item.value || item.name}`">
              <slot name="item" v-bind="{ item, closeMenu, selectItem }">
                <RouterLink
                  v-if="item.to"
                  :to="item.to"
                  @click="selectItem(item)"
                  class="flex items-center px-4 py-2.5 text-sm hover:bg-primary/10 transition-colors duration-200"
                  :class="{
                    'bg-primary/15 text-primary font-medium': item.value === modelValue || item.name === modelValue,
                  }"
                >
                  <span v-if="item.icon" class="mr-3 w-4 h-4" v-html="item.icon" />
                  {{ item.name }}
                  <span v-if="item.badge" class="ml-auto text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                    {{ item.badge }}
                  </span>
                </RouterLink>
                
                <button
                  v-else
                  @click="selectItem(item)"
                  class="w-full flex items-center px-4 py-2.5 text-sm hover:bg-primary/10 transition-colors duration-200 text-left"
                  :class="{
                    'bg-primary/15 text-primary font-medium': item.value === modelValue || item.name === modelValue,
                  }"
                >
                  <span v-if="item.icon" class="mr-3 w-4 h-4" v-html="item.icon" />
                  {{ item.name }}
                  <span v-if="item.badge" class="ml-auto text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                    {{ item.badge }}
                  </span>
                </button>
              </slot>
            </li>
          </ul>
        </div>
      </div>
    </Transition>
  </div>
</template>
