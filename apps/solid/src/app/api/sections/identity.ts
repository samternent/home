import { readonly, type Ref } from "vue";
import type { AppApi, AppIdentity, AppStatus } from "@/app/api/types";
import type {
  IdentityBootstrapMode,
  IdentityOnboardingDraft,
  IdentityService,
  StoredIdentitySummary,
} from "@/app/runtime";

export type IdentityApiContext = {
  status: Ref<AppStatus>;
  activeIdentity: Ref<AppIdentity | null>;
  ensureRuntime: () => Promise<unknown>;
  bootstrap: (mode?: IdentityBootstrapMode) => Promise<void>;
  teardownRuntime: () => Promise<void>;
  ensureIdentityService: () => IdentityService;
};

export function createIdentityApi(context: IdentityApiContext): AppApi["identity"] {
  return {
    status: readonly(context.status),
    activeIdentity: readonly(context.activeIdentity),
    getActiveIdentity() {
      return context.activeIdentity.value;
    },
    async ensureActiveIdentity() {
      await context.ensureRuntime();
      const current = context.activeIdentity.value;
      if (!current) {
        throw new Error("Active identity is unavailable.");
      }
      return current;
    },
    async ensureUnlocked(mode) {
      if (context.activeIdentity.value && context.status.value === "ready") {
        return context.activeIdentity.value;
      }
      await context.bootstrap(mode);
      const current = context.activeIdentity.value;
      if (!current) {
        throw new Error("Active identity is unavailable.");
      }
      return current;
    },
    async lock() {
      await context.ensureIdentityService().lock();
      await context.teardownRuntime();
    },
    async createOnboardingDraft(input?: {
      words?: 12 | 24;
      totpIssuer?: string;
      totpAccountName?: string;
    }): Promise<IdentityOnboardingDraft> {
      return await context.ensureIdentityService().createOnboardingDraft(input);
    },
    async completeOnboarding(input: {
      draft: IdentityOnboardingDraft;
      password: string;
      confirmPassword: string;
      mnemonicConfirmed: boolean;
      mfaEnabled: boolean;
      totpCode?: string;
    }): Promise<AppIdentity> {
      await context.ensureIdentityService().completeOnboarding(input);
      await context.teardownRuntime();
      await context.bootstrap("auto");
      const current = context.activeIdentity.value;
      if (!current) {
        throw new Error("Active identity is unavailable after onboarding.");
      }
      return current;
    },
    async recoverFromMnemonic(input: {
      mnemonic: string;
      password: string;
      confirmPassword: string;
      mfaEnabled: boolean;
      totpSecretBase32?: string;
      totpCode?: string;
      totpIssuer?: string;
      totpAccountName?: string;
      createdAt?: string;
    }): Promise<AppIdentity> {
      await context.ensureIdentityService().recoverFromMnemonic(input);
      await context.teardownRuntime();
      await context.bootstrap("auto");
      const current = context.activeIdentity.value;
      if (!current) {
        throw new Error("Active identity is unavailable after recovery.");
      }
      return current;
    },
    async unlockWithPassword(input: { password: string; totpCode?: string }): Promise<AppIdentity> {
      await context.ensureIdentityService().unlockWithPassword(input);
      await context.teardownRuntime();
      await context.bootstrap("unlock-only");
      const current = context.activeIdentity.value;
      if (!current) {
        throw new Error("Active identity is unavailable after unlock.");
      }
      return current;
    },
    getStoredIdentitySummary(): StoredIdentitySummary | null {
      return context.ensureIdentityService().getStoredIdentitySummary();
    },
  };
}
