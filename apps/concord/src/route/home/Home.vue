<script setup lang="ts">
import Whitepaper from "../../content/whitepaper.md";
import Logo from "../../module/brand/Logo.vue";
</script>
<template>
  <header class="site-header">
    <div class="site-header__inner">
      <a class="brand" href="/">Concord</a>

      <nav class="nav">
        <a href="/playground" class="">Try it</a>
      </nav>

      <div class="site-header__actions"></div>
    </div>
  </header>
  <main class="page px-4">
    <Whitepaper />
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
