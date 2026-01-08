import type { PermissionState } from "./state";
import type { Cap, Target } from "./schemas";

const IMPLIED_CAPS: Record<Cap, Cap[]> = {
  read: [],
  write: [],
  grant: ["read"],
  admin: ["grant", "write", "read"],
};

const ACTION_CAPS: Record<string, Cap> = {
  "perm:read": "read",
  "perm:write": "write",
  "perm:grant": "grant",
  "perm:admin": "admin",
};

function isRootAdmin(state: PermissionState, principalId: string): boolean {
  return state.rootAdmins.includes(principalId);
}

function collectGroupMemberships(
  state: PermissionState,
  principalId: string
): Set<string> {
  const groups = new Set<string>();
  for (const group of Object.values(state.groups)) {
    if (group.members.includes(principalId)) {
      groups.add(group.groupId);
    }
  }
  return groups;
}

function targetMatches(
  target: Target,
  principalId: string,
  groupIds: Set<string>
): boolean {
  if (target.type === "principal") {
    return target.id === principalId;
  }
  return groupIds.has(target.id);
}

function expandCaps(caps: Set<Cap>): Set<Cap> {
  const expanded = new Set<Cap>(caps);
  for (const cap of caps) {
    for (const implied of IMPLIED_CAPS[cap]) {
      expanded.add(implied);
    }
  }
  return expanded;
}

function isGrantExpired(expires: string | undefined, nowIso?: string): boolean {
  if (!expires || !nowIso) {
    return false;
  }
  const expiresAt = Date.parse(expires);
  const nowAt = Date.parse(nowIso);
  if (Number.isNaN(expiresAt) || Number.isNaN(nowAt)) {
    return false;
  }
  return expiresAt <= nowAt;
}

export function getEffectiveCaps(
  state: PermissionState,
  principalId: string,
  scope: string,
  nowIso?: string
): Set<Cap> {
  if (isRootAdmin(state, principalId)) {
    return new Set<Cap>(["admin", "grant", "write", "read"]);
  }

  const groupIds = collectGroupMemberships(state, principalId);
  const explicitCaps = new Set<Cap>();

  for (const grant of state.grants) {
    if (grant.scope !== scope) {
      continue;
    }
    if (!targetMatches(grant.target, principalId, groupIds)) {
      continue;
    }
    if (isGrantExpired(grant.constraints?.expires, nowIso)) {
      continue;
    }
    explicitCaps.add(grant.cap);
  }

  for (const revoke of state.revokes) {
    if (revoke.scope !== scope) {
      continue;
    }
    if (!targetMatches(revoke.target, principalId, groupIds)) {
      continue;
    }
    explicitCaps.delete(revoke.cap);
  }

  return expandCaps(explicitCaps);
}

export function can(
  state: PermissionState,
  principalId: string,
  action: string,
  scope: string,
  nowIso?: string
): boolean {
  const required = ACTION_CAPS[action];
  if (!required) {
    return false;
  }
  const caps = getEffectiveCaps(state, principalId, scope, nowIso);
  return caps.has(required);
}

export function isAuthorizedGroupChange(
  state: PermissionState,
  author: string,
  groupId: string
): boolean {
  if (isRootAdmin(state, author)) {
    return true;
  }
  const group = state.groups[groupId];
  if (!group) {
    return false;
  }
  return group.owner === author;
}
