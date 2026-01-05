<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();

const docComponent = computed(() => (route.meta.docComponent as any) ?? null);
const frontmatter = computed(() => (route.meta.frontmatter as any) ?? {});
</script>

<template>
  <article v-if="docComponent">
    <header style="margin-bottom: 16px">
      <h1 style="margin: 0">{{ frontmatter.title ?? "" }}</h1>
      <p v-if="frontmatter.description" style="margin: 8px 0 0; opacity: 0.75">
        {{ frontmatter.description }}
      </p>
    </header>

    <component :is="docComponent" />
  </article>

  <div v-else>
    <h1>Missing doc</h1>
    <p>This route has no bound markdown component.</p>
  </div>
</template>
