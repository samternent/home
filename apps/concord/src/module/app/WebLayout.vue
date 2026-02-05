<script setup>
import Logo from "../brand/Logo.vue";
</script>
<template>
  <header
    class="sticky top-0 z-20 bg-[color-mix(in srgb, var(--ui-bg) 58%, transparent)] backdrop-blur-[12px] border-b-[1px] border-[var(--ui-border)] w-full py-2 md:pt-0"
  >
    <div class="flex items-center justify-center pb-2">
      <RouterLink
        class="md:hidden text-[var(--ui-fg)] font-[900] text-xl no-underline tracking-[-0.08em]"
        to="/"
        >Concord</RouterLink
      >
    </div>
    <div
      class="max-w-[980px] mx-auto px-4 flex items-center w-full justify-between"
    >
      <RouterLink
        class="text-[var(--ui-fg)] font-[900] text-xl no-underline tracking-[-0.08em] brand hidden md:block"
        to="/"
        >Concord</RouterLink
      >

      <nav
        class="flex items-center gap-4 flex-1 justify-between md:justify-end"
      >
        <div class="flex items-center gap-4">
          <RouterLink to="/docs">Docs</RouterLink>
          <RouterLink to="/protocol/spec">Protocol Spec</RouterLink>
        </div>
        <RouterLink
          to="/workspace"
          class="text-xs flex items-center py-1.5 px-3 rounded-md bg-[var(--ui-primary)] text-[var(--ui-bg)] hover:bg-[var(--ui-primary-hover)] transition"
          >Demo</RouterLink
        >
      </nav>
    </div>
  </header>
  <main class="mx-auto max-w-[65ch] py-6 lg:py-12 px-2"><slot /></main>

  <footer
    class="flex justify-end items-center py-12 border-t-[1px] border-[var(--ui-border)] w-full"
  >
    <div class="max-w-[980px] mx-auto w-full flex justify-end group">
      <a
        href="mailto:sam@ternent.dev"
        class="flex items-end justify-center gap-3 opacity-80 hover:opacity-100"
      >
        <span
          class="text-xs font-mono font-thin -translate-y-1 group-hover:translate-y-0.5 group-hover:translate-x-1.5 transition-all duration-300"
          >sam@ternent.dev</span
        >
        <Logo
          class="size-8 group-hover:-rotate-6 transition-all duration-300"
        />
      </a>
    </div>
  </footer>
</template>
