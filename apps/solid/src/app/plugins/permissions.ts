import type { ConcordReplayPlugin } from "@ternent/concord";
import type { LedgerAppendInput, LedgerReplayEntry } from "@ternent/ledger";
import { deriveAgeRecipient, deriveAgeSecretKey } from "@ternent/identity";
import type { AppProjectionPlugin } from "@/app/runtime";
import type { RuntimeReplayContext } from "./replayContext";
import {
  identityKeyToPublicKeyBytes,
  toDidKeyFromPublicKey,
  validateIdentityKey,
} from "./identityKey";

export type PermissionMember = {
  memberId: string;
  memberLabel: string | null;
};

export type PrivacyGroupOpaqueRecord = {
  id: string;
  publicKey: string;
  createdAt: string;
};

export type PrivacyGroupReadableRecord = PrivacyGroupOpaqueRecord & {
  title: string;
  scope: string | null;
  createdBy: string;
  members: PermissionMember[];
  updatedAt: string;
  grantCount: number;
  viewerHasKey: true;
  viewerGrantId: string;
};

export type PermissionRecord = PrivacyGroupReadableRecord;

type PermissionProjectionRecord = PrivacyGroupOpaqueRecord & {
  title: string | null;
  scope: string | null;
  createdBy: string | null;
  members: PermissionMember[];
  updatedAt: string | null;
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

export type PermissionsState = {
  byId: Record<string, PermissionProjectionRecord>;
  order: string[];
  grantsById: Record<string, PermissionGrantRecord>;
  grantsByPermissionId: Record<string, string[]>;
  latestGrantIdByPermissionAndIdentity: Record<string, Record<string, string>>;
  activeMemberIdsByPermissionId: Record<string, Record<string, true>>;
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

type PermissionCreateEnvelopePayload = {
  permissionId: string;
  publicKey: string;
  createdAt: string;
};

type PermissionGroupMetadataPayload = {
  permissionId: string;
  title: string;
  scope: string | null;
  createdBy: string;
  members: PermissionMember[];
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
  encryptedGroupSecretKey: string;
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
    activeMemberIdsByPermissionId: {},
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
    memberId: await validateIdentityKey(normalizeRequiredText(input.memberId, "Member id")),
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

function clonePermissionMember(member: PermissionMember): PermissionMember {
  return {
    ...member,
  };
}

function clonePermissionRecord(record: PermissionProjectionRecord): PermissionProjectionRecord {
  return {
    ...record,
    members: record.members.map(clonePermissionMember),
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
    activeMemberIdsByPermissionId: Object.fromEntries(
      Object.entries(state.activeMemberIdsByPermissionId).map(([permissionId, members]) => [
        permissionId,
        { ...members },
      ]),
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

function resolveRuntimeActorCandidates(identity: { publicKey: string; keyId: string }): Set<string> {
  const identityKey = toDidKeyFromPublicKey(identity.publicKey);
  return new Set([identityKey, identity.keyId, `did:key:${identity.keyId}`]);
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
  record: PermissionProjectionRecord,
  memberId: string,
  memberLabel: string | null,
): PermissionProjectionRecord {
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

export function hasHistoricalPermissionGrant(
  state: PermissionsState,
  permissionId: string,
  identityKey: string,
): boolean {
  return Boolean(state.latestGrantIdByPermissionAndIdentity[permissionId]?.[identityKey]);
}

export function hasActivePermissionMembership(
  state: PermissionsState,
  permissionId: string,
  identityKey: string,
): boolean {
  return Boolean(state.activeMemberIdsByPermissionId[permissionId]?.[identityKey]);
}

function applyPermissionCreate(state: PermissionsState, payloadValue: unknown): PermissionsState {
  if (!payloadValue || typeof payloadValue !== "object") {
    return state;
  }

  const payload = payloadValue as PermissionCreateEnvelopePayload;
  const payloadRecord = payloadValue as Record<string, unknown>;
  const existing = state.byId[payload.permissionId];
  if (existing) {
    return state;
  }

  const resolvedPublicKey = readOptionalText(payloadRecord.publicKey) ?? "";

  const nextRecord: PermissionProjectionRecord = {
    id: payload.permissionId,
    publicKey: resolvedPublicKey,
    createdAt: payload.createdAt,
    title: null,
    scope: null,
    createdBy: null,
    members: [],
    updatedAt: null,
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

function applyPermissionMetadata(state: PermissionsState, payloadValue: unknown): PermissionsState {
  if (!payloadValue || typeof payloadValue !== "object") {
    return state;
  }

  const payload = payloadValue as PermissionGroupMetadataPayload;
  const existing = state.byId[payload.permissionId];
  if (!existing) {
    return state;
  }

  return {
    ...state,
    byId: {
      ...state.byId,
      [payload.permissionId]: {
        ...existing,
        title: payload.title,
        scope: payload.scope,
        createdBy: payload.createdBy,
        members: payload.members.map(clonePermissionMember),
        updatedAt: payload.updatedAt,
      },
    },
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

  const nextPermission = upsertPermissionMember(existingPermission, grant.recipientIdentityKey, grant.recipientLabel);

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
      [grant.permissionId]: {
        ...nextPermission,
        updatedAt: grant.issuedAt,
      },
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
    activeMemberIdsByPermissionId: {
      ...state.activeMemberIdsByPermissionId,
      [grant.permissionId]: {
        ...(state.activeMemberIdsByPermissionId[grant.permissionId] ?? {}),
        [grant.recipientIdentityKey]: true,
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
  const encryptedGroupSecretKey = readOptionalText(payload.encryptedGroupSecretKey);

  if (!grantId || !permissionId || !recipientIdentityKey || !encryptedGroupSecretKey) {
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

  return {
    ...state,
    localGroupPrivateKeysByPermissionId: {
      ...state.localGroupPrivateKeysByPermissionId,
      [permissionId]: encryptedGroupSecretKey,
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
  const members = {
    ...(state.activeMemberIdsByPermissionId[payload.permissionId] ?? {}),
  };
  delete members[payload.memberId];

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
    activeMemberIdsByPermissionId: {
      ...state.activeMemberIdsByPermissionId,
      [payload.permissionId]: members,
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
        publicKey: groupKeys.publicKey,
        createdAt: input.now,
      } satisfies PermissionCreateEnvelopePayload,
    },
    {
      kind: "permission.group.meta",
      payload: {
        permissionId,
        title: input.title,
        scope: input.scope,
        createdBy: input.actor.memberId,
        members: [
          {
            memberId: input.actor.memberId,
            memberLabel: input.actor.memberLabel,
          },
        ],
        updatedAt: input.now,
      } satisfies PermissionGroupMetadataPayload,
      protection: {
        type: "recipients",
        recipients: [actorRecipient],
        encoding: "armor",
      },
    },
    {
      kind: "permission.grant",
      payload: {
        grantId,
        permissionId,
        issuerIdentityKey: input.actor.memberId,
        recipientIdentityKey: input.actor.memberId,
        recipientLabel: input.actor.memberLabel,
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
        encryptedGroupSecretKey: groupKeys.privateKey,
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
  metadataSnapshot: PermissionGroupMetadataPayload;
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
        encryptedGroupSecretKey: input.groupPrivateKey,
        issuedAt: input.now,
      } satisfies PermissionGrantKeyPayload,
      protection: {
        type: "recipients",
        recipients: [recipient],
        encoding: "armor",
      },
    },
    {
      kind: "permission.group.meta",
      payload: input.metadataSnapshot,
      protection: {
        type: "recipients",
        recipients: [recipient],
        encoding: "armor",
      },
    },
  ];
}

function materializeReadableRecordForViewer(
  state: PermissionsState,
  record: PermissionProjectionRecord,
  viewerCandidates: Set<string>,
): PermissionRecord | null {
  if (viewerCandidates.size === 0) {
    return null;
  }

  let viewerIdentityKey: string | null = null;
  for (const candidate of viewerCandidates) {
    if (hasActivePermissionMembership(state, record.id, candidate)) {
      viewerIdentityKey = candidate;
      break;
    }
  }

  if (!viewerIdentityKey) {
    return null;
  }

  const latestByIdentity = state.latestGrantIdByPermissionAndIdentity[record.id] ?? {};
  const viewerGrantId = latestByIdentity[viewerIdentityKey] ?? null;
  const viewerHasKey = Boolean(viewerGrantId && state.localGroupPrivateKeysByPermissionId[record.id]);

  if (!viewerGrantId || !viewerHasKey) {
    return null;
  }

  if (!record.title || !record.createdBy || !record.updatedAt) {
    return null;
  }

  return {
    id: record.id,
    publicKey: record.publicKey,
    createdAt: record.createdAt,
    title: record.title,
    scope: record.scope,
    createdBy: record.createdBy,
    members: record.members.map(clonePermissionMember),
    updatedAt: record.updatedAt,
    grantCount: state.grantsByPermissionId[record.id]?.length ?? 0,
    viewerGrantId,
    viewerHasKey: true,
  };
}

/**
 * Creates the local permissions replay plugin and selectors for v2.
 */
export function createPermissionsPlugin(options?: {
  replayContext?: RuntimeReplayContext;
}): AppProjectionPlugin<PermissionsState> {
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

        if (!hasActivePermissionMembership(permissionsState, input.permissionId, input.actor.memberId)) {
          throw new Error("Only existing key holders can issue grants.");
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
        if (!permission.title || !permission.createdBy || !permission.updatedAt) {
          throw new Error("Permission metadata is unavailable for grant issuance.");
        }

        return await createPermissionGrantEntries({
          now: ctx.now(),
          actor: input.actor,
          permissionId: input.permissionId,
          memberId: input.memberId,
          memberLabel: input.memberLabel ?? null,
          issuerGrantId,
          groupPrivateKey,
          metadataSnapshot: {
            permissionId: input.permissionId,
            title: permission.title,
            scope: permission.scope,
            createdBy: permission.createdBy,
            members: upsertPermissionMember(permission, input.memberId, input.memberLabel ?? null)
              .members,
            updatedAt: ctx.now(),
          },
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

        if (!hasActivePermissionMembership(permissionsState, input.permissionId, input.actor.memberId)) {
          throw new Error("Only existing key holders can issue grants.");
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
        if (!permission.title || !permission.createdBy || !permission.updatedAt) {
          throw new Error("Permission metadata is unavailable for grant issuance.");
        }

        return await createPermissionGrantEntries({
          now: ctx.now(),
          actor: input.actor,
          permissionId: input.permissionId,
          memberId: input.memberId,
          memberLabel: input.memberLabel ?? null,
          issuerGrantId,
          groupPrivateKey,
          metadataSnapshot: {
            permissionId: input.permissionId,
            title: permission.title,
            scope: permission.scope,
            createdBy: permission.createdBy,
            members: upsertPermissionMember(permission, input.memberId, input.memberLabel ?? null)
              .members,
            updatedAt: ctx.now(),
          },
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

        if (!hasActivePermissionMembership(permissionsState, input.permissionId, input.actor.memberId)) {
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
        ctx.setState(applyPermissionCreate(state, payload));
        return;
      }

      if (entry.kind === "permission.group.meta") {
        if (payload !== null && payload !== undefined) {
          options?.replayContext?.rememberDecryptedPayload(entry.entryId, payload);
        }
        ctx.setState(applyPermissionMetadata(state, payload));
        return;
      }

      if (entry.kind === "permission.grant" || entry.kind === "permission.grant.issue") {
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
        const permissionId = readOptionalText(revokePayload?.permissionId ?? null);
        if (!permissionId) {
          return;
        }
        if (!hasActivePermissionMembership(state, permissionId, actorMemberId)) {
          return;
        }
        ctx.setState(applyPermissionRevoke(state, payload));
      }
    },
    endReplay(ctx) {
      options?.replayContext?.setPermissionsState(clonePermissionsState(ctx.getState()));
    },
  };

  return {
    plugin,
    selectors: {
      all(state, viewerIdentityKey: unknown, viewerIdentityId: unknown) {
        const viewerCandidates = resolveViewerCandidates(viewerIdentityKey, viewerIdentityId);

        return state.order
          .map((permissionId) => state.byId[permissionId])
          .filter((record): record is PermissionProjectionRecord => Boolean(record))
          .map((record) => materializeReadableRecordForViewer(state, record, viewerCandidates))
          .filter((record): record is PermissionRecord => Boolean(record));
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
        return materializeReadableRecordForViewer(state, record, viewerCandidates);
      },
    },
  };
}
