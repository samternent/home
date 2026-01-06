<script lang="ts" setup>
import Logo from "./module/brand/Logo.vue";
</script>
<template>
  <header class="site-header">
    <div class="site-header__inner">
      <a class="brand" href="/">Concord</a>

      <!-- <nav class="nav">
        <a href="/playground" class="nav__link">Playground</a>
      </nav> -->

      <div class="site-header__actions"></div>
    </div>
  </header>

  <main class="page">
    <RouterView />
  </main>

  <footer class="flex justify-end items-center py-12 site-footer">
    <div class="site-footer__inner w-full flex justify-end">
      <div class="site-footer__links">
        <a
          href="mailto:concord@ternent.dev"
          class="flex flex-col items-center justify-center gap-2"
        >
          <Logo class="h-8 w-8 opacity-70" />
        </a>
      </div>
    </div>
  </footer>
</template>
<style>
.site-header {
  position: sticky;
  top: 0;
  z-index: 20;
  background: color-mix(in srgb, var(--paper) 58%, transparent);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--rule);
}

.site-header__inner {
  max-width: 980px;
  margin: 0 auto;
  padding: 8px;
  display: flex;
  align-items: center;
  gap: 18px;
}

.brand {
  font-family: "Noto Serif", serif;
  font-weight: 900;
  letter-spacing: -0.08em;
  color: var(--ink);
  text-decoration: none;
  font-size: 1.4em;
}

.nav {
  display: flex;
  gap: 16px;
  margin-left: auto;
}

.nav__link {
  color: var(--muted);
  text-decoration: none;
  padding: 6px 2px;
  border-bottom: 1px solid transparent;
}

.nav__link:hover {
  color: var(--ink);
  border-bottom-color: var(--rule);
}

.nav__link[aria-current="page"] {
  color: var(--ink);
  border-bottom-color: var(--ink);
}

.site-header__actions {
  display: flex;
  gap: 10px;
  margin-left: 6px;
}

.icon-link {
  color: var(--muted);
  background: transparent;
  border: 1px solid var(--rule);
  border-radius: 999px;
  padding: 6px 10px;
  cursor: pointer;
}
.icon-link:hover {
  color: var(--ink);
  border-color: color-mix(in srgb, var(--rule) 40%, var(--ink));
}

.page {
  margin: 0 auto 30px;
  gap: 44px;
  max-width: 100vw;
  align-items: start;
  max-width: 980px;
}

.site-footer {
  border-top: 1px solid var(--rule);
  padding: 28px 0;
}

.site-footer__inner {
  max-width: 980px;
  margin: 0 auto;
  padding: 0 22px;
  display: flex;
  gap: 16px;
  color: var(--muted);
  font-size: 0.92rem;
}

.site-footer__links a {
  color: var(--muted);
  text-decoration: none;
  margin-left: 12px;
}
.site-footer__links a:hover {
  color: var(--ink);
  text-decoration: underline;
  text-underline-offset: 3px;
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

.docs-nav__group-link {
  color: inherit;
  text-decoration: none;
}

.docs-nav__group-link[aria-current="page"] {
  text-decoration: underline;
  text-underline-offset: 3px;
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
