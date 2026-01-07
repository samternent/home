<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import Logo from "../../module/brand/Logo.vue";
import { buildSidebarNav } from "../../content/navigation";

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
  <header class="site-header">
    <div class="site-header__inner">
      <a class="brand" href="/">Concord</a>

      <nav class="nav">
        <RouterLink to="/playground" class="">Try it</RouterLink>
      </nav>

      <div class="site-header__actions"></div>
    </div>
  </header>
  <main class="page px-4 py-12">
    <article class="docs__content">
      <article v-if="docComponent" style="width: 780px; margin: 0 auto">
        <header style="margin-bottom: 16px">
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
      <!-- markdown -->
    </article>
  </main>
  <footer class="flex justify-end items-center py-12 site-footer">
    <div class="site-footer__inner w-full flex justify-end">
      <div class="site-footer__links">
        <a
          href="mailto:concord@ternent.dev"
          class="flex flex-col items-center justify-center gap-2"
        >
          <Logo
            class="h-8 w-8 opacity-40 hover:opacity-60 hover:-rotate-6 transition-all duration-300"
          />
        </a>
      </div>
    </div>
  </footer>
</template>
