<template>
  <main class="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-6">
    <header class="mb-6 flex items-center justify-between border-b border-[var(--ui-border)] pb-4">
      <div>
        <p class="m-0 text-xs uppercase tracking-[0.18em] text-[var(--ui-fg-muted)]">
          Solid v2
        </p>
        <h1 class="m-0 mt-2 text-xl font-semibold text-[var(--ui-fg)]">
          Minimal Runtime Slice
        </h1>
      </div>
      <nav class="flex items-center gap-2 text-sm">
        <RouterLink
          to="/"
          class="rounded-lg border border-[var(--ui-border)] px-3 py-2 text-[var(--ui-fg)] no-underline transition hover:bg-[var(--ui-tonal-secondary)]"
        >
          Home
        </RouterLink>
        <RouterLink
          to="/permissions"
          class="rounded-lg border border-[var(--ui-border)] px-3 py-2 text-[var(--ui-fg)] no-underline transition hover:bg-[var(--ui-tonal-secondary)]"
        >
          Permissions
        </RouterLink>
      </nav>
    </header>

    <section class="min-h-0 flex-1">
      <RouterView />
    </section>
  </main>
</template>
