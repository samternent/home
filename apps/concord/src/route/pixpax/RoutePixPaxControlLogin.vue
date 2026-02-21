<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Button } from "ternent-ui/primitives";
import { usePixpaxAuth } from "../../module/pixpax/auth/usePixpaxAuth";

const route = useRoute();
const router = useRouter();
const auth = usePixpaxAuth();

const tokenInput = ref(auth.token.value);
const submitting = ref(false);
const checkingSession = ref(false);
const message = ref("");

const controlRouteNames = new Set([
  "pixpax-control-login",
  "pixpax-control-creator",
  "pixpax-control-analytics",
  "pixpax-control-admin",
]);

function getDefaultRedirectPath() {
  return router.resolve({ name: "pixpax-control-admin" }).fullPath;
}

function parseRedirectRouteName() {
  const raw = route.query.redirect;
  if (typeof raw !== "string" || !raw.trim()) return "pixpax-control-admin";
  const resolved = router.resolve(raw);
  if (!controlRouteNames.has(String(resolved.name || ""))) {
    return "pixpax-control-admin";
  }
  return String(resolved.name);
}

const redirectTo = computed(() => {
  const routeName = parseRedirectRouteName();
  return router.resolve({ name: routeName }).fullPath;
});

function resolvePostLoginPath() {
  const targetName = parseRedirectRouteName();
  if (
    targetName === "pixpax-control-analytics" &&
    !auth.hasPermission("pixpax.analytics.read")
  ) {
    return router.resolve({ name: "pixpax-control-creator" }).fullPath;
  }
  if (
    targetName === "pixpax-control-admin" &&
    !auth.hasPermission("pixpax.admin.manage")
  ) {
    return router.resolve({ name: "pixpax-control-creator" }).fullPath;
  }
  return router.resolve({ name: targetName }).fullPath || getDefaultRedirectPath();
}

async function submit() {
  submitting.value = true;
  message.value = "";
  const ok = await auth.login(tokenInput.value);
  submitting.value = false;

  if (!ok) {
    message.value = auth.error.value || "Token validation failed.";
    return;
  }
  await router.replace(resolvePostLoginPath());
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
  await router.replace(resolvePostLoginPath());
}

onMounted(async () => {
  const ok = await auth.validateToken({ force: true });
  if (ok && auth.isAuthenticated.value) {
    await router.replace(resolvePostLoginPath());
  }
});
</script>

<template>
  <div class="mx-auto w-full max-w-2xl p-6">
    <section class="rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg)] p-6">
      <h1 class="text-xl font-semibold">PixPax Control Login</h1>
      <p class="mt-2 text-sm text-[var(--ui-fg-muted)]">
        Use your platform session first. Admin token is optional fallback.
      </p>

      <div class="mt-4 flex flex-wrap items-center gap-2">
        <Button class="!px-4 !py-2" :disabled="checkingSession" @click="continueWithSession">
          {{ checkingSession ? "Checking session..." : "Continue with platform session" }}
        </Button>
      </div>

      <div class="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
        <label class="field">
          <span>Admin token</span>
          <input
            v-model="tokenInput"
            type="password"
            autocomplete="off"
            placeholder="Optional: paste PIX_PAX_ADMIN_TOKEN"
          />
        </label>
        <div class="flex items-end">
          <Button class="!px-4 !py-2" :disabled="submitting" @click="submit">
            {{ submitting ? "Checking..." : "Use token" }}
          </Button>
        </div>
      </div>

      <p class="mt-3 text-xs text-[var(--ui-fg-muted)]">
        Next: <span class="font-mono">{{ redirectTo }}</span>
      </p>
      <p v-if="message" class="mt-2 text-xs text-red-600">{{ message }}</p>
    </section>
  </div>
</template>
