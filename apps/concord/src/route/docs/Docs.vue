<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";

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
  <div class="docs">
    <aside class="docs-sidebar" aria-label="Section navigation">
      <nav class="docs-nav">
        <section
          v-for="group in nav"
          :key="group.route"
          class="docs-nav__group"
        >
          <h2 class="docs-nav__title">
            <a
              class="docs-nav__titleLink"
              :aria-current="isActive(group.route) ? 'page' : undefined"
            >
              {{ group.title }}
            </a>
          </h2>

          <ul class="docs-nav__list">
            <li v-for="page in group.children" :key="page.route">
              <a
                :href="page.route"
                :aria-current="isActive(page.route) ? 'page' : undefined"
              >
                {{ page.title }}
              </a>
            </li>
          </ul>
        </section>
      </nav>
    </aside>

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
  </div>
</template>
<style scoped>
.docs {
  margin: 0 auto;
  display: grid;
  grid-template-columns: 240px minmax(0, 1fr);
  gap: 44px;
  align-items: start;
}
.docs-sidebar {
  position: sticky;
  top: 82px; /* below your header */
  align-self: start;
  padding-right: 18px;
  border-right: 1px solid var(--rule);
}

.docs-nav {
  font-size: 0.95rem;
}

.docs-nav__group {
  margin-bottom: 22px;
}

.docs-nav__title {
  font-family: "Noto Serif", serif;
  font-weight: 700;
  font-size: 0.9rem;
  color: var(--ink);
  margin-bottom: 8px;
}

.docs-nav__list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.docs-nav__list li {
  margin: 0;
}

.docs-nav__list a {
  display: block;
  color: var(--muted);
  text-decoration: none;
  padding: 6px 0 6px 10px;
  margin-left: -10px;
  border-left: 2px solid transparent;
}

.docs-nav__list a:hover {
  color: var(--ink);
}

.docs-nav__list a[aria-current="page"] {
  color: var(--ink);
  border-left-color: var(--ink);
}
</style>
