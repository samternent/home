<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useAppApi } from "@/app/api";
import { DEFAULT_DEV_SESSION_UNLOCK_STORAGE_KEY } from "@/app/runtime";
import type {
  IdentityOnboardingDraft,
  StoredIdentitySummary,
} from "@/app/runtime";
import {
  buildQrDataUri,
  createOtpAuthUri,
} from "@/app/runtime";
import {
  Button,
  Card,
  Checkbox,
  Dialog,
  Input,
  Textarea,
} from "ternent-ui/primitives";

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
const showUnlockMfaField = computed(
  () => Boolean(summary.value?.mfaEnabled),
);
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
  return Boolean(
    window.sessionStorage.getItem(DEFAULT_DEV_SESSION_UNLOCK_STORAGE_KEY),
  );
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
      totpSecretBase32: recoverMfaEnabled.value
        ? recoverTotpSecretBase32.value
        : undefined,
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
    title="Identity Required"
    description="Unlock an existing identity or create one locally to continue."
  >
    <div class="space-y-5" data-test="identity-global-dialog">
      <template v-if="hasStoredIdentity && summary && mode === 'unlock'">
        <Card padding="md" variant="subtle">
          <dl class="m-0 grid gap-2 text-sm">
            <div class="flex items-center justify-between gap-4">
              <dt class="text-[var(--ui-fg-muted)]">
                Identity
              </dt>
              <dd class="m-0 text-[var(--ui-fg)]">
                {{ summary.label }}
              </dd>
            </div>
            <div class="flex items-center justify-between gap-4">
              <dt class="text-[var(--ui-fg-muted)]">
                Created
              </dt>
              <dd class="m-0 text-[var(--ui-fg)]">
                {{ summary.createdAt }}
              </dd>
            </div>
            <div class="flex items-center justify-between gap-4">
              <dt class="text-[var(--ui-fg-muted)]">
                MFA
              </dt>
              <dd class="m-0 text-[var(--ui-fg)]">
                {{ summary.mfaEnabled ? "enabled" : "disabled" }}
              </dd>
            </div>
          </dl>
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
          >
          <label class="block space-y-2 text-sm text-[var(--ui-fg-muted)]">
            <span>Password</span>
            <Input
              v-model="unlockPassword"
              id="identity-unlock-password"
              name="password"
              type="password"
              autocomplete="current-password"
              placeholder="Enter identity password"
              data-test="identity-dialog-unlock-password"
            />
          </label>

          <label
            v-if="showUnlockMfaField"
            class="block space-y-2 text-sm text-[var(--ui-fg-muted)]"
          >
            <span>Authenticator code (if enabled)</span>
            <Input
              v-model="unlockTotpCode"
              id="identity-unlock-totp"
              name="otp"
              type="text"
              inputmode="numeric"
              maxlength="6"
              autocomplete="one-time-code"
              placeholder="123456"
              data-test="identity-dialog-unlock-totp"
            />
          </label>

          <div class="flex justify-end">
            <Button
              type="submit"
              variant="primary"
              :loading="submitting"
              data-test="identity-dialog-unlock-submit"
            >
              Unlock
            </Button>
          </div>
        </form>

        <div class="flex flex-wrap items-center gap-2">
          <Button variant="tertiary" @click="startRecoverMode">
            Recover From Mnemonic
          </Button>
          <Button variant="tertiary" @click="startCreateMode">
            Create New Identity
          </Button>
        </div>
      </template>

      <template v-else-if="mode === 'recover'">
        <form class="space-y-4" @submit.prevent="recoverIdentity">
          <label class="block space-y-2 text-sm text-[var(--ui-fg-muted)]">
            <span>Recovery mnemonic</span>
            <Textarea
              v-model="recoverMnemonic"
              name="recovery-mnemonic"
              rows="3"
              autocomplete="off"
              placeholder="Enter your 12 or 24 word recovery phrase"
              data-test="identity-dialog-recover-mnemonic"
            />
          </label>

          <input
            type="text"
            name="username"
            autocomplete="username"
            value="local-identity-recovery"
            readonly
            class="sr-only"
            tabindex="-1"
          >
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
                    Scan in your authenticator app
                  </p>
                  <img
                    :src="recoverTotpQrDataUri"
                    alt="Recovery authenticator QR code"
                    class="h-44 w-44 rounded-md border border-[var(--ui-border)] bg-white p-2"
                    data-test="identity-dialog-recover-totp-qr"
                  >
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
                    placeholder="123456"
                    data-test="identity-dialog-recover-totp-code"
                  />
                </label>
              </template>
            </div>
          </Card>

          <div class="flex items-center justify-between gap-2">
            <Button variant="tertiary" @click="startUnlockMode">
              Back To Unlock
            </Button>
            <Button
              type="submit"
              variant="primary"
              :loading="submitting"
              data-test="identity-dialog-recover-submit"
            >
              Recover Identity
            </Button>
          </div>
        </form>
      </template>

      <template v-else>
        <template v-if="creatingDraft || !draft">
          <Card padding="md" variant="subtle">
            <p class="m-0 text-sm text-[var(--ui-fg-muted)]">
              Preparing identity draft...
            </p>
          </Card>
        </template>
        <template v-else>
          <div v-if="step === 1" class="space-y-4">
            <p class="m-0 text-sm text-[var(--ui-fg-muted)]">
              Save this recovery phrase offline before continuing.
            </p>

            <Card padding="md" variant="subtle">
              <div class="grid grid-cols-2 gap-2 sm:grid-cols-3">
                <div
                  v-for="(word, index) in draft.mnemonic.split(' ')"
                  :key="`${index}-${word}`"
                  class="rounded-md border border-[var(--ui-border)] bg-[var(--ui-surface)] px-2 py-1"
                >
                  <p class="m-0 text-xs text-[var(--ui-fg-muted)]">
                    {{ index + 1 }}
                  </p>
                  <p class="m-0 text-sm text-[var(--ui-fg)]">
                    {{ word }}
                  </p>
                </div>
              </div>
            </Card>

            <div class="flex flex-wrap gap-2">
              <Button variant="secondary" @click="copyMnemonic">
                Copy phrase
              </Button>
              <Button
                variant="tertiary"
                :disabled="submitting"
                @click="regenerateDraft"
              >
                Regenerate
              </Button>
            </div>

            <Checkbox
              v-model="mnemonicConfirmed"
              data-test="identity-dialog-mnemonic-confirmed"
            >
              I have saved this phrase offline.
            </Checkbox>

            <div class="flex justify-end">
              <div class="flex gap-2">
                <Button variant="tertiary" @click="startRecoverMode">
                  Recover Instead
                </Button>
                <Button
                  variant="primary"
                  :disabled="!mnemonicConfirmed"
                  @click="step = 2"
                >
                  Continue
                </Button>
              </div>
            </div>
          </div>

          <form v-else class="space-y-4" @submit.prevent="createIdentity">
            <input
              type="text"
              name="username"
              autocomplete="username"
              value="local-identity-onboarding"
              readonly
              class="sr-only"
              tabindex="-1"
            >
            <label class="block space-y-2 text-sm text-[var(--ui-fg-muted)]">
              <span>Password</span>
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
              <span>Confirm password</span>
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

            <Card padding="md" variant="subtle">
              <div class="space-y-3">
                <Checkbox
                  v-model="mfaEnabled"
                  data-test="identity-dialog-mfa-enabled"
                >
                  Enable authenticator verification
                </Checkbox>

                <template v-if="mfaEnabled">
                  <div v-if="createTotpQrDataUri" class="space-y-2">
                    <p class="m-0 text-xs text-[var(--ui-fg-muted)]">
                      Scan in your authenticator app
                    </p>
                    <img
                      :src="createTotpQrDataUri"
                      alt="Authenticator QR code"
                      class="h-44 w-44 rounded-md border border-[var(--ui-border)] bg-white p-2"
                      data-test="identity-dialog-totp-qr"
                    >
                  </div>

                  <p class="m-0 text-xs text-[var(--ui-fg-muted)]">
                    Manual secret (fallback)
                  </p>
                  <code
                    class="block break-all text-xs text-[var(--ui-fg)]"
                    data-test="identity-dialog-totp-secret"
                  >{{ draft.mfa.totpSecretBase32 }}</code>

                  <label class="block space-y-2 text-sm text-[var(--ui-fg-muted)]">
                    <span>Verify authenticator code</span>
                    <Input
                      v-model="totpCode"
                      type="text"
                      name="otp"
                      inputmode="numeric"
                      maxlength="6"
                      autocomplete="one-time-code"
                      placeholder="123456"
                      data-test="identity-dialog-totp-code"
                    />
                  </label>
                </template>
              </div>
            </Card>

            <div class="flex items-center justify-between gap-2">
              <Button variant="tertiary" @click="step = 1">
                Back
              </Button>
              <div class="flex gap-2">
                <Button
                  v-if="hasStoredIdentity"
                  variant="tertiary"
                  @click="startUnlockMode"
                >
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
