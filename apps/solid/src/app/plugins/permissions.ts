import type { ConcordReplayPlugin } from "@ternent/concord";
import type { LedgerAppendInput, LedgerReplayEntry } from "@ternent/ledger";
import { deriveAgeRecipient, deriveAgeSecretKey } from "@ternent/identity";
import type { AppProjectionPlugin } from "@/app/runtime";
import {
  isIdentityKeyFormat,
  identityKeyToPublicKeyBytes,
  toDidKeyFromPublicKey,
  toLegacyAuthorDidFromIdentityKey,
  validateIdentityKey,
} from "./identityKey";

export type PermissionMember = {
  memberId: string;
  memberLabel: string | null;
};

export type PermissionGrantRecord = {
  grantId: string;
  permissionId: string;
  issuerIdentityKey: string;
  recipientIdentityKey: string;
  recipientLabel: string | null;
  issuerGrantId: string | null;
  issuedAt: string;
  isRoot: boolean;
};

export type PermissionRecord = {
  id: string;
  title: string;
  scope: string | null;
  members: PermissionMember[];
  createdBy: string;
  publicKey: string;
  createdAt: string;
  updatedAt: string;
  grantCount: number;
  viewerHasKey: boolean;
  viewerGrantId: string | null;
};

export type PermissionsState = {
  byId: Record<string, PermissionRecord>;
  order: string[];
  grantsById: Record<string, PermissionGrantRecord>;
  grantsByPermissionId: Record<string, string[]>;
  latestGrantIdByPermissionAndIdentity: Record<string, Record<string, string>>;
  localGroupPrivateKeysByPermissionId: Record<string, string>;
};

export type PermissionActorInput = {
  memberId: string;
  memberLabel?: string | null;
};

export type PermissionCreateInput = {
  title: string;
  scope?: string | null;
  actor: PermissionActorInput;
};

export type PermissionGrantInput = {
  permissionId: string;
  memberId: string;
  memberLabel?: string | null;
  actor: PermissionActorInput;
};

export type PermissionIssueGrantInput = PermissionGrantInput;

export type PermissionRevokeInput = {
  permissionId: string;
  memberId: string;
  actor: PermissionActorInput;
};

type PermissionCreatePayload = {
  permissionId: string;
  title: string;
  scope: string | null;
  actor: PermissionMember;
  createdBy: string;
  publicKey: string;
  createdAt: string;
  updatedAt: string;
};

type PermissionGrantPayload = {
  grantId: string;
  permissionId: string;
  issuerIdentityKey: string;
  recipientIdentityKey: string;
  recipientLabel: string | null;
  issuerGrantId: string | null;
  isRoot: boolean;
  actor: PermissionMember;
  issuedAt: string;
  updatedAt: string;
};

type PermissionGrantKeyPayload = {
  grantId: string;
  permissionId: string;
  recipientIdentityKey: string;
  wrappedGroupPrivateKey: string;
  issuedAt: string;
};

type PermissionRevokePayload = {
  permissionId: string;
  memberId: string;
  actor: PermissionMember;
  updatedAt: string;
};

type GrantCandidate = {
  grantId: string;
  permissionId: string;
  issuerIdentityKey: string;
  recipientIdentityKey: string;
  recipientLabel: string | null;
  issuerGrantId: string | null;
  isRoot: boolean;
  issuedAt: string;
};

function initialPermissionsState(): PermissionsState {
  return {
    byId: {},
    order: [],
    grantsById: {},
    grantsByPermissionId: {},
    latestGrantIdByPermissionAndIdentity: {},
    localGroupPrivateKeysByPermissionId: {},
  };
}

function normalizeRequiredText(value: unknown, label: string): string {
  if (typeof value !== "string") {
    throw new Error(`${label} is required.`);
  }

  const normalized = value.trim();
  if (!normalized) {
    throw new Error(`${label} is required.`);
  }

  return normalized;
}

function normalizeOptionalText(value: unknown, label: string): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== "string") {
    throw new Error(`${label} must be a string.`);
  }

  const normalized = value.trim();
  return normalized || null;
}

function readOptionalText(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const normalized = value.trim();
  return normalized || null;
}

function normalizeActor(value: unknown): PermissionMember {
  if (!value || typeof value !== "object") {
    throw new Error("Actor is required.");
  }

  const actor = value as Record<string, unknown>;

  return {
    memberId: normalizeRequiredText(actor.memberId, "Actor member id"),
    memberLabel: normalizeOptionalText(actor.memberLabel, "Actor member label"),
  };
}

async function parsePermissionCreateInput(inputValue: unknown): Promise<PermissionCreateInput> {
  if (!inputValue || typeof inputValue !== "object") {
    throw new Error("Permission create input is required.");
  }

  const input = inputValue as Record<string, unknown>;
  const actor = normalizeActor(input.actor);

  return {
    title: normalizeRequiredText(input.title, "Permission title"),
    scope: normalizeOptionalText(input.scope, "Permission scope"),
    actor: {
      ...actor,
      memberId: await validateIdentityKey(actor.memberId),
    },
  };
}

async function parsePermissionGrantInput(inputValue: unknown): Promise<PermissionGrantInput> {
  if (!inputValue || typeof inputValue !== "object") {
    throw new Error("Permission grant input is required.");
  }

  const input = inputValue as Record<string, unknown>;
  const actor = normalizeActor(input.actor);

  return {
    permissionId: normalizeRequiredText(input.permissionId, "Permission id"),
    memberId: await validateIdentityKey(normalizeRequiredText(input.memberId, "Member id")),
    memberLabel: normalizeOptionalText(input.memberLabel, "Member label"),
    actor: {
      ...actor,
      memberId: await validateIdentityKey(actor.memberId),
    },
  };
}

async function parsePermissionRevokeInput(inputValue: unknown): Promise<PermissionRevokeInput> {
  if (!inputValue || typeof inputValue !== "object") {
    throw new Error("Permission revoke input is required.");
  }

  const input = inputValue as Record<string, unknown>;
  const actor = normalizeActor(input.actor);

  return {
    permissionId: normalizeRequiredText(input.permissionId, "Permission id"),
    memberId: normalizeRequiredText(input.memberId, "Member id"),
    actor: {
      ...actor,
      memberId: await validateIdentityKey(actor.memberId),
    },
  };
}

function getEntryPayload(entry: LedgerReplayEntry): unknown {
  if (entry.payload.type === "plain") {
    return entry.payload.data;
  }

  if (entry.payload.type === "decrypted") {
    return entry.payload.data;
  }

  return null;
}

function clonePermissionRecord(record: PermissionRecord): PermissionRecord {
  return {
    ...record,
    members: record.members.map((member) => ({ ...member })),
  };
}

function clonePermissionGrantRecord(grant: PermissionGrantRecord): PermissionGrantRecord {
  return {
    ...grant,
  };
}

function clonePermissionsState(state: PermissionsState): PermissionsState {
  return {
    byId: Object.fromEntries(
      Object.entries(state.byId).map(([permissionId, record]) => [
        permissionId,
        clonePermissionRecord(record),
      ]),
    ),
    order: [...state.order],
    grantsById: Object.fromEntries(
      Object.entries(state.grantsById).map(([grantId, grant]) => [
        grantId,
        clonePermissionGrantRecord(grant),
      ]),
    ),
    grantsByPermissionId: Object.fromEntries(
      Object.entries(state.grantsByPermissionId).map(([permissionId, grantIds]) => [
        permissionId,
        [...grantIds],
      ]),
    ),
    latestGrantIdByPermissionAndIdentity: Object.fromEntries(
      Object.entries(state.latestGrantIdByPermissionAndIdentity).map(
        ([permissionId, grantsByIdentity]) => [permissionId, { ...grantsByIdentity }],
      ),
    ),
    localGroupPrivateKeysByPermissionId: {
      ...state.localGroupPrivateKeysByPermissionId,
    },
  };
}

function createStableHash(input: string): string {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) >>> 0;
  }
  return hash.toString(36);
}

function createPermissionId(
  nowIso: string,
  title: string,
  actorId: string,
  scope: string | null,
): string {
  const slug =
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "permission";
  const timestamp = nowIso.replace(/[^0-9]/g, "").slice(0, 14) || "0";
  const fingerprint = createStableHash([slug, actorId, scope ?? "", nowIso].join("|"));
  return `permission:${slug}:${timestamp}:${fingerprint}`;
}

function createGrantId(
  nowIso: string,
  permissionId: string,
  issuerIdentityKey: string,
  recipientIdentityKey: string,
): string {
  const timestamp = nowIso.replace(/[^0-9]/g, "").slice(0, 14) || "0";
  const fingerprint = createStableHash(
    [permissionId, issuerIdentityKey, recipientIdentityKey, nowIso].join("|"),
  );
  return `permission-grant:${timestamp}:${fingerprint}`;
}

function permissionIncludesMember(
  record: PermissionRecord | undefined,
  candidates: Set<string>,
): boolean {
  if (!record) {
    return false;
  }
  return record.members.some((member) => candidates.has(member.memberId));
}

function resolveRuntimeActorCandidates(identity: {
  publicKey: string;
  keyId: string;
}): Set<string> {
  const identityKey = toDidKeyFromPublicKey(identity.publicKey);
  return new Set([identityKey, identity.keyId, `did:key:${identity.keyId}`]);
}

function normalizeAuthorCandidateFromMemberId(memberId: string): string {
  return memberId.startsWith("did:key:") ? memberId : `did:key:${memberId}`;
}

async function resolveActorAuthorCandidates(actorMemberId: string): Promise<Set<string>> {
  const candidates = new Set<string>([
    normalizeAuthorCandidateFromMemberId(actorMemberId),
    actorMemberId,
  ]);
  if (isIdentityKeyFormat(actorMemberId)) {
    try {
      candidates.add(await toLegacyAuthorDidFromIdentityKey(actorMemberId));
    } catch {
      // Ignore malformed identity keys during replay hardening.
    }
  }
  return candidates;
}

function resolveViewerCandidates(
  viewerIdentityKey: unknown,
  viewerIdentityId: unknown,
): Set<string> {
  const candidates = new Set<string>();

  if (typeof viewerIdentityKey === "string" && viewerIdentityKey.trim()) {
    candidates.add(viewerIdentityKey.trim());
  }
  if (typeof viewerIdentityId === "string" && viewerIdentityId.trim()) {
    const value = viewerIdentityId.trim();
    candidates.add(value);
    candidates.add(`did:key:${value}`);
  }

  return candidates;
}

function upsertPermissionMember(
  record: PermissionRecord,
  memberId: string,
  memberLabel: string | null,
): PermissionRecord {
  const membersWithoutTarget = record.members.filter((member) => member.memberId !== memberId);

  return {
    ...record,
    members: [
      ...membersWithoutTarget,
      {
        memberId,
        memberLabel,
      },
    ],
  };
}

function applyPermissionCreate(state: PermissionsState, payloadValue: unknown): PermissionsState {
  if (!payloadValue || typeof payloadValue !== "object") {
    return state;
  }

  const payload = payloadValue as PermissionCreatePayload;
  const payloadRecord = payloadValue as Record<string, unknown>;
  const existing = state.byId[payload.permissionId];
  if (existing) {
    return state;
  }

  const resolvedPublicKey = readOptionalText(payloadRecord.publicKey) ?? "";
  const resolvedCreatedBy = readOptionalText(payloadRecord.createdBy) ?? payload.actor.memberId;

  const nextRecord: PermissionRecord = {
    id: payload.permissionId,
    title: payload.title,
    scope: payload.scope,
    members: [
      {
        memberId: payload.actor.memberId,
        memberLabel: payload.actor.memberLabel,
      },
    ],
    createdBy: resolvedCreatedBy,
    publicKey: resolvedPublicKey,
    createdAt: payload.createdAt,
    updatedAt: payload.updatedAt,
    grantCount: 0,
    viewerHasKey: false,
    viewerGrantId: null,
  };

  return {
    ...state,
    byId: {
      ...state.byId,
      [payload.permissionId]: nextRecord,
    },
    order: [...state.order, payload.permissionId],
  };
}

function resolvePermissionGrantCandidate(payloadValue: unknown): GrantCandidate | null {
  if (!payloadValue || typeof payloadValue !== "object") {
    return null;
  }

  const payload = payloadValue as Record<string, unknown>;
  const grantId = readOptionalText(payload.grantId);
  const permissionId = readOptionalText(payload.permissionId);
  const issuerIdentityKey = readOptionalText(payload.issuerIdentityKey);
  const recipientIdentityKey = readOptionalText(payload.recipientIdentityKey);
  const issuedAt = readOptionalText(payload.issuedAt);

  if (!grantId || !permissionId || !issuerIdentityKey || !recipientIdentityKey || !issuedAt) {
    return null;
  }

  const isRoot = Boolean(payload.isRoot);
  const issuerGrantId = readOptionalText(payload.issuerGrantId);

  return {
    grantId,
    permissionId,
    issuerIdentityKey,
    recipientIdentityKey,
    recipientLabel: readOptionalText(payload.recipientLabel),
    issuerGrantId,
    isRoot,
    issuedAt,
  };
}

function grantBelongsToPermission(state: PermissionsState, grant: GrantCandidate): boolean {
  return Boolean(state.byId[grant.permissionId]);
}

function validateRootGrant(state: PermissionsState, grant: GrantCandidate): boolean {
  if (!grant.isRoot) {
    return false;
  }

  if (grant.issuerGrantId !== null) {
    return false;
  }

  if (grant.issuerIdentityKey !== grant.recipientIdentityKey) {
    return false;
  }

  const existingForPermission = state.grantsByPermissionId[grant.permissionId] ?? [];
  if (existingForPermission.length > 0) {
    return false;
  }

  return true;
}

function validateDelegatedGrant(state: PermissionsState, grant: GrantCandidate): boolean {
  if (grant.isRoot) {
    return false;
  }

  const issuerLatestGrantId =
    state.latestGrantIdByPermissionAndIdentity[grant.permissionId]?.[grant.issuerIdentityKey] ??
    null;

  if (!issuerLatestGrantId) {
    return false;
  }

  if (!grant.issuerGrantId) {
    return false;
  }

  const parentGrant = state.grantsById[grant.issuerGrantId];
  if (!parentGrant) {
    return false;
  }
  if (parentGrant.permissionId !== grant.permissionId) {
    return false;
  }
  if (parentGrant.recipientIdentityKey !== grant.issuerIdentityKey) {
    return false;
  }

  return true;
}

function applyPermissionGrant(state: PermissionsState, payloadValue: unknown): PermissionsState {
  const grant = resolvePermissionGrantCandidate(payloadValue);
  if (!grant) {
    return state;
  }

  if (state.grantsById[grant.grantId]) {
    return state;
  }

  if (!grantBelongsToPermission(state, grant)) {
    return state;
  }

  const valid = grant.isRoot
    ? validateRootGrant(state, grant)
    : validateDelegatedGrant(state, grant);

  if (!valid) {
    return state;
  }

  const existingPermission = state.byId[grant.permissionId];
  if (!existingPermission) {
    return state;
  }

  const nextPermission = upsertPermissionMember(
    {
      ...existingPermission,
      updatedAt: grant.issuedAt,
      grantCount: existingPermission.grantCount + 1,
    },
    grant.recipientIdentityKey,
    grant.recipientLabel,
  );

  const nextGrant: PermissionGrantRecord = {
    grantId: grant.grantId,
    permissionId: grant.permissionId,
    issuerIdentityKey: grant.issuerIdentityKey,
    recipientIdentityKey: grant.recipientIdentityKey,
    recipientLabel: grant.recipientLabel,
    issuerGrantId: grant.issuerGrantId,
    issuedAt: grant.issuedAt,
    isRoot: grant.isRoot,
  };

  return {
    ...state,
    byId: {
      ...state.byId,
      [grant.permissionId]: nextPermission,
    },
    grantsById: {
      ...state.grantsById,
      [grant.grantId]: nextGrant,
    },
    grantsByPermissionId: {
      ...state.grantsByPermissionId,
      [grant.permissionId]: [
        ...(state.grantsByPermissionId[grant.permissionId] ?? []),
        grant.grantId,
      ],
    },
    latestGrantIdByPermissionAndIdentity: {
      ...state.latestGrantIdByPermissionAndIdentity,
      [grant.permissionId]: {
        ...(state.latestGrantIdByPermissionAndIdentity[grant.permissionId] ?? {}),
        [grant.recipientIdentityKey]: grant.grantId,
      },
    },
  };
}

function applyPermissionGrantKey(state: PermissionsState, payloadValue: unknown): PermissionsState {
  if (!payloadValue || typeof payloadValue !== "object") {
    return state;
  }

  const payload = payloadValue as PermissionGrantKeyPayload;

  const grantId = readOptionalText(payload.grantId);
  const permissionId = readOptionalText(payload.permissionId);
  const recipientIdentityKey = readOptionalText(payload.recipientIdentityKey);
  const wrappedGroupPrivateKey = readOptionalText(payload.wrappedGroupPrivateKey);

  if (!grantId || !permissionId || !recipientIdentityKey || !wrappedGroupPrivateKey) {
    return state;
  }

  const grant = state.grantsById[grantId];
  if (!grant) {
    return state;
  }

  if (grant.permissionId !== permissionId || grant.recipientIdentityKey !== recipientIdentityKey) {
    return state;
  }

  const existingPermission = state.byId[permissionId];
  if (!existingPermission) {
    return state;
  }

  const grantForViewer =
    state.latestGrantIdByPermissionAndIdentity[permissionId]?.[recipientIdentityKey] ?? grantId;

  return {
    ...state,
    byId: {
      ...state.byId,
      [permissionId]: {
        ...existingPermission,
        viewerHasKey: true,
        viewerGrantId: grantForViewer,
      },
    },
    localGroupPrivateKeysByPermissionId: {
      ...state.localGroupPrivateKeysByPermissionId,
      [permissionId]: wrappedGroupPrivateKey,
    },
  };
}

function applyPermissionRevoke(state: PermissionsState, payloadValue: unknown): PermissionsState {
  if (!payloadValue || typeof payloadValue !== "object") {
    return state;
  }

  const payload = payloadValue as PermissionRevokePayload;
  const existing = state.byId[payload.permissionId];
  if (!existing) {
    return state;
  }

  const withoutMember = existing.members.filter((member) => member.memberId !== payload.memberId);

  return {
    ...state,
    byId: {
      ...state.byId,
      [payload.permissionId]: {
        ...existing,
        members: withoutMember,
        updatedAt: payload.updatedAt,
      },
    },
  };
}

async function deriveAgeRecipientFromIdentityKey(identityKey: string): Promise<string> {
  const publicKeyBytes = identityKeyToPublicKeyBytes(identityKey);
  return await deriveAgeRecipient(publicKeyBytes);
}

function createRandomSeed(): Uint8Array {
  if (!globalThis.crypto?.getRandomValues) {
    throw new Error("Web Crypto random is unavailable in this runtime.");
  }

  const seed = new Uint8Array(32);
  globalThis.crypto.getRandomValues(seed);
  return seed;
}

async function createGroupAgeKeyPair(): Promise<{
  privateKey: string;
  publicKey: string;
}> {
  const seed = createRandomSeed();
  const privateKey = await deriveAgeSecretKey(seed);
  const publicKey = await deriveAgeRecipient({ seed });
  return {
    privateKey,
    publicKey,
  };
}

async function createPermissionCreateEntries(input: {
  now: string;
  actor: PermissionMember;
  title: string;
  scope: string | null;
  kind: "permission.create" | "permission.group.create";
}): Promise<LedgerAppendInput[]> {
  const permissionId = createPermissionId(
    input.now,
    input.title,
    input.actor.memberId,
    input.scope,
  );
  const groupKeys = await createGroupAgeKeyPair();

  const grantId = createGrantId(
    input.now,
    permissionId,
    input.actor.memberId,
    input.actor.memberId,
  );

  const actorRecipient = await deriveAgeRecipientFromIdentityKey(input.actor.memberId);

  return [
    {
      kind: input.kind,
      payload: {
        permissionId,
        title: input.title,
        scope: input.scope,
        actor: input.actor,
        createdBy: input.actor.memberId,
        publicKey: groupKeys.publicKey,
        createdAt: input.now,
        updatedAt: input.now,
      } satisfies PermissionCreatePayload,
    },
    {
      kind: "permission.grant",
      payload: {
        grantId,
        permissionId,
        issuerIdentityKey: input.actor.memberId,
        recipientIdentityKey: input.actor.memberId,
        recipientLabel: input.actor.memberLabel ?? null,
        issuerGrantId: null,
        isRoot: true,
        actor: input.actor,
        issuedAt: input.now,
        updatedAt: input.now,
      } satisfies PermissionGrantPayload,
    },
    {
      kind: "permission.grant.key",
      payload: {
        grantId,
        permissionId,
        recipientIdentityKey: input.actor.memberId,
        wrappedGroupPrivateKey: groupKeys.privateKey,
        issuedAt: input.now,
      } satisfies PermissionGrantKeyPayload,
      protection: {
        type: "recipients",
        recipients: [actorRecipient],
        encoding: "armor",
      },
    },
  ];
}

async function createPermissionGrantEntries(input: {
  now: string;
  actor: PermissionMember;
  permissionId: string;
  memberId: string;
  memberLabel: string | null;
  issuerGrantId: string;
  groupPrivateKey: string;
  kind: "permission.grant" | "permission.grant.issue";
}): Promise<LedgerAppendInput[]> {
  const grantId = createGrantId(
    input.now,
    input.permissionId,
    input.actor.memberId,
    input.memberId,
  );

  const recipient = await deriveAgeRecipientFromIdentityKey(input.memberId);

  return [
    {
      kind: input.kind,
      payload: {
        grantId,
        permissionId: input.permissionId,
        issuerIdentityKey: input.actor.memberId,
        recipientIdentityKey: input.memberId,
        recipientLabel: input.memberLabel,
        issuerGrantId: input.issuerGrantId,
        isRoot: false,
        actor: input.actor,
        issuedAt: input.now,
        updatedAt: input.now,
      } satisfies PermissionGrantPayload,
    },
    {
      kind: "permission.grant.key",
      payload: {
        grantId,
        permissionId: input.permissionId,
        recipientIdentityKey: input.memberId,
        wrappedGroupPrivateKey: input.groupPrivateKey,
        issuedAt: input.now,
      } satisfies PermissionGrantKeyPayload,
      protection: {
        type: "recipients",
        recipients: [recipient],
        encoding: "armor",
      },
    },
  ];
}

function materializeRecordForViewer(
  state: PermissionsState,
  record: PermissionRecord,
  viewerCandidates: Set<string>,
): PermissionRecord {
  if (viewerCandidates.size === 0) {
    return clonePermissionRecord(record);
  }

  const latestByIdentity = state.latestGrantIdByPermissionAndIdentity[record.id] ?? {};
  let viewerGrantId: string | null = null;

  for (const candidate of viewerCandidates) {
    const grantId = latestByIdentity[candidate];
    if (!grantId) {
      continue;
    }
    viewerGrantId = grantId;
    break;
  }

  const viewerHasKey = Boolean(
    viewerGrantId && state.localGroupPrivateKeysByPermissionId[record.id],
  );

  return {
    ...clonePermissionRecord(record),
    grantCount: state.grantsByPermissionId[record.id]?.length ?? 0,
    viewerGrantId,
    viewerHasKey,
  };
}

/**
 * Creates the local permissions replay plugin and selectors for v2.
 */
export function createPermissionsPlugin(): AppProjectionPlugin<PermissionsState> {
  const plugin: ConcordReplayPlugin<PermissionsState> = {
    id: "permissions",
    initialState: initialPermissionsState,
    commands: {
      "permission.create": async (ctx, inputValue) => {
        const input = await parsePermissionCreateInput(inputValue);
        const runtimeCandidates = resolveRuntimeActorCandidates(ctx.identity);
        if (!runtimeCandidates.has(input.actor.memberId)) {
          throw new Error("Actor identity does not match the active signer.");
        }

        return await createPermissionCreateEntries({
          now: ctx.now(),
          actor: input.actor,
          title: input.title,
          scope: input.scope ?? null,
          kind: "permission.create",
        });
      },
      "permission.group.create": async (ctx, inputValue) => {
        const input = await parsePermissionCreateInput(inputValue);
        const runtimeCandidates = resolveRuntimeActorCandidates(ctx.identity);
        if (!runtimeCandidates.has(input.actor.memberId)) {
          throw new Error("Actor identity does not match the active signer.");
        }

        return await createPermissionCreateEntries({
          now: ctx.now(),
          actor: input.actor,
          title: input.title,
          scope: input.scope ?? null,
          kind: "permission.group.create",
        });
      },
      "permission.grant": async (ctx, inputValue) => {
        const input = await parsePermissionGrantInput(inputValue);
        const runtimeCandidates = resolveRuntimeActorCandidates(ctx.identity);
        if (!runtimeCandidates.has(input.actor.memberId)) {
          throw new Error("Actor identity does not match the active signer.");
        }

        const permissionsState = ctx.getReplayState<PermissionsState>("permissions");
        const permission = permissionsState.byId[input.permissionId];
        if (!permission) {
          throw new Error("Permission does not exist.");
        }

        const issuerGrantId =
          permissionsState.latestGrantIdByPermissionAndIdentity[input.permissionId]?.[
            input.actor.memberId
          ] ?? null;

        if (!issuerGrantId) {
          throw new Error("Only existing key holders can issue grants.");
        }

        const groupPrivateKey =
          permissionsState.localGroupPrivateKeysByPermissionId[input.permissionId] ?? null;

        if (!groupPrivateKey) {
          throw new Error("No local permission key is available for delegation.");
        }

        return await createPermissionGrantEntries({
          now: ctx.now(),
          actor: input.actor,
          permissionId: input.permissionId,
          memberId: input.memberId,
          memberLabel: input.memberLabel ?? null,
          issuerGrantId,
          groupPrivateKey,
          kind: "permission.grant",
        });
      },
      "permission.grant.issue": async (ctx, inputValue) => {
        const input = await parsePermissionGrantInput(inputValue);
        const runtimeCandidates = resolveRuntimeActorCandidates(ctx.identity);
        if (!runtimeCandidates.has(input.actor.memberId)) {
          throw new Error("Actor identity does not match the active signer.");
        }

        const permissionsState = ctx.getReplayState<PermissionsState>("permissions");
        const permission = permissionsState.byId[input.permissionId];
        if (!permission) {
          throw new Error("Permission does not exist.");
        }

        const issuerGrantId =
          permissionsState.latestGrantIdByPermissionAndIdentity[input.permissionId]?.[
            input.actor.memberId
          ] ?? null;

        if (!issuerGrantId) {
          throw new Error("Only existing key holders can issue grants.");
        }

        const groupPrivateKey =
          permissionsState.localGroupPrivateKeysByPermissionId[input.permissionId] ?? null;

        if (!groupPrivateKey) {
          throw new Error("No local permission key is available for delegation.");
        }

        return await createPermissionGrantEntries({
          now: ctx.now(),
          actor: input.actor,
          permissionId: input.permissionId,
          memberId: input.memberId,
          memberLabel: input.memberLabel ?? null,
          issuerGrantId,
          groupPrivateKey,
          kind: "permission.grant.issue",
        });
      },
      "permission.revoke": async (ctx, inputValue) => {
        const input = await parsePermissionRevokeInput(inputValue);
        const runtimeCandidates = resolveRuntimeActorCandidates(ctx.identity);
        if (!runtimeCandidates.has(input.actor.memberId)) {
          throw new Error("Actor identity does not match the active signer.");
        }

        const permissionsState = ctx.getReplayState<PermissionsState>("permissions");
        const permission = permissionsState.byId[input.permissionId];
        if (!permission) {
          throw new Error("Permission does not exist.");
        }

        if (!permissionIncludesMember(permission, runtimeCandidates)) {
          throw new Error("Only existing group members can remove collaborators.");
        }

        return {
          kind: "permission.revoke",
          payload: {
            permissionId: input.permissionId,
            memberId: input.memberId,
            actor: input.actor,
            updatedAt: ctx.now(),
          } satisfies PermissionRevokePayload,
        };
      },
    },
    async applyEntry(entry, ctx) {
      const state = clonePermissionsState(ctx.getState());
      const payload = getEntryPayload(entry);

      if (entry.kind === "permission.create" || entry.kind === "permission.group.create") {
        const actorMemberId =
          payload && typeof payload === "object"
            ? readOptionalText(
                (payload as Record<string, unknown>).actor &&
                  typeof (payload as Record<string, unknown>).actor === "object"
                  ? ((payload as Record<string, unknown>).actor as Record<string, unknown>).memberId
                  : null,
              )
            : null;
        if (!actorMemberId) {
          return;
        }
        const authorCandidates = await resolveActorAuthorCandidates(actorMemberId);
        if (!authorCandidates.has(entry.author)) {
          return;
        }
        ctx.setState(applyPermissionCreate(state, payload));
        return;
      }

      if (entry.kind === "permission.grant" || entry.kind === "permission.grant.issue") {
        const grantPayload =
          payload && typeof payload === "object" ? (payload as Record<string, unknown>) : null;
        const actorValue =
          grantPayload && typeof grantPayload.actor === "object"
            ? (grantPayload.actor as Record<string, unknown>).memberId
            : null;
        const actorMemberId = readOptionalText(actorValue);
        if (!actorMemberId) {
          return;
        }
        const authorCandidates = await resolveActorAuthorCandidates(actorMemberId);
        if (!authorCandidates.has(entry.author)) {
          return;
        }
        ctx.setState(applyPermissionGrant(state, payload));
        return;
      }

      if (entry.kind === "permission.grant.key") {
        ctx.setState(applyPermissionGrantKey(state, payload));
        return;
      }

      if (entry.kind === "permission.revoke") {
        const revokePayload =
          payload && typeof payload === "object" ? (payload as Record<string, unknown>) : null;
        const actorValue =
          revokePayload && typeof revokePayload.actor === "object"
            ? (revokePayload.actor as Record<string, unknown>).memberId
            : null;
        const actorMemberId = readOptionalText(actorValue);
        if (!actorMemberId) {
          return;
        }
        const authorCandidates = await resolveActorAuthorCandidates(actorMemberId);
        if (!authorCandidates.has(entry.author)) {
          return;
        }
        const permissionId = readOptionalText(revokePayload?.permissionId ?? null);
        if (!permissionId) {
          return;
        }
        const permission = state.byId[permissionId];
        const actorCandidates = new Set<string>([
          actorMemberId,
          normalizeAuthorCandidateFromMemberId(actorMemberId),
        ]);
        if (!permissionIncludesMember(permission, actorCandidates)) {
          return;
        }
        ctx.setState(applyPermissionRevoke(state, payload));
      }
    },
  };

  return {
    plugin,
    selectors: {
      all(state, viewerIdentityKey: unknown, viewerIdentityId: unknown) {
        const viewerCandidates = resolveViewerCandidates(viewerIdentityKey, viewerIdentityId);

        const visibleRecords = state.order
          .map((permissionId) => state.byId[permissionId])
          .filter((record): record is PermissionRecord => Boolean(record))
          .map((record) => materializeRecordForViewer(state, record, viewerCandidates));

        if (viewerCandidates.size === 0) {
          return visibleRecords;
        }

        return visibleRecords.filter((record) =>
          permissionIncludesMember(record, viewerCandidates),
        );
      },
      byId(state, permissionId: unknown, viewerIdentityKey: unknown, viewerIdentityId: unknown) {
        if (typeof permissionId !== "string") {
          return null;
        }

        const record = state.byId[permissionId] ?? null;
        if (!record) {
          return null;
        }
        const viewerCandidates = resolveViewerCandidates(viewerIdentityKey, viewerIdentityId);
        if (viewerCandidates.size > 0 && !permissionIncludesMember(record, viewerCandidates)) {
          return null;
        }

        return materializeRecordForViewer(state, record, viewerCandidates);
      },
    },
  };
}
