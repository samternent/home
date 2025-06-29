<script setup>
defineProps({
  breadcrumbs: {
    type: Array,
    required: true,
  },
  separator: {
    type: String,
    default: "chevron", // "chevron", "slash", "arrow", "dot"
  },
  size: {
    type: String,
    default: "sm",
    validator: (value) => ["xs", "sm", "md"].includes(value),
  },
});

const separatorIcons = {
  chevron: "M8.25 4.5l7.5 7.5-7.5 7.5",
  slash: "",
  arrow: "M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3",
  dot: "",
};

const sizeClasses = {
  xs: "text-xs",
  sm: "text-sm",
  md: "text-base",
};
</script>
<template>
  <nav 
    class="flex items-center transition-all duration-200"
    :class="sizeClasses[size]"
    aria-label="Breadcrumb"
  >
    <ol class="flex items-center space-x-2">
      <li 
        v-for="(breadcrumb, index) in breadcrumbs" 
        :key="breadcrumb.path"
        class="flex items-center"
      >
        <!-- Breadcrumb link -->
        <RouterLink
          :to="breadcrumb.path"
          class="flex items-center gap-2 px-2 py-1 rounded-md transition-all duration-200 hover:bg-base-200/60"
          :class="{
            'text-base-content/60 hover:text-base-content': index < breadcrumbs.length - 1,
            'text-base-content font-medium cursor-default': index === breadcrumbs.length - 1,
          }"
          :aria-current="index === breadcrumbs.length - 1 ? 'page' : undefined"
        >
          <!-- Icon if provided -->
          <span v-if="breadcrumb.icon" class="w-4 h-4" v-html="breadcrumb.icon" />
          
          {{ breadcrumb.name }}
        </RouterLink>
        
        <!-- Separator -->
        <div 
          v-if="index < breadcrumbs.length - 1"
          class="flex items-center justify-center w-5 h-5 text-base-content/40"
        >
          <svg
            v-if="separator === 'chevron'"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="w-4 h-4"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              :d="separatorIcons.chevron"
            />
          </svg>
          
          <svg
            v-else-if="separator === 'arrow'"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="w-4 h-4"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              :d="separatorIcons.arrow"
            />
          </svg>
          
          <span v-else-if="separator === 'slash'" class="text-base-content/40">/</span>
          <span v-else-if="separator === 'dot'" class="text-base-content/40">•</span>
        </div>
      </li>
    </ol>
  </nav>
</template>
