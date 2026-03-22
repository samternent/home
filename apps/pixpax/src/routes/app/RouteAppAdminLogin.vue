<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Badge, Button, Card } from "ternent-ui/primitives";
import { usePixpaxAdminAuth } from "@/modules/admin-auth";

const route = useRoute();
const router = useRouter();
const auth = usePixpaxAdminAuth();

const tokenInput = ref(auth.token.value);
const message = ref("");
const submitting = ref(false);
const checkingSession = ref(false);

const redirectTo = computed(() => {
  const raw = String(route.query.redirect || "").trim();
  return raw || "/app/admin";
});

async function goToNext() {
  await router.replace(redirectTo.value);
}

async function continueWithSession() {
  checkingSession.value = true;
  message.value = "";
  const ok = await auth.validateToken({ force: true });
  checkingSession.value = false;
  if (!ok || !auth.isAuthenticated.value) {
    message.value = auth.error.value || "No active platform session found.";
    return;
  }
  await goToNext();
}

async function useToken() {
  submitting.value = true;
  message.value = "";
  const ok = await auth.login(tokenInput.value);
  submitting.value = false;
  if (!ok) {
    message.value = auth.error.value || "Token validation failed.";
    return;
  }
  await goToNext();
}

onMounted(async () => {
  const ok = await auth.validateToken({ force: true });
  if (ok && auth.isAuthenticated.value) {
    await goToNext();
  }
});
</script>

<template>
  <section class="mx-auto max-w-3xl space-y-6">
    <div class="space-y-2 text-center">
      <p class="m-0 text-[11px] uppercase tracking-[0.26em] text-[var(--ui-fg-muted)]">
        admin access
      </p>
      <h1 class="m-0 font-mono text-[clamp(2rem,5vw,3.4rem)] uppercase tracking-[-0.08em]">
        PixPax control
      </h1>
      <p class="m-0 text-sm text-[var(--ui-fg-muted)]">
        Use an active platform session first. Admin token remains available as a local fallback.
      </p>
    </div>

    <Card variant="showcase" padding="sm" class="space-y-5">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p class="m-0 text-[11px] uppercase tracking-[0.24em] text-[var(--ui-fg-muted)]">
            Status
          </p>
          <h2 class="m-0 text-xl font-semibold">Access check</h2>
        </div>
        <Badge :tone="auth.isAuthenticated.value ? 'success' : 'warning'" variant="soft">
          {{ auth.isAuthenticated.value ? auth.source.value : auth.status.value }}
        </Badge>
      </div>

      <div class="grid gap-3 md:grid-cols-[1fr_auto]">
        <div class="rounded-[1.25rem] border border-[var(--ui-border)] bg-[rgba(18,17,23,0.42)] p-4">
          <p class="m-0 text-sm text-[var(--ui-fg-muted)]">
            Redirect after login:
          </p>
          <p class="m-0 mt-2 break-all font-mono text-xs text-[var(--ui-fg)]">
            {{ redirectTo }}
          </p>
        </div>

        <Button
          size="lg"
          variant="secondary"
          class="!rounded-full !px-6 !font-mono !uppercase !tracking-[0.14em]"
          :disabled="checkingSession"
          @click="continueWithSession"
        >
          {{ checkingSession ? "Checking…" : "Continue with platform session" }}
        </Button>
      </div>
    </Card>

    <Card variant="subtle" padding="sm" class="space-y-4">
      <div class="space-y-1">
        <p class="m-0 text-[11px] uppercase tracking-[0.24em] text-[var(--ui-fg-muted)]">
          Local fallback
        </p>
        <p class="m-0 text-sm text-[var(--ui-fg-muted)]">
          Paste `PIX_PAX_ADMIN_TOKEN` for local/dev use.
        </p>
      </div>

      <div class="grid gap-3 md:grid-cols-[1fr_auto]">
        <input
          v-model="tokenInput"
          type="password"
          autocomplete="off"
          placeholder="Optional admin token"
          class="rounded-[1.25rem] border border-[var(--ui-border)] bg-[rgba(18,17,23,0.42)] px-4 py-3 text-sm text-[var(--ui-fg)]"
        />
        <Button
          size="lg"
          variant="plain-secondary"
          class="!rounded-full !px-6 !font-mono !uppercase !tracking-[0.14em]"
          :disabled="submitting"
          @click="useToken"
        >
          {{ submitting ? "Checking…" : "Use token" }}
        </Button>
      </div>

      <p v-if="message" class="m-0 text-sm text-[var(--ui-danger)]">
        {{ message }}
      </p>
    </Card>
  </section>
</template>
