export type TaskAudienceType = "everyone" | "user" | "permission";

export type TaskAudienceSelector = {
  audienceType: TaskAudienceType;
  audienceId: string | null;
};

export type TaskEncryptedAudiencePayload = {
  audienceType: TaskAudienceType;
  audienceId: string | null;
  keyRef: string | null;
  cipher: string | null;
  keyMissing: boolean;
};

export function createEveryoneAudience(): TaskAudienceSelector {
  return {
    audienceType: "everyone",
    audienceId: null,
  };
}

export function createPermissionAudience(permissionId: string): TaskAudienceSelector {
  return {
    audienceType: "permission",
    audienceId: permissionId,
  };
}

export function createUserAudience(identityKey: string): TaskAudienceSelector {
  return {
    audienceType: "user",
    audienceId: identityKey,
  };
}

export function toAudiencePayload(input: {
  selector: TaskAudienceSelector;
  cipher?: string | null;
  keyRef?: string | null;
  keyMissing?: boolean;
}): TaskEncryptedAudiencePayload {
  return {
    audienceType: input.selector.audienceType,
    audienceId: input.selector.audienceId,
    keyRef: input.keyRef ?? input.selector.audienceId ?? null,
    cipher: input.cipher ?? null,
    keyMissing: Boolean(input.keyMissing),
  };
}

export function markAudienceLocked(
  payload: TaskEncryptedAudiencePayload,
): TaskEncryptedAudiencePayload {
  return {
    ...payload,
    keyMissing: true,
  };
}

export function isAudienceLocked(payload: { keyMissing?: boolean }): boolean {
  return Boolean(payload.keyMissing);
}
