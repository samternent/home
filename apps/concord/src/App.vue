<script lang="ts" setup></script>
<template>
  <header class="site-header">
    <div class="site-header__inner">
      <a class="brand" href="/">Concord</a>

      <nav class="nav flex items-center gap-2">
        <RouterLink to="/protocol/spec" class="">Protocol Spec</RouterLink>
        <RouterLink
          to="/playground"
          class="py-1 px-3 rounded-md bg-[var(--ui-primary)] text-[var(--ui-on-primary)] hover:bg-[var(--ui-primary-hover)] active:bg-[var(--ui-primary-active)] hover:shadow-[var(--ui-glow-primary)]"
          >Demo</RouterLink
        >
      </nav>

      <div class="site-header__actions"></div>
    </div>
  </header>
  <RouterView />
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
</style>
