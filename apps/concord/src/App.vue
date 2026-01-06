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

  <main class="page px-4">
    <RouterView />
  </main>

  <footer class="flex justify-end items-center py-12 site-footer">
    <div class="site-footer__inner w-full flex justify-end">
      <div class="site-footer__links">
        <a
          href="mailto:concord@ternent.dev"
          class="flex flex-col items-center justify-center gap-2"
        >
          <Logo class="h-8 w-8 opacity-20" />
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
</style>
