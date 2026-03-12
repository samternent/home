<script setup lang="ts">
import { SButton, SCard } from "ternent-ui/components";
</script>

<template>
  <div class="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-10 md:px-8 md:py-12">
    <header class="mb-12 flex items-center justify-between border-b border-border pb-5">
      <div class="space-y-1">
        <h1 class="m-0 text-2xl font-medium tracking-tight">Portable Proof</h1>
        <p class="m-0 text-sm text-fg-muted">by ternent.dev</p>
      </div>
      <a href="https://ternent.dev" target="_blank" rel="noreferrer" class="text-sm text-fg-muted transition hover:text-fg">
        ternent.dev
      </a>
    </header>

    <main class="flex-1 py-6 md:py-10">
      <div class="space-y-10 md:space-y-12">
        <div class="max-w-3xl space-y-5">
          <h2 class="m-0 text-4xl font-medium tracking-tight md:text-5xl">Sign and verify proofs locally in your browser.</h2>
          <p class="m-0 text-base leading-7 text-fg-muted">
            Portable Proof lets you generate or import an identity, sign text or a single file, export a portable proof,
            and verify that proof offline.
          </p>
        </div>

        <SCard class="max-w-3xl space-y-6 border border-border bg-surface p-6 md:p-8">
          <div class="flex flex-wrap gap-3">
            <SButton variant="primary" to="/app">Open App</SButton>
            <SButton variant="secondary" to="/app/verify">Verify a Proof</SButton>
          </div>
          <p class="m-0 text-sm text-fg-muted">CLI support is coming soon.</p>
        </SCard>
      </div>
    </main>

    <footer class="mt-14 space-y-2 border-t border-border pt-5 text-sm text-fg-muted">
      <div class="flex items-center justify-between">
        <a href="https://ternent.dev" target="_blank" rel="noreferrer" class="hover:text-fg">ternent.dev</a>
        <a href="https://github.com/samternent/home" target="_blank" rel="noreferrer" class="hover:text-fg">GitHub</a>
      </div>
      <p class="m-0 text-xs">Fully client-side. No data leaves your browser.</p>
    </footer>
  </div>
</template>
