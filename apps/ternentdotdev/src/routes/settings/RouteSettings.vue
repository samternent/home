<template>
  <section class="space-y-4">
    <header>
      <h1 class="m-0 text-2xl">Settings</h1>
      <p class="mt-2 text-sm text-fg-muted">
        Configure appearance and foundational identity workflows.
      </p>
    </header>

    <nav class="flex flex-wrap gap-2 rounded-lg border border-border bg-surface p-2 text-sm">
      <RouterLink class="rounded-md px-3 py-2 hover:bg-surface-hover" to="/settings/appearance">
        Appearance
      </RouterLink>
      <RouterLink class="rounded-md px-3 py-2 hover:bg-surface-hover" to="/settings/identity">
        Identity
      </RouterLink>
    </nav>

    <RouterView />
  </section>
</template>
