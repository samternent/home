import type { SerializedIdentity } from "@ternent/identity";

export type SolidSessionLike = {
  info: {
    webId?: string | null;
    isLoggedIn?: boolean;
  };
  fetch: typeof fetch;
};

export type SolidAccessValidationMode = "off" | "warn" | "strict";

export type SolidProfileOptions = {
  enabled?: boolean;
  discover?: boolean;
  bootstrap?: boolean;
  accessValidation?: SolidAccessValidationMode;
  appPath?: string;
  podRoot?: string;
  preferencesUrl?: string;
  publicTypeIndexUrl?: string;
  privateTypeIndexUrl?: string;
  verificationUrl?: string;
};

export type CreateSolidConcordPathsOptions = {
  appPath?: string;
  podRoot?: string;
  preferencesUrl?: string;
  publicTypeIndexUrl?: string;
  privateTypeIndexUrl?: string;
  identityUrl?: string | null;
  verificationUrl?: string;
};

export type SolidConcordPaths = {
  webId: string;
  profileUrl: string;
  podRoot: string;
  settingsRootUrl: string;
  appRootUrl: string;
  systemRootUrl: string;
  systemPrivateRootUrl: string;
  workspaceRootUrl: string;
  workspacePrivateRootUrl: string;
  workspaceSharedRootUrl: string;
  workspacePublicRootUrl: string;
  privateRootUrl: string;
  publicRootUrl: string;
  preferencesUrl: string;
  publicTypeIndexUrl: string;
  privateTypeIndexUrl: string;
  identityUrl: string;
  mnemonicUrl: string;
  walletUrl: string;
  ledgerUrl: string;
  peopleUrl: string;
  verificationUrl: string;
};

export type SolidConcordResources = {
  webId: string;
  profileUrl: string;
  podRoot: string | null;
  settingsRootUrl: string | null;
  appRootUrl: string | null;
  systemRootUrl: string | null;
  systemPrivateRootUrl: string | null;
  workspaceRootUrl: string | null;
  workspacePrivateRootUrl: string | null;
  workspaceSharedRootUrl: string | null;
  workspacePublicRootUrl: string | null;
  privateRootUrl: string | null;
  publicRootUrl: string | null;
  preferencesUrl: string | null;
  publicTypeIndexUrl: string | null;
  privateTypeIndexUrl: string | null;
  identityUrl: string | null;
  mnemonicUrl: string | null;
  walletUrl: string | null;
  ledgerUrl: string | null;
  peopleUrl: string | null;
  verificationUrl: string | null;
  seeAlso: string[];
};

export type SolidConcordAccessCheck = {
  name: "identity" | "mnemonic" | "wallet" | "verification";
  url: string;
  expectedAccess: "private" | "public";
  anonymousRead: "yes" | "no" | "unknown";
  safe: boolean;
  issue: string | null;
};

export type SolidConcordAccessReport = {
  safe: boolean;
  issues: string[];
  checks: SolidConcordAccessCheck[];
};

export type BootstrapSolidConcordProfileOptions = CreateSolidConcordPathsOptions & {
  session: SolidSessionLike;
  identityUrl?: string | null;
  mnemonicUrl?: string | null;
  walletUrl?: string | null;
  ledgerUrl?: string | null;
  peopleUrl?: string | null;
  identity?: SerializedIdentity | null;
  createdAt?: string;
};

export type ConcordOsPerson = {
  webId: string;
  label: string | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  lastUsedAt: string | null;
};

export type ConcordOsPeopleRegistry = {
  format: "ternent-concord-os-people";
  version: "1";
  createdAt: string;
  updatedAt: string;
  people: ConcordOsPerson[];
};

export type CreateConcordOsPeopleStorageOptions = {
  contentType?: string;
};
