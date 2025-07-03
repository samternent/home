<script setup>
defineProps({
  links: {
    type: Array,
    default: () => [],
  },
  variant: {
    type: String,
    default: "default",
    validator: (value) => ["default", "minimal", "compact"].includes(value),
  },
});

const variantClasses = {
  default: "py-8 px-6",
  minimal: "py-4 px-6", 
  compact: "py-3 px-4",
};
</script>
<template>
  <footer 
    class="w-full bg-base-200/30 border-t border-base-200/60 mt-auto"
    :class="variantClasses[variant]"
  >
    <div class="container-modern">
      <div class="flex flex-col space-y-4 md:flex-row md:space-y-0 md:items-center md:justify-between">
        <!-- Top/Left content -->
        <div class="flex flex-col items-center md:items-start">
          <slot name="top" />
        </div>

        <!-- Navigation links -->
        <nav v-if="links?.length" class="flex flex-wrap items-center justify-center gap-4 md:gap-6">
          <template v-for="link in links" :key="link.to">
            <a
              v-if="link.external"
              :href="link.to"
              target="_blank"
              rel="noopener noreferrer"
              class="text-sm text-base-content/70 hover:text-base-content transition-colors duration-200 hover:underline"
            >
              {{ link.title }}
            </a>
            <RouterLink 
              v-else 
              :to="link.to" 
              class="text-sm text-base-content/70 hover:text-base-content transition-colors duration-200 hover:underline"
            >
              {{ link.title }}
            </RouterLink>
          </template>
        </nav>

        <!-- Bottom/Right content -->
        <div class="flex flex-col items-center md:items-end">
          <slot name="bottom" />
        </div>
      </div>
    </div>
  </footer>
</template>
