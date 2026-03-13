<script setup lang="ts">
import { skeletonProps } from "./Skeleton.props";
import {
  skeletonAnimatedClass,
  skeletonBaseClass,
  skeletonShapeClasses,
  skeletonSizeClasses,
} from "./Skeleton.variants";

const props = defineProps(skeletonProps);
</script>

<template>
  <div class="space-y-2">
    <div
      v-for="line in Math.max(props.lines, 1)"
      :key="line"
      :class="[
        skeletonBaseClass,
        skeletonShapeClasses[props.shape],
        skeletonSizeClasses[props.size],
        props.animated ? skeletonAnimatedClass : '',
      ]"
    />
  </div>
</template>

<style scoped>
@keyframes skeleton-shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
</style>
