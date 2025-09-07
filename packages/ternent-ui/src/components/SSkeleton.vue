<script setup>
import { computed } from "vue";

const props = defineProps({
  variant: {
    type: String,
    default: "rect",
    validator: (value) => ["rect", "circle", "text", "avatar"].includes(value),
  },
  width: {
    type: String,
    default: "full",
  },
  height: {
    type: String,
    default: "4",
  },
  lines: {
    type: Number,
    default: 1,
  },
  animated: {
    type: Boolean,
    default: true,
  },
});

const variantClasses = computed(() => ({
  rect: "rounded-xl",
  circle: "rounded-full aspect-square",
  text: "rounded-lg h-4",
  avatar: "rounded-full aspect-square w-10 h-10",
}));

const widthClass = computed(() => {
  if (props.width === "full") return "w-full";
  if (props.width.includes("px") || props.width.includes("%") || props.width.includes("rem")) {
    return "";
  }
  return `w-${props.width}`;
});

const heightClass = computed(() => {
  if (props.height.includes("px") || props.height.includes("%") || props.height.includes("rem")) {
    return "";
  }
  return `h-${props.height}`;
});

const customStyles = computed(() => {
  const styles = {};
  if (props.width.includes("px") || props.width.includes("%") || props.width.includes("rem")) {
    styles.width = props.width;
  }
  if (props.height.includes("px") || props.height.includes("%") || props.height.includes("rem")) {
    styles.height = props.height;
  }
  return styles;
});
</script>

<template>
  <div class="space-y-2">
    <div 
      v-for="line in lines" 
      :key="line"
      :class="[
        'bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700 bg-[length:200%_100%]',
        variantClasses[variant],
        widthClass,
        heightClass,
        {
          'animate-pulse': animated,
          'bg-animate': animated,
        }
      ]"
      :style="customStyles"
      v-bind="$attrs"
    />
  </div>
</template>

<style scoped>
@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

.bg-animate {
  animation: shimmer 1.5s ease-in-out infinite;
}
</style>
