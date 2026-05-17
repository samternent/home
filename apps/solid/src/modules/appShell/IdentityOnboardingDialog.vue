<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useAppApi } from "@/app/api";
import { shortIdentityKey, toDidKeyFromPublicKey } from "@/app/plugins/identityKey";
import { DEFAULT_DEV_SESSION_UNLOCK_STORAGE_KEY } from "@/app/runtime";
import type { IdentityOnboardingDraft, StoredIdentitySummary } from "@/app/runtime";
import { buildQrDataUri, createOtpAuthUri } from "@/app/runtime";
import { Badge, Button, Card, Checkbox, Dialog, Input, Textarea } from "ternent-ui/primitives";
import { IdentityHandle } from "ternent-ui/patterns";

const appApi = useAppApi();
const isBrowser = typeof window !== "undefined";

const dialogOpen = ref(false);
const summary = ref<StoredIdentitySummary | null>(null);
const draft = ref<IdentityOnboardingDraft | null>(null);
const creatingDraft = ref(false);
const submitting = ref(false);
const error = ref<string | null>(null);
const mode = ref<"unlock" | "create" | "recover">("unlock");

const step = ref<1 | 2>(1);
const mnemonicConfirmed = ref(false);
const password = ref("");
const confirmPassword = ref("");
const mfaEnabled = ref(true);
const totpCode = ref("");

const unlockPassword = ref("");
const unlockTotpCode = ref("");
const recoverMnemonic = ref("");
const recoverPassword = ref("");
const recoverConfirmPassword = ref("");
const recoverMfaEnabled = ref(false);
const recoverTotpSecretBase32 = ref("");
const recoverTotpCode = ref("");

const isUnlocked = computed(
  () => appApi.status.value === "ready" && appApi.identity.activeIdentity.value !== null,
);
const hasStoredIdentity = computed(() => summary.value !== null);
const showUnlockMfaField = computed(() => Boolean(summary.value?.mfaEnabled));
const unlockIdentityKey = computed(() => {
  if (!summary.value) {
    return "invalid-identity";
  }

  try {
    return toDidKeyFromPublicKey(summary.value.publicKey);
  } catch {
    return summary.value.publicKey;
  }
});
const unlockIdentityText = computed(() =>
  summary.value ? shortIdentityKey(unlockIdentityKey.value) : "",
);
const draftWords = computed(() => draft.value?.mnemonic.split(" ") ?? []);
const createTotpSecretDisplay = computed(() => {
  if (!draft.value) {
    return "";
  }
  const raw = draft.value.mfa.totpSecretBase32.replace(/\s+/g, "").toUpperCase();
  const groups = raw.match(/.{1,4}/g);
  return groups ? groups.join(" - ") : raw;
});
const createTotpQrDataUri = computed<string | null>(() => {
  if (!mfaEnabled.value || !draft.value) {
    return null;
  }
  try {
    return buildQrDataUri({
      value: draft.value.mfa.totpAuthUri,
      errorCorrection: "M",
      quietZoneModules: 4,
      pixelSize: 6,
    });
  } catch {
    return null;
  }
});
const recoverTotpQrDataUri = computed<string | null>(() => {
  if (!recoverMfaEnabled.value) {
    return null;
  }
  const secret = String(recoverTotpSecretBase32.value || "").trim();
  if (!secret) {
    return null;
  }
  try {
    const uri = createOtpAuthUri({
      secretBase32: secret,
      policy: {
        issuer: "Concord",
        accountName: "Recovered Identity@local",
        digits: 6,
        period: 30,
      },
    });
    return buildQrDataUri({
      value: uri,
      errorCorrection: "M",
      quietZoneModules: 4,
      pixelSize: 6,
    });
  } catch {
    return null;
  }
});

const canCreate = computed(() => {
  if (!draft.value) {
    return false;
  }
  if (!mnemonicConfirmed.value) {
    return false;
  }
  if (!password.value || !confirmPassword.value) {
    return false;
  }
  if (mfaEnabled.value && !totpCode.value) {
    return false;
  }
  return true;
});

function formatWordIndex(index: number): string {
  return String(index + 1).padStart(2, "0");
}

function refreshSummary(): void {
  summary.value = appApi.identity.getStoredIdentitySummary();
}

function hasPendingDevSessionResume(): boolean {
  if (!isBrowser || !import.meta.env.DEV) {
    return false;
  }
  if (appApi.status.value !== "restoring") {
    return false;
  }
  return Boolean(window.sessionStorage.getItem(DEFAULT_DEV_SESSION_UNLOCK_STORAGE_KEY));
}

function resetCreateFields(): void {
  step.value = 1;
  mnemonicConfirmed.value = false;
  password.value = "";
  confirmPassword.value = "";
  mfaEnabled.value = true;
  totpCode.value = "";
}

function resetRecoveryFields(): void {
  recoverMnemonic.value = "";
  recoverPassword.value = "";
  recoverConfirmPassword.value = "";
  recoverMfaEnabled.value = false;
  recoverTotpSecretBase32.value = "";
  recoverTotpCode.value = "";
}

async function ensureDraft(force = false): Promise<void> {
  if (!force && draft.value) {
    return;
  }

  creatingDraft.value = true;
  error.value = null;

  try {
    draft.value = await appApi.identity.createOnboardingDraft();
    resetCreateFields();
  } catch (nextError) {
    error.value = nextError instanceof Error ? nextError.message : String(nextError);
  } finally {
    creatingDraft.value = false;
  }
}

async function regenerateDraft(): Promise<void> {
  await ensureDraft(true);
}

async function copyMnemonic(): Promise<void> {
  if (!draft.value) {
    return;
  }
  if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
    return;
  }

  try {
    await navigator.clipboard.writeText(draft.value.mnemonic);
  } catch {
    // Keep copy failure non-fatal.
  }
}

async function copyCreateTotpSecret(): Promise<void> {
  if (!draft.value) {
    return;
  }
  if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
    return;
  }

  try {
    await navigator.clipboard.writeText(draft.value.mfa.totpSecretBase32);
  } catch {
    // Keep copy failure non-fatal.
  }
}

async function unlockIdentity(): Promise<void> {
  if (submitting.value) {
    return;
  }

  submitting.value = true;
  error.value = null;

  try {
    await appApi.identity.unlockWithPassword({
      password: unlockPassword.value,
      totpCode: unlockTotpCode.value || undefined,
    });
    unlockPassword.value = "";
    unlockTotpCode.value = "";
    refreshSummary();
  } catch (nextError) {
    error.value = nextError instanceof Error ? nextError.message : String(nextError);
  } finally {
    submitting.value = false;
  }
}

async function createIdentity(): Promise<void> {
  if (!draft.value || submitting.value) {
    return;
  }

  submitting.value = true;
  error.value = null;

  try {
    await appApi.identity.completeOnboarding({
      draft: draft.value,
      password: password.value,
      confirmPassword: confirmPassword.value,
      mnemonicConfirmed: mnemonicConfirmed.value,
      mfaEnabled: mfaEnabled.value,
      totpCode: mfaEnabled.value ? totpCode.value : undefined,
    });
    refreshSummary();
  } catch (nextError) {
    error.value = nextError instanceof Error ? nextError.message : String(nextError);
  } finally {
    submitting.value = false;
  }
}

async function recoverIdentity(): Promise<void> {
  if (submitting.value) {
    return;
  }

  submitting.value = true;
  error.value = null;

  try {
    await appApi.identity.recoverFromMnemonic({
      mnemonic: recoverMnemonic.value,
      password: recoverPassword.value,
      confirmPassword: recoverConfirmPassword.value,
      mfaEnabled: recoverMfaEnabled.value,
      totpSecretBase32: recoverMfaEnabled.value ? recoverTotpSecretBase32.value : undefined,
      totpCode: recoverMfaEnabled.value ? recoverTotpCode.value : undefined,
    });
    refreshSummary();
  } catch (nextError) {
    error.value = nextError instanceof Error ? nextError.message : String(nextError);
  } finally {
    submitting.value = false;
  }
}

async function startCreateMode(): Promise<void> {
  mode.value = "create";
  error.value = null;
  await ensureDraft();
}

function startRecoverMode(): void {
  mode.value = "recover";
  error.value = null;
  resetRecoveryFields();
}

function startUnlockMode(): void {
  mode.value = "unlock";
  error.value = null;
}

watch(
  isUnlocked,
  async (nextUnlocked) => {
    dialogOpen.value = !nextUnlocked && !hasPendingDevSessionResume();

    if (!nextUnlocked) {
      refreshSummary();
      error.value = null;
      mode.value = summary.value ? "unlock" : "create";
      if (isBrowser && !summary.value) {
        await ensureDraft();
      }
    }
  },
  { immediate: true },
);

onMounted(async () => {
  refreshSummary();
  mode.value = summary.value ? "unlock" : "create";
  dialogOpen.value = !isUnlocked.value && !hasPendingDevSessionResume();
  if (!summary.value && !isUnlocked.value) {
    await ensureDraft();
  }
});
</script>

<template>
  <Dialog
    v-model:open="dialogOpen"
    :show-close="false"
    :close-on-escape="false"
    :close-on-interact-outside="false"
    size="lg"
  >
    <div class="w-full space-y-8" data-test="identity-global-dialog">
      <template v-if="hasStoredIdentity && summary && mode === 'unlock'">
        <section class="mx-auto w-full max-w-lg space-y-6">
          <div class="space-y-2 text-center">
            <h2 class="m-0 text-4xl font-semibold text-[var(--ui-fg)]">Identity Required</h2>
            <p class="m-0 text-base text-[var(--ui-fg-muted)]">
              Please authenticate to access your vault.
            </p>
          </div>

          <Card padding="sm" variant="showcase">
            <IdentityHandle
              :identity="unlockIdentityKey"
              :identity-text="unlockIdentityText"
              :label="summary.label"
              size="md"
              data-test="identity-dialog-unlock-handle"
            />
          </Card>

          <form class="space-y-4" @submit.prevent="unlockIdentity">
            <input
              type="text"
              name="username"
              autocomplete="username"
              :value="summary.label"
              readonly
              class="sr-only"
              tabindex="-1"
            />
            <label class="block space-y-2 text-sm text-[var(--ui-fg-muted)]">
              <span>Master password</span>
              <Input
                v-model="unlockPassword"
                id="identity-unlock-password"
                name="password"
                type="password"
                autocomplete="current-password"
                placeholder="Enter your password"
                data-test="identity-dialog-unlock-password"
              />
            </label>

            <label
              v-if="showUnlockMfaField"
              class="block space-y-2 text-sm text-[var(--ui-fg-muted)]"
            >
              <span>Authenticator code (2FA)</span>
              <Input
                v-model="unlockTotpCode"
                id="identity-unlock-totp"
                name="otp"
                type="text"
                inputmode="numeric"
                maxlength="6"
                autocomplete="one-time-code"
                placeholder="000 000"
                data-test="identity-dialog-unlock-totp"
              />
            </label>

            <Button
              type="submit"
              variant="primary"
              class="w-full"
              :loading="submitting"
              data-test="identity-dialog-unlock-submit"
            >
              Unlock Identity
            </Button>
          </form>

          <div class="flex items-center gap-3 py-1">
            <span class="h-px flex-1 bg-[var(--ui-border)]"></span>
            <span class="text-xs uppercase tracking-[0.14em] text-[var(--ui-fg-muted)]">Or</span>
            <span class="h-px flex-1 bg-[var(--ui-border)]"></span>
          </div>

          <Button variant="tertiary" class="w-full" @click="startRecoverMode">
            Recover From Mnemonic
          </Button>

          <div class="flex justify-center">
            <Button variant="plain-secondary" size="sm" @click="startCreateMode">
              Create New Identity
            </Button>
          </div>
        </section>
      </template>

      <template v-else-if="mode === 'recover'">
        <section class="mx-auto w-full max-w-2xl">
          <form @submit.prevent="recoverIdentity">
            <input
              type="text"
              name="username"
              autocomplete="username"
              value="local-identity-recovery"
              readonly
              class="sr-only"
              tabindex="-1"
            />

            <div class="space-y-2">
              <h2 class="m-0 text-3xl font-semibold text-[var(--ui-fg)]">Identity Recovery</h2>
              <p class="m-0 text-base text-[var(--ui-fg-muted)]">
                Restore access using your recovery mnemonic and a new password.
              </p>
            </div>

            <div class="mt-5 space-y-4 border-t border-[var(--ui-border)] pt-5">
              <label class="block space-y-2 text-sm text-[var(--ui-fg-muted)]">
                <div class="flex items-center justify-between">
                  <span>Recovery mnemonic</span>
                  <span class="text-xs">24 words</span>
                </div>
                <Textarea
                  v-model="recoverMnemonic"
                  name="recovery-mnemonic"
                  :rows="4"
                  autocomplete="off"
                  placeholder="Enter your words separated by spaces..."
                  data-test="identity-dialog-recover-mnemonic"
                />
              </label>

              <div class="grid gap-3 sm:grid-cols-2">
                <label class="block space-y-2 text-sm text-[var(--ui-fg-muted)]">
                  <span>New password</span>
                  <Input
                    v-model="recoverPassword"
                    id="identity-recover-password"
                    name="new-password"
                    type="password"
                    autocomplete="new-password"
                    placeholder="At least 8 characters"
                    data-test="identity-dialog-recover-password"
                  />
                </label>

                <label class="block space-y-2 text-sm text-[var(--ui-fg-muted)]">
                  <span>Confirm password</span>
                  <Input
                    v-model="recoverConfirmPassword"
                    id="identity-recover-password-confirm"
                    name="new-password-confirm"
                    type="password"
                    autocomplete="new-password"
                    placeholder="Re-enter password"
                    data-test="identity-dialog-recover-password-confirm"
                  />
                </label>
              </div>

              <Card padding="md" variant="subtle">
                <div class="space-y-3">
                  <Checkbox
                    v-model="recoverMfaEnabled"
                    data-test="identity-dialog-recover-mfa-enabled"
                  >
                    Enable authenticator verification
                  </Checkbox>

                  <template v-if="recoverMfaEnabled">
                    <label class="block space-y-2 text-sm text-[var(--ui-fg-muted)]">
                      <span>Authenticator secret (Base32)</span>
                      <Input
                        v-model="recoverTotpSecretBase32"
                        name="recover-totp-secret"
                        autocomplete="off"
                        placeholder="JBSWY3DPEHPK3PXP"
                        data-test="identity-dialog-recover-totp-secret"
                      />
                    </label>

                    <div v-if="recoverTotpQrDataUri" class="space-y-2">
                      <p class="m-0 text-xs text-[var(--ui-fg-muted)]">
                        Scan this in your authenticator app.
                      </p>
                      <img
                        :src="recoverTotpQrDataUri"
                        alt="Recovery authenticator QR code"
                        class="h-40 w-40 rounded-md border border-[var(--ui-border)] bg-white p-2"
                        data-test="identity-dialog-recover-totp-qr"
                      />
                    </div>

                    <label class="block space-y-2 text-sm text-[var(--ui-fg-muted)]">
                      <span>Verify authenticator code</span>
                      <Input
                        v-model="recoverTotpCode"
                        type="text"
                        name="otp"
                        inputmode="numeric"
                        maxlength="6"
                        autocomplete="one-time-code"
                        placeholder="000 000"
                        data-test="identity-dialog-recover-totp-code"
                      />
                    </label>
                  </template>
                </div>
              </Card>

              <div
                class="flex items-center justify-between gap-2 border-t border-[var(--ui-border)] pt-4"
              >
                <Button variant="tertiary" @click="startUnlockMode"> Back To Unlock </Button>
                <Button
                  type="submit"
                  variant="primary"
                  :loading="submitting"
                  data-test="identity-dialog-recover-submit"
                >
                  Recover Identity
                </Button>
              </div>
            </div>
          </form>
        </section>
      </template>

      <template v-else>
        <template v-if="creatingDraft || !draft">
          <Card padding="md" variant="subtle" class="mx-auto w-full max-w-xl">
            <p class="m-0 text-sm text-[var(--ui-fg-muted)]">Preparing identity draft...</p>
          </Card>
        </template>
        <template v-else>
          <div v-if="step === 1" class="mx-auto w-full max-w-2xl space-y-5">
            <div class="space-y-2 text-center">
              <h2 class="m-0 text-4xl font-semibold text-[var(--ui-fg)]">Secure Your Identity</h2>
              <p class="m-0 text-base text-[var(--ui-fg-muted)]">
                Save your recovery phrase offline before continuing.
              </p>
            </div>

            <div class="space-y-5 border-t border-[var(--ui-border)] pt-5">
              <div
                class="rounded-md border border-[var(--ui-critical)]/20 bg-[var(--ui-critical)]/10 p-3"
              >
                <p class="m-0 text-sm font-medium text-[var(--ui-critical)]">
                  Anyone with this phrase can recover your identity.
                </p>
              </div>

              <div class="grid grid-cols-2 gap-2 sm:grid-cols-3">
                <div
                  v-for="(word, index) in draftWords"
                  :key="`${index}-${word}`"
                  class="rounded-md border border-[var(--ui-border)] bg-[var(--ui-surface)] px-3 py-2"
                >
                  <p class="m-0 text-xs text-[var(--ui-fg-muted)]">
                    {{ formatWordIndex(index) }}
                  </p>
                  <p class="m-0 text-sm font-semibold text-[var(--ui-fg)]">
                    {{ word }}
                  </p>
                </div>
              </div>

              <div class="flex flex-wrap gap-2">
                <Button variant="secondary" @click="copyMnemonic"> Copy phrase </Button>
                <Button variant="tertiary" :disabled="submitting" @click="regenerateDraft">
                  Regenerate
                </Button>
              </div>

              <Checkbox v-model="mnemonicConfirmed" data-test="identity-dialog-mnemonic-confirmed">
                I have saved this phrase offline.
              </Checkbox>
            </div>

            <div class="flex flex-wrap items-center justify-end gap-2">
              <Button variant="tertiary" @click="startRecoverMode"> Recover Instead </Button>
              <Button variant="primary" :disabled="!mnemonicConfirmed" @click="step = 2">
                Continue
              </Button>
            </div>
          </div>

          <form v-else class="mx-auto w-full max-w-2xl" @submit.prevent="createIdentity">
            <input
              type="text"
              name="username"
              autocomplete="username"
              value="local-identity-onboarding"
              readonly
              class="sr-only"
              tabindex="-1"
            />
            <div class="space-y-2">
              <div class="flex items-start gap-3">
                <div
                  class="mt-0.5 inline-flex size-8 items-center justify-center rounded-full bg-[var(--ui-primary-muted)] text-[var(--ui-primary)]"
                  aria-hidden="true"
                >
                  <svg viewBox="0 0 24 24" class="size-4 fill-current">
                    <path
                      d="M12 2 4 5v6c0 5.25 3.45 9.48 8 10.83 4.55-1.35 8-5.58 8-10.83V5l-8-3Zm0 2.2 6 2.25V11c0 4.17-2.58 7.79-6 9-3.42-1.21-6-4.83-6-9V6.45l6-2.25Zm0 2.55a3 3 0 0 0-3 3V11H8v6h8v-6h-1V9.75a3 3 0 0 0-3-3Zm-1 3a1 1 0 0 1 2 0V11h-2V9.75Z"
                    />
                  </svg>
                </div>
                <div class="space-y-1">
                  <h2 class="m-0 text-4xl font-semibold text-[var(--ui-fg)]">Identity Required</h2>
                  <p class="m-0 text-base text-[var(--ui-fg-muted)]">
                    Set up your secure credentials and multi-factor authentication.
                  </p>
                </div>
              </div>
            </div>

            <div class="mt-5 grid gap-3 border-t border-[var(--ui-border)] pt-5 sm:grid-cols-2">
              <label class="block space-y-2 text-sm text-[var(--ui-fg-muted)]">
                <span>Choose Password</span>
                <Input
                  v-model="password"
                  id="identity-create-password"
                  name="new-password"
                  type="password"
                  autocomplete="new-password"
                  placeholder="At least 8 characters"
                  data-test="identity-dialog-password"
                />
              </label>

              <label class="block space-y-2 text-sm text-[var(--ui-fg-muted)]">
                <span>Confirm Password</span>
                <Input
                  v-model="confirmPassword"
                  id="identity-create-password-confirm"
                  name="new-password-confirm"
                  type="password"
                  autocomplete="new-password"
                  placeholder="Re-enter password"
                  data-test="identity-dialog-password-confirm"
                />
              </label>
            </div>

            <div class="mt-5 space-y-4 border-t border-[var(--ui-border)] pt-5">
              <div class="flex items-start justify-between gap-3">
                <Checkbox v-model="mfaEnabled" data-test="identity-dialog-mfa-enabled">
                  Require authenticator app verification
                </Checkbox>
                <Badge tone="neutral" variant="soft" size="xs"> Recommended </Badge>
              </div>

              <template v-if="mfaEnabled">
                <Card padding="md" variant="showcase">
                  <div class="flex flex-col gap-4">
                    <img
                      v-if="createTotpQrDataUri"
                      :src="createTotpQrDataUri"
                      alt="Authenticator QR code"
                      class="w-full max-w-64 h-auto mx-auto p-4"
                      data-test="identity-dialog-totp-qr"
                    />

                    <p class="m-0 text-sm text-[var(--ui-fg-muted)]">
                      Scan this QR code with your authenticator app.
                    </p>
                    <div class="space-y-2">
                      <p
                        class="m-0 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--ui-fg-muted)]"
                      >
                        Manual secret key
                      </p>
                      <div class="flex items-center gap-2">
                        <code
                          class="block flex-1 rounded-md border border-[var(--ui-border)] bg-[var(--ui-surface)] px-2 py-2 text-xs font-semibold text-[var(--ui-fg)]"
                          data-test="identity-dialog-totp-secret"
                          >{{ createTotpSecretDisplay }}</code
                        >
                        <Button
                          type="button"
                          variant="plain-secondary"
                          size="xs"
                          @click="copyCreateTotpSecret"
                        >
                          Copy
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>

                <div class="space-y-2">
                  <label class="block space-y-2 text-sm text-[var(--ui-fg-muted)]">
                    <span>Verify authenticator code</span>
                    <div class="flex items-center gap-2">
                      <Input
                        v-model="totpCode"
                        type="text"
                        name="otp"
                        inputmode="numeric"
                        maxlength="6"
                        autocomplete="one-time-code"
                        placeholder="000 000"
                        data-test="identity-dialog-totp-code"
                      />
                      <div
                        class="inline-flex h-10 w-10 items-center justify-center rounded-[var(--ui-radius-md)] border border-[var(--ui-primary-muted)] bg-[var(--ui-primary-muted)] text-[var(--ui-primary)]"
                        aria-hidden="true"
                      >
                        <svg viewBox="0 0 24 24" class="size-5 fill-current">
                          <path d="m9.2 16.1-3.3-3.3L4.5 14.2 9.2 19l10.3-10.3-1.4-1.4-8.9 8.8Z" />
                        </svg>
                      </div>
                    </div>
                  </label>
                  <p class="m-0 text-xs text-[var(--ui-fg-muted)]">
                    Enter the 6-digit code from your app to verify setup.
                  </p>
                </div>
              </template>
            </div>

            <div
              class="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--ui-border)] pt-4"
            >
              <Button variant="tertiary" @click="step = 1"> Back </Button>
              <div class="flex gap-2">
                <Button v-if="hasStoredIdentity" variant="tertiary" @click="startUnlockMode">
                  Back To Unlock
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  :loading="submitting"
                  :disabled="!canCreate"
                  data-test="identity-dialog-create-submit"
                >
                  Create identity
                </Button>
              </div>
            </div>
          </form>
        </template>
      </template>

      <p
        v-if="error"
        class="m-0 text-sm text-[var(--ui-critical)]"
        data-test="identity-dialog-error"
      >
        {{ error }}
      </p>
    </div>
  </Dialog>
</template>
