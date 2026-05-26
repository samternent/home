export type RuntimeAudience =
  | { type: "public" }
  | { type: "private"; identityKey: string }
  | { type: "privacy-group"; groupId: string };

export type RuntimeProtection = {
  kind: "none" | "identity" | "privacy-group";
  recipientKeys?: string[];
  groupId?: string;
};

export type RuntimePrivacyServiceContract = {
  resolveProtection(audience: RuntimeAudience): Promise<RuntimeProtection>;
  canReadAudience(audience: RuntimeAudience, viewerIdentityKey: string): boolean;
  canWriteAudience(audience: RuntimeAudience, actorIdentityKey: string): boolean;
  listReadableAudiences(): RuntimeAudience[];
  getReplayDecryptionKeys(): string[];
};
