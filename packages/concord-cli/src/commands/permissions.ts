import {
  can,
  getEffectiveCaps,
  replayPermissions,
  type PermissionState,
} from "@ternent/concord-plugin-permissions";
import type { LedgerContainer, Entry } from "@ternent/concord-protocol";

export type PermissionTarget = { type: "principal" | "group"; id: string };

export type PermissionGrantParams = {
  author: string;
  scope: string;
  cap: "read" | "write" | "grant" | "admin";
  target: PermissionTarget;
  expires?: string;
};

export type PermissionRevokeParams = {
  author: string;
  scope: string;
  cap: "read" | "write" | "grant" | "admin";
  target: PermissionTarget;
  reason?: string;
};

export function replayPermissionState(
  ledger: LedgerContainer,
  rootAdmins?: string[]
): PermissionState {
  return replayPermissions(ledger, undefined, { rootAdmins });
}

export function canPerform(
  state: PermissionState,
  principalId: string,
  action: string,
  scope: string
): boolean {
  return can(state, principalId, action, scope);
}

export function createGrantEntry(
  params: PermissionGrantParams,
  timestamp: string
): Entry {
  return {
    kind: "perm.grant",
    timestamp,
    author: params.author,
    payload: {
      scope: params.scope,
      cap: params.cap,
      target: params.target,
      constraints: params.expires ? { expires: params.expires } : undefined,
    },
    signature: null,
  };
}

export function createRevokeEntry(
  params: PermissionRevokeParams,
  timestamp: string
): Entry {
  return {
    kind: "perm.revoke",
    timestamp,
    author: params.author,
    payload: {
      scope: params.scope,
      cap: params.cap,
      target: params.target,
      reason: params.reason,
    },
    signature: null,
  };
}

export function getCaps(
  state: PermissionState,
  principalId: string,
  scope: string
): string[] {
  return Array.from(getEffectiveCaps(state, principalId, scope));
}
