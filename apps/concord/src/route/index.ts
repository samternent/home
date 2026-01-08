import { createRouter, createWebHistory } from "vue-router";

import Docs from "./docs/Docs.vue";
import Home from "./home/Home.vue";

type DocMeta = {
  title?: string;
  description?: string;
  section?: string;
  order?: number;
};

/**
 * Loads markdown modules and builds route + nav metadata.
 *
 * Convention:
 * - Markdown files live in: src/content/**\/**.md
 * - URL path mirrors folders, without extension
 *   e.g. src/content/spec/v0/ledger-format.md -> /spec/v0/ledger-format
 */
const mdModules = import.meta.glob("./../content/**/*.md", {
  eager: true,
}) as Record<string, { default: any; frontmatter?: DocMeta }>;

function toRoutePath(filePath: string): string {
  // "./content/spec/v0/ledger-format.md" -> "/spec/v0/ledger-format"
  const withoutPrefix = filePath.replace(/^\..\/content/, "");
  const withoutExt = withoutPrefix.replace(/\.md$/, "");
  const normalized = withoutExt
    .replace(/\/README$/i, "")
    .replace(/\/index$/i, "");
  return normalized.length ? normalized : "/";
}

const docRoutes = Object.entries(mdModules).map(([file, mod]) => {
  const path = toRoutePath(file);

  // The markdown file becomes a Vue component: mod.default
  // We'll pass it to DocPage via route meta so DocPage can render it inside a layout.
  return {
    path,
    name: `doc:${path}`,
    component: Docs,
    meta: {
      docComponent: mod.default,
      frontmatter: mod.frontmatter ?? {},
    },
  };
});

export const routes = [
  { path: "/", name: "home", component: Home },

  // Playground: keep client-only routes under /playground
  {
    path: "/playground",
    component: () => import("./playground/Playground.vue"),
    children: [
      {
        path: "demo",
        name: "playground-demo",
        component: () => import("./playground/PlaygroundDemo.vue"),
      },
      // later: /playground/create, /playground/verify, etc.
    ],
  },

  // Generated docs/spec routes
  ...docRoutes,

  // Optional: 404
  { path: "/:pathMatch(.*)*", redirect: "/" },
];

export function createAppRouter() {
  return createRouter({
    history: createWebHistory(),
    routes,
    scrollBehavior() {
      return { top: 0 };
    },
  });
}
