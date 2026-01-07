<script setup lang="ts">
import { Button } from "ternent-ui/primitives";
import Whitepaper from "../../content/whitepaper.md";
import Logo from "../../module/brand/Logo.vue";
</script>
<template>
  <header class="site-header">
    <div class="site-header__inner">
      <a class="brand" href="/">Concord</a>

      <nav class="nav flex items-center gap-2">
        <RouterLink to="/protocol/spec" class="">Protocol Spec</RouterLink>
        <RouterLink
          to="/playground"
          class="py-1 px-3 rounded-md bg-[var(--ui-primary)] text-[var(--ui-on-primary)] hover:bg-[var(--ui-primary-hover)] active:bg-[var(--ui-primary-active)] hover:shadow-[var(--ui-glow-primary)]"
          >Try it</RouterLink
        >
      </nav>

      <div class="site-header__actions"></div>
    </div>
  </header>
  <main class="page px-4 py-12">
    <Whitepaper />
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
