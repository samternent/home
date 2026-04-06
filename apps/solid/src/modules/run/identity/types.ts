import type { ComputedRef } from "vue";
import type { SerializedIdentity } from "@ternent/identity";

export type RunIdentityStatus = "missing" | "loading" | "ready" | "error";

export type RunIdentityProfile = {
  label: string;
  createdAt: string;
};

export type RunIdentityRecord = {
  id: string;
  identity: SerializedIdentity;
  profile: RunIdentityProfile;
};

export type RunIdentityBootstrapCandidate = {
  id: string;
  providerId: string;
  cacheId: string;
  label: string;
  createdAt: string;
  keyId: string | null;
  publicKey: string | null;
  valid: boolean;
  error: string | null;
};

export type RunIdentityCreateMnemonicResult = {
  record: RunIdentityRecord;
  mnemonic: string;
};

export type RunIdentityService = {
  status: ComputedRef<RunIdentityStatus>;
  error: ComputedRef<string | null>;
  identities: ComputedRef<RunIdentityRecord[]>;
  activeIdentityId: ComputedRef<string | null>;
  activeIdentity: ComputedRef<RunIdentityRecord | null>;
  bootstrapCandidates: ComputedRef<RunIdentityBootstrapCandidate[]>;
  init(): Promise<void>;
  createMnemonicIdentity(input?: {
    label?: string;
    words?: 12 | 24;
  }): Promise<RunIdentityCreateMnemonicResult>;
  importMnemonic(input: {
    mnemonic: string;
    label?: string;
    passphrase?: string;
  }): Promise<RunIdentityRecord>;
  importSerializedIdentity(input: {
    serializedIdentity: string;
    label?: string;
  }): Promise<RunIdentityRecord>;
  setActiveIdentity(identityId: string): Promise<RunIdentityRecord>;
  removeIdentity(identityId: string): Promise<void>;
  exportIdentity(identityId?: string): Promise<string>;
  syncIdentityToProvider(providerId: string, identityId?: string): Promise<void>;
  adoptBootstrapCandidate(candidateId: string): Promise<RunIdentityRecord>;
  refreshBootstrapCandidates(): Promise<void>;
};
