<script setup>
import { computed } from "vue";

const props = defineProps({
  breadcrumbs: {
    type: Array,
    required: true,
  },
  separator: {
    type: String,
    default: "chevron",
  },
  size: {
    type: String,
    default: "micro",
    validator: (value) => ["nano", "micro", "small"].includes(value),
  },
});

const separatorIcons = {
  chevron: "M8.25 4.5l7.5 7.5-7.5 7.5",
  slash: "",
  arrow: "M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3",
  dot: "",
};

const sizeClasses = computed(() => ({
  nano: "breadcrumb-nano",
  micro: "breadcrumb-micro", 
  small: "breadcrumb-small",
}));
</script>

<template>
  <nav 
    class="breadcrumb-wrapper"
    :class="sizeClasses[size]"
    aria-label="Breadcrumb"
  >
    <ol class="breadcrumb-list">
      <li 
        v-for="(breadcrumb, index) in breadcrumbs" 
        :key="breadcrumb.path"
        class="breadcrumb-item"
      >
        <!-- Breadcrumb link -->
        <RouterLink
          :to="breadcrumb.path"
          class="breadcrumb-link"
          :class="{
            'breadcrumb-inactive': index < breadcrumbs.length - 1,
            'breadcrumb-active': index === breadcrumbs.length - 1,
          }"
          :aria-current="index === breadcrumbs.length - 1 ? 'page' : undefined"
        >
          <!-- Icon if provided -->
          <span v-if="breadcrumb.icon" class="breadcrumb-icon" v-html="breadcrumb.icon" />
          
          <span class="breadcrumb-text">{{ breadcrumb.name }}</span>
        </RouterLink>
        
        <!-- Separator -->
        <div 
          v-if="index < breadcrumbs.length - 1"
          class="breadcrumb-separator"
        >
          <svg
            v-if="separator === 'chevron'"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="2"
            stroke="currentColor"
            class="breadcrumb-separator-icon"
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
            stroke-width="2"
            stroke="currentColor"
            class="breadcrumb-separator-icon"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              :d="separatorIcons.arrow"
            />
          </svg>
          
          <span v-else-if="separator === 'slash'" class="breadcrumb-separator-text">/</span>
          <span v-else-if="separator === 'dot'" class="breadcrumb-separator-text">•</span>
        </div>
      </li>
    </ol>
  </nav>
</template>

<style scoped>
.breadcrumb-wrapper {
  display: flex;
  align-items: center;
  padding: 0.25rem 0;
}

.breadcrumb-list {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.breadcrumb-item {
  display: flex;
  align-items: center;
}

.breadcrumb-link {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.5rem;
  border-radius: var(--radius-md);
  transition: all 0.12s ease;
  text-decoration: none;
  font-size: 0.75rem;
  font-weight: 500;
  line-height: 1;
}

.breadcrumb-inactive {
  color: var(--text-tertiary);
}

.breadcrumb-inactive:hover {
  color: var(--text-secondary);
  background: var(--bg-secondary);
}

.breadcrumb-active {
  color: var(--text-primary);
  font-weight: 600;
  pointer-events: none;
}

.breadcrumb-icon {
  width: 0.875rem;
  height: 0.875rem;
  flex-shrink: 0;
}

.breadcrumb-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 8rem;
}

.breadcrumb-separator {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 0.25rem;
  color: var(--text-tertiary);
  opacity: 0.6;
}

.breadcrumb-separator-icon {
  width: 0.75rem;
  height: 0.75rem;
}

.breadcrumb-separator-text {
  font-size: 0.75rem;
  font-weight: 400;
}

/* Size variants */
.breadcrumb-nano .breadcrumb-link {
  font-size: 0.6875rem;
  padding: 0.125rem 0.375rem;
  gap: 0.25rem;
}

.breadcrumb-nano .breadcrumb-icon {
  width: 0.75rem;
  height: 0.75rem;
}

.breadcrumb-nano .breadcrumb-separator-icon {
  width: 0.625rem;
  height: 0.625rem;
}

.breadcrumb-micro .breadcrumb-link {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  gap: 0.375rem;
}

.breadcrumb-small .breadcrumb-link {
  font-size: 0.8125rem;
  padding: 0.375rem 0.625rem;
  gap: 0.5rem;
}

.breadcrumb-small .breadcrumb-icon {
  width: 1rem;
  height: 1rem;
}

.breadcrumb-small .breadcrumb-separator-icon {
  width: 0.875rem;
  height: 0.875rem;
}

.breadcrumb-small .breadcrumb-text {
  max-width: 10rem;
}
</style>
