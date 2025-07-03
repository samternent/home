<script setup>
import { computed, inject } from 'vue';

const props = defineProps({
  // Navigation
  to: {
    type: String,
    default: undefined,
  },
  href: {
    type: String,
    default: undefined,
  },
  external: {
    type: Boolean,
    default: false,
  },

  // Content
  label: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: undefined,
  },
  icon: {
    type: String,
    default: undefined,
  },
  badge: {
    type: [String, Number],
    default: undefined,
  },

  // States
  active: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["click"]);

// Try to get menu item classes from parent SMenu
const getMenuItemClasses = inject('getMenuItemClasses', null);

// Menu item classes
const itemClasses = computed(() => {
  if (getMenuItemClasses) {
    return getMenuItemClasses(props.active, props.disabled);
  }
  
  // Fallback classes if not used within SMenu
  const baseClasses = [
    'flex items-center justify-between',
    'px-4 py-2 text-base rounded-lg',
    'text-left transition-all duration-150 ease-out',
    'focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary-500/20',
  ];

  if (props.active) {
    baseClasses.push(
      'bg-primary-50',
      'text-primary-700',
      'font-medium'
    );
  } else {
    baseClasses.push(
      'text-base-content',
      'hover:bg-base-200',
      'hover:text-base-content'
    );
  }

  if (props.disabled) {
    baseClasses.push('opacity-50 pointer-events-none cursor-not-allowed');
  } else {
    baseClasses.push('cursor-pointer');
  }

  return baseClasses.join(' ');
});

// Component selection logic
const component = computed(() => {
  if (props.to) return 'RouterLink';
  if (props.href) return 'a';
  return 'button';
});

// Props for the dynamic component
const componentProps = computed(() => {
  const baseProps = {
    class: itemClasses.value,
    role: 'menuitem',
  };

  if (props.to) {
    return { ...baseProps, to: props.to };
  }
  
  if (props.href) {
    return {
      ...baseProps,
      href: props.href,
      target: props.external ? '_blank' : undefined,
      rel: props.external ? 'noopener noreferrer' : undefined,
    };
  }

  return {
    ...baseProps,
    type: 'button',
  };
});

// Handle click events
const handleClick = (event) => {
  if (props.disabled) {
    event.preventDefault();
    return;
  }
  emit('click', event);
};
</script>

<template>
  <component
    :is="component"
    v-bind="componentProps"
    @click="handleClick"
  >
    <!-- Content container -->
    <div class="flex items-center flex-1 min-w-0">
      <!-- Icon -->
      <div v-if="icon || $slots.icon" class="flex-shrink-0 mr-3">
        <slot name="icon">
          <svg v-if="icon === 'home'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <svg v-else-if="icon === 'settings'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <svg v-else-if="icon === 'user'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <svg v-else-if="icon === 'tools'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <svg v-else-if="icon === 'portfolio'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </slot>
      </div>

      <!-- Text content -->
      <div class="flex-1 min-w-0">
        <div class="font-medium text-sm">{{ label }}</div>
        <div v-if="description" class="text-xs text-base-content/60 truncate">
          {{ description }}
        </div>
      </div>
    </div>

    <!-- Badge or action -->
    <div v-if="badge || $slots.action" class="flex-shrink-0 ml-3">
      <slot name="action">
        <span v-if="badge" class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-base-300 text-base-content">
          {{ badge }}
        </span>
      </slot>
    </div>
  </component>
</template>
