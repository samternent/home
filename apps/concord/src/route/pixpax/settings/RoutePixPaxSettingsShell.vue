<script setup lang="ts">
const links = [
  { to: { name: "pixpax-settings-home" }, label: "Home" },
  {
    to: { name: "pixpax-settings-identity-devices" },
    label: "Identity & Devices",
  },
  { to: { name: "pixpax-settings-pixbooks" }, label: "Pixbooks" },
  { to: { name: "pixpax-settings-sync-backup" }, label: "Account Backup" },
  {
    to: { name: "pixpax-settings-import-export" },
    label: "Import / Export",
  },
  { to: { name: "pixpax-settings-danger" }, label: "Danger Zone" },
];
</script>

<template>
  <div class="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-6 md:flex-row">
    <aside class="w-full md:w-64 shrink-0 rounded-xl border border-[var(--ui-border)] p-3 h-fit">
      <p class="text-[10px] uppercase tracking-[0.22em] text-[var(--ui-fg-muted)] mb-2">
        Settings
      </p>
      <nav class="flex flex-col gap-1 text-xs">
        <RouterLink
          v-for="link in links"
          :key="link.label"
          :to="link.to"
          class="rounded-md px-3 py-2 transition-colors hover:bg-[var(--ui-fg)]/5"
          active-class="bg-[var(--ui-fg)]/10"
        >
          {{ link.label }}
        </RouterLink>
      </nav>
    </aside>

    <section class="flex-1 rounded-xl border border-[var(--ui-border)] p-4">
      <RouterView />
    </section>
  </div>
</template>
