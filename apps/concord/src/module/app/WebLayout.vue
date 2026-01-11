<script setup>
import Logo from "../brand/Logo.vue";
</script>
<template>
  <header
    class="sticky top-0 z-20 bg-[color-mix(in srgb, var(--paper) 58%, transparent)] backdrop-blur-[12px] border-b-[1px] border-[var(--rule)] w-full"
  >
    <div
      class="max-w-[980px] mx-auto px-4 py-2 flex items-center w-full justify-between"
    >
      <RouterLink
        class="text-[var(--ink)] font-[900] text-xl no-underline tracking-[-0.08em] brand"
        to="/"
        >Concord</RouterLink
      >

      <nav class="nav flex items-center gap-8">
        <RouterLink to="/index" class="">Index</RouterLink>
        <RouterLink to="/protocol/spec" class="">Protocol Spec</RouterLink>
        <RouterLink
          to="/workspace"
          class="py-1 px-3 rounded-md bg-[var(--ui-primary)] text-[var(--ui-on-primary)] hover:bg-[var(--ui-primary-hover)] active:bg-[var(--ui-primary-active)] hover:shadow-[var(--ui-glow-primary)]"
          >Demo</RouterLink
        >
      </nav>
    </div>
  </header>
  <main class="mx-auto max-w-[65ch] p-4"><slot /></main>

  <footer
    class="flex justify-end items-center py-12 border-t-[1px] border-[var(--rule)] w-full"
  >
    <div class="max-w-[980px] mx-auto w-full flex justify-end">
      <a
        href="mailto:concord@ternent.dev"
        class="flex flex-col items-center justify-center gap-2"
      >
        <Logo
          class="h-8 w-8 opacity-40 hover:opacity-60 hover:-rotate-6 transition-all duration-300"
        />
      </a>
    </div>
  </footer>
</template>
