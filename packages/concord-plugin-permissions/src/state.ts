import type { Cap, Target } from "./schemas";

export type GroupRecord = {
  groupId: string;
  displayName?: string;
  owner: string;
  members: string[];
};

export type GrantRecord = {
  scope: string;
  cap: Cap;
  target: Target;
  constraints?: {
    expires?: string;
    note?: string;
  };
  grantedBy: string;
  grantedAt: string;
  order: number;
};

export type RevokeRecord = {
  scope: string;
  cap: Cap;
  target: Target;
  reason?: string;
  revokedBy: string;
  revokedAt: string;
  order: number;
};

export type PermissionState = {
  rootAdmins: string[];
  groups: Record<string, GroupRecord>;
  grants: GrantRecord[];
  revokes: RevokeRecord[];
};

export type ReplayConfig = {
  rootAdmins?: string[];
};

export function createEmptyState(config?: ReplayConfig): PermissionState {
  return {
    rootAdmins: config?.rootAdmins ?? [],
    groups: {},
    grants: [],
    revokes: [],
  };
}
