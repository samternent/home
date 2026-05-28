<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { PageSurface } from "ternent-ui/patterns";
import { Card, Spinner } from "ternent-ui/primitives";
import { useSolidSession } from "@/modules/solid-session";

const router = useRouter();
const solid = useSolidSession();

const description = computed(() =>
  solid.error.value
    ? solid.error.value
    : "Completing the Solid sign-in flow and restoring your workspace session.",
);

onMounted(async () => {
  try {
    await solid.completeRedirect();
  } finally {
    await router.replace("/app");
  }
});
</script>

<template>
  <PageSurface>
    <div class="mx-auto flex min-h-screen max-w-2xl items-center px-6 py-16">
      <Card variant="panel" padding="lg" class="w-full space-y-4 text-center">
        <div class="flex justify-center">
          <Spinner size="lg" />
        </div>
        <div class="space-y-2">
          <p class="m-0 text-xs font-medium uppercase tracking-[0.24em] text-[var(--ui-fg-muted)]">
            Solid login
          </p>
          <h1 class="m-0 text-3xl tracking-tight text-[var(--ui-fg)]">Completing sign-in</h1>
          <p class="m-0 text-sm text-[var(--ui-fg-muted)]">
            {{ description }}
          </p>
        </div>
      </Card>
    </div>
  </PageSurface>
</template>
