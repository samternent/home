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
const message = ref("");

const redirectTo = computed(() => {
  const raw = route.query.redirect;
  const value = typeof raw === "string" ? raw : "";
  if (value.startsWith("/pixpax/control/")) return value;
  return "/pixpax/control/admin";
});

async function submit() {
  submitting.value = true;
  message.value = "";
  const ok = await auth.login(tokenInput.value);
  submitting.value = false;

  if (!ok) {
    message.value = auth.error.value || "Token validation failed.";
    return;
  }
  await router.replace(redirectTo.value);
}

onMounted(async () => {
  const ok = await auth.validateToken();
  if (ok) {
    await router.replace(redirectTo.value);
  }
});
</script>

<template>
  <div class="mx-auto w-full max-w-2xl p-6">
    <section class="rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg)] p-6">
      <h1 class="text-xl font-semibold">PixPax Control Login</h1>
      <p class="mt-2 text-sm text-[var(--ui-fg-muted)]">
        Enter the admin token to unlock protected control routes.
      </p>

      <div class="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
        <label class="field">
          <span>Admin token</span>
          <input
            v-model="tokenInput"
            type="password"
            autocomplete="off"
            placeholder="Paste PIX_PAX_ADMIN_TOKEN"
          />
        </label>
        <div class="flex items-end">
          <Button class="!px-4 !py-2" :disabled="submitting" @click="submit">
            {{ submitting ? "Checking..." : "Login" }}
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
