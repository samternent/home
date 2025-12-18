<script setup>
import { shallowRef, computed } from "vue";
import { onClickOutside } from "@vueuse/core";
import { designTokens, spacing, shadows } from "../design-system/tokens.js";
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
    validator: (value) => ["sm", "md", "lg", "xl"].includes(value),
  },
  variant: {
    type: String,
    default: "default",
    validator: (value) => ["default", "minimal", "glass", "premium"].includes(value),
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
  xl: "w-96 text-lg",
}));

const positionClasses = computed(() => ({
  top: "bottom-full mb-2",
  bottom: "top-full mt-2",
  right: "left-full ml-2 top-0",
  left: "right-full mr-2 top-0",
}));

const variantClasses = computed(() => ({
  default: `bg-base-100 
           border border-base-300 
           shadow-lg`,
  minimal: `bg-base-100/95 backdrop-blur-sm
           border border-base-300/50
           shadow-md`,
  glass: `bg-base-100/80 backdrop-blur-xl
         border border-base-100/20
         shadow-xl`,
  premium: `bg-gradient-to-b from-base-100 to-base-200
           border border-base-300
           shadow-2xl
           ring-1 ring-black/5`,
}));
</script>
<template>
  <div class="relative" ref="dropdownRef">
    <slot name="activator" v-bind="{ openMenu, closeMenu, isMenuOpen: showMenu }">
      <SButton 
        @click="showMenu = !showMenu" 
        variant="outline"
        class="gap-2 transition-all duration-200"
        :class="{ 
          'bg-primary/10 border-primary/30 shadow-md ring-2 ring-primary/20': showMenu,
          'hover:shadow-sm': !showMenu 
        }"
      >
        {{ buttonText }}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="w-4 h-4 transition-transform duration-300 ease-out"
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
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="transform scale-95 opacity-0 translate-y-2"
      enter-to-class="transform scale-100 opacity-100 translate-y-0"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="transform scale-100 opacity-100 translate-y-0"
      leave-to-class="transform scale-95 opacity-0 translate-y-2"
    >
      <div
        v-if="showMenu"
        class="absolute z-50 rounded-2xl overflow-hidden"
        :class="[
          sizeClasses[size],
          positionClasses[position],
          variantClasses[variant]
        ]"
      >
        <div class="max-h-96 overflow-auto">
          <div class="py-2">
            <div v-for="item in items" :key="`menu-item-${item.value || item.name}`">
              <slot name="item" v-bind="{ item, closeMenu, selectItem }">
                <RouterLink
                  v-if="item.to"
                  :to="item.to"
                  @click="selectItem(item)"
                  class="flex items-center px-4 py-3 text-sm 
                         hover:bg-primary/5 hover:text-primary 
                         transition-all duration-200 
                         focus:outline-none focus:bg-primary/10
                         group relative"
                  :class="{
                    'bg-primary/10 text-primary font-medium border-r-2 border-primary': 
                      item.value === modelValue || item.name === modelValue,
                    'text-neutral-700': 
                      item.value !== modelValue && item.name !== modelValue,
                  }"
                >
                  <span v-if="item.icon" 
                        class="mr-3 w-4 h-4 flex-shrink-0 transition-transform duration-200 
                               group-hover:scale-110" 
                        v-html="item.icon" />
                  <span class="flex-1 truncate">{{ item.name }}</span>
                  <span v-if="item.badge" 
                        class="ml-3 text-xs px-2 py-1 rounded-full 
                               bg-neutral-100 text-neutral-600">
                    {{ item.badge }}
                  </span>
                  <svg v-if="item.to" 
                       class="ml-2 w-3 h-3 opacity-0 group-hover:opacity-100 
                              transition-all duration-200 transform group-hover:translate-x-1"
                       fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                          d="M9 5l7 7-7 7"/>
                  </svg>
                </RouterLink>
                
                <button
                  v-else
                  @click="selectItem(item)"
                  class="w-full flex items-center px-4 py-3 text-sm 
                         hover:bg-primary/5 hover:text-primary 
                         transition-all duration-200 text-left
                         focus:outline-none focus:bg-primary/10
                         group relative"
                  :class="{
                    'bg-primary/10 text-primary font-medium border-r-2 border-primary': 
                      item.value === modelValue || item.name === modelValue,
                    'text-neutral-700': 
                      item.value !== modelValue && item.name !== modelValue,
                  }"
                >
                  <span v-if="item.icon" 
                        class="mr-3 w-4 h-4 flex-shrink-0 transition-transform duration-200 
                               group-hover:scale-110" 
                        v-html="item.icon" />
                  <span class="flex-1 truncate">{{ item.name }}</span>
                  <span v-if="item.badge" 
                        class="ml-3 text-xs px-2 py-1 rounded-full 
                               bg-neutral-100 text-neutral-600">
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
