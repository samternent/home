<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import { buildSidebarNav } from "../../content/navigation";
import WebLayout from "../../module/app/WebLayout.vue";

const nav = computed(() => buildSidebarNav());

// Active rules: highlight exact match
function isActive(to: string) {
  return route.path === to;
}

const route = useRoute();

const docComponent = computed(() => (route.meta.docComponent as any) ?? null);
const frontmatter = computed(() => (route.meta.frontmatter as any) ?? {});
</script>

<template>
  <WebLayout>
    <article v-if="docComponent">
      <header>
        <h1 style="margin: 0">{{ frontmatter.title ?? "" }}</h1>
        <p
          v-if="frontmatter.description"
          style="margin: 8px 0 0; opacity: 0.75"
        >
          {{ frontmatter.description }}
        </p>
      </header>

      <component :is="docComponent" />
    </article>

    <div v-else>
      <h1>Missing doc</h1>
      <p>This route has no bound markdown component.</p>
    </div>
  </WebLayout>
</template>
