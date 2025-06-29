<script setup>
const props = defineProps({
  items: {
    type: Array,
    required: true,
  },
  path: {
    type: String,
    required: true,
  },
  exact: {
    type: Boolean,
    default: false,
  },
  type: {
    type: String,
    default: "underline",
    validator: (value) => ["underline", "pills", "bordered", "lifted"].includes(value),
  },
  size: {
    type: String,
    default: "md",
    validator: (value) => ["sm", "md", "lg"].includes(value),
  },
});

function isActiveLink(t) {
  return new RegExp(`${t.path}*`, "g").test(props.path);
}
function isExactActiveLink(t) {
  return new RegExp(`^${t.path}$`, "g").test(props.path);
}

const sizeClasses = {
  sm: "text-sm px-3 py-2",
  md: "text-base px-4 py-2.5", 
  lg: "text-lg px-5 py-3",
};

const typeClasses = {
  underline: "border-b-2 border-transparent hover:border-primary/50 transition-all duration-200",
  pills: "rounded-lg hover:bg-primary/10 transition-all duration-200",
  bordered: "border border-base-300 hover:border-primary/50 transition-all duration-200",
  lifted: "rounded-t-lg border-b-2 border-transparent hover:bg-base-200/50 transition-all duration-200",
};

const activeClasses = {
  underline: "border-primary text-primary font-medium",
  pills: "bg-primary text-primary-content font-medium shadow-md",
  bordered: "border-primary bg-primary/10 text-primary font-medium",
  lifted: "bg-base-100 border-base-300 border-b-base-100 font-medium shadow-sm -mb-0.5",
};
</script>
<template>
  <div class="relative">
    <!-- Background line for underline type -->
    <div 
      v-if="type === 'underline'" 
      class="absolute bottom-0 left-0 right-0 h-0.5 bg-base-300"
    />
    
    <nav 
      role="tablist"
      class="flex relative"
      :class="{
        'space-x-1': type === 'pills',
        'space-x-0': type !== 'pills',
        'border-b border-base-300': type === 'lifted',
      }"
    >
      <RouterLink
        v-for="t in items"
        :key="`tab-${t.path}`"
        :to="t.path"
        role="tab"
        class="relative flex items-center gap-2 font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2"
        :class="[
          sizeClasses[size],
          typeClasses[type],
          {
            [activeClasses[type]]: 
              (!exact && isActiveLink(t)) || (exact && isExactActiveLink(t)),
          }
        ]"
      >
        <!-- Icon if provided -->
        <span v-if="t.icon" class="w-4 h-4" v-html="t.icon" />
        
        {{ t.title }}
        
        <!-- Badge if provided -->
        <span 
          v-if="t.badge" 
          class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/20 text-primary"
        >
          {{ t.badge }}
        </span>
        
        <!-- Active indicator for underline type -->
        <span 
          v-if="type === 'underline' && ((!exact && isActiveLink(t)) || (exact && isExactActiveLink(t)))"
          class="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
        />
      </RouterLink>
    </nav>
  </div>
</template>
