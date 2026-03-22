<script setup lang="ts">
import { computed } from "vue";
import { RouterLink } from "vue-router";
import { PageSurface } from "ternent-ui/patterns";
import { useIdentitySession } from "@/modules/identity";
import PixpaxIdentityGlyph from "@/modules/ui/components/PixpaxIdentityGlyph.vue";
import PixpaxLogoText from "@/modules/ui/components/PixpaxLogoText.vue";

const identities = useIdentitySession();
const activeIdentity = computed(() => identities.identity.value);
</script>

<template>
  <PageSurface>
    <div
      class="mx-auto flex min-h-screen w-full flex-col px-4 pb-12 pt-5 sm:px-6 lg:px-8 pixbook-surface"
    >
      <header class="mb-8">
        <div
          class="flex items-center justify-between gap-3 text-[var(--ui-fg-muted)]"
        >
          <RouterLink
            to="/"
            class="text-[10px] uppercase tracking-[0.28em] text-inherit no-underline transition hover:text-[var(--ui-fg)]"
          >
            pixpax
          </RouterLink>
          <RouterLink
            to="/app/settings/children"
            class="inline-flex items-center gap-2 rounded-full px-1 py-1 text-inherit no-underline transition hover:-translate-y-0.5 hover:text-[var(--ui-fg)]"
            :aria-label="
              activeIdentity?.displayName ||
              activeIdentity?.id ||
              'Current child'
            "
            title="Current child"
          >
            <PixpaxIdentityGlyph
              :identity="
                activeIdentity?.serializedIdentity.publicKey ||
                activeIdentity?.fingerprint ||
                activeIdentity?.id ||
                'pixpax-child'
              "
              size="sm"
            />
          </RouterLink>
        </div>

        <div class="mt-7 flex flex-col items-center gap-5">
          <RouterLink
            to="/app"
            class="inline-flex flex-col items-center gap-2 text-[var(--ui-fg)] no-underline transition-transform duration-200 hover:-translate-y-0.5"
          >
            <PixpaxLogoText
              class="h-7 w-auto sm:h-8 lg:h-9 drop-shadow-[0_8px_28px_rgba(0,0,0,0.24)]"
            />
          </RouterLink>
        </div>
      </header>

      <main class="mt-8 flex-1 max-w-7xl mx-auto">
        <RouterView />
      </main>

      <footer class="mt-12">
        <div
          class="flex flex-col items-center gap-3 border-t border-[color-mix(in_srgb,var(--ui-border)_72%,transparent)] py-8 text-center text-sm text-[var(--ui-fg-muted)]"
        >
          <p class="m-0 leading-relaxed">
            Verifiable ownership.<br />
            POWERED BY CONCORD
          </p>
          <div
            class="flex items-center gap-3 text-[11px] uppercase tracking-[0.2em]"
          >
            <RouterLink
              to="/"
              class="text-current no-underline hover:text-[var(--ui-fg)]"
            >
              About
            </RouterLink>
            <RouterLink
              to="/app/admin"
              class="text-current no-underline hover:text-[var(--ui-fg)]"
            >
              Admin
            </RouterLink>
            <RouterLink
              to="/app/settings/my-device"
              class="text-current no-underline hover:text-[var(--ui-fg)]"
            >
              Settings
            </RouterLink>
          </div>
        </div>
      </footer>
    </div>
  </PageSurface>
</template>
<style scoped>
.pixbook-surface {
  background: radial-gradient(
    circle at top center,
    color-mix(in srgb, var(--ui-bg) 80%, transparent),
    transparent 52%
  );
}
</style>
