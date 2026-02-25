import { createHash } from "node:crypto";
import { createId, dbQuery, dbTx } from "../platform-db/index.mjs";
import {
  readPixbookLedgerState,
  writePixbookLedgerState,
} from "./pixbook-ledger-store.mjs";

const OWNER_DEFAULT_CAPABILITIES = Object.freeze([
  "platform.account.manage",
  "platform.workspace.manage",
  "pixpax.admin.manage",
  "pixpax.analytics.read",
  "pixpax.creator.publish",
  "pixpax.creator.view",
]);
const DEFAULT_COLLECTION_ID = "primary";

function normalizeWorkspaceId(value) {
  return String(value || "").trim();
}

function normalizeIdOverride(value, prefix) {
  const normalized = String(value || "").trim();
  return normalized || createId(prefix);
}

function normalizeCollectionId(value) {
  const normalized = String(value || "").trim();
  return normalized || DEFAULT_COLLECTION_ID;
}

function hashValue(value) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();
  if (!normalized) return "";
  return createHash("sha256").update(normalized, "utf8").digest("hex");
}

function toCanonicalJson(value) {
  return JSON.stringify(value ?? null);
}

function sha256Hex(value) {
  return createHash("sha256")
    .update(String(value || ""), "utf8")
    .digest("hex");
}

function parseExpectedVersion(value) {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error("expectedVersion must be a non-negative integer.");
  }
  return parsed;
}

function parseExpectedLedgerHead(input) {
  if (!input || typeof input !== "object") return null;
  if (!Object.prototype.hasOwnProperty.call(input, "expectedLedgerHead"))
    return null;
  return String(input.expectedLedgerHead || "").trim();
}

function hashIdentityPublicKey(value) {
  const normalized = String(value || "")
    .replace(/\r/g, "")
    .replace(/\s+/g, "")
    .trim();
  if (!normalized) return "";
  return createHash("sha256").update(normalized, "utf8").digest("hex");
}

function isUniqueViolation(error) {
  return String(error?.code || "").trim() === "23505";
}

function normalizeIdentityBinding(input = {}) {
  const profileId = String(input?.profileId || "").trim();
  const identityPublicKey = String(input?.identityPublicKey || "")
    .replace(/\r/g, "")
    .trim();
  const identityKeyFingerprint = hashIdentityPublicKey(identityPublicKey);
  return {
    profileId,
    identityPublicKey,
    identityKeyFingerprint,
    isBound: Boolean(profileId && identityPublicKey && identityKeyFingerprint),
  };
}

function resolvePersonalUserKey(userId, binding = {}) {
  const canonicalUserId = String(userId || "").trim();
  const normalizedBinding = normalizeIdentityBinding(binding);
  const canonicalProfileId = normalizedBinding.profileId;
  const identityPublicKeyHash = normalizedBinding.identityKeyFingerprint;
  if (!canonicalProfileId || !identityPublicKeyHash) {
    return `auth:${canonicalUserId}`;
  }
  return `auth:${canonicalUserId}:profile:${canonicalProfileId}:pk:${identityPublicKeyHash}`;
}

export function derivePersonalPixbookUserKey(userId, binding = {}) {
  return resolvePersonalUserKey(userId, binding);
}

export class BookSnapshotConflictError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = "BookSnapshotConflictError";
    this.code = "BOOK_SNAPSHOT_CONFLICT";
    this.statusCode = 409;
    this.details = details;
  }
}

async function readLegacySnapshot(bookId) {
  const canonicalBookId = String(bookId || "").trim();
  if (!canonicalBookId) return null;

  const result = await dbQuery(
    `
    SELECT
      id,
      book_id,
      version,
      cipher_sha256,
      ledger_head,
      payload_json,
      created_at
    FROM platform_book_snapshots
    WHERE book_id = $1
    ORDER BY version DESC
    LIMIT 1
    `,
    [canonicalBookId]
  );
  if (result.rowCount === 0) return null;

  const row = result.rows[0];
  return {
    id: row.id,
    bookId: row.book_id,
    version: Number(row.version || 0),
    checksum: row.cipher_sha256 || "",
    ledgerHead: row.ledger_head || null,
    createdAt: row.created_at || null,
    payload: row.payload_json ?? null,
  };
}

async function hydrateLedgerFromLegacySnapshot(accountId, bookId) {
  const legacy = await readLegacySnapshot(bookId);
  if (!legacy) return null;
  if (!legacy.payload || typeof legacy.payload !== "object") return legacy;

  try {
    await writePixbookLedgerState({
      accountId,
      bookId,
      version: legacy.version,
      ledgerHead: legacy.ledgerHead,
      checksum: legacy.checksum,
      payload: legacy.payload,
      updatedAt: legacy.createdAt || new Date().toISOString(),
    });
  } catch (error) {
    console.error(
      "[account] failed to hydrate pixbook ledger from legacy snapshot:",
      error
    );
  }

  return legacy;
}

export async function getPrimaryWorkspaceForUser(userId) {
  const resolvedUserId = String(userId || "").trim();
  if (!resolvedUserId) return null;

  const result = await dbQuery(
    `
    SELECT
      w.id,
      w.name,
      w.created_at,
      w.updated_at,
      m.id AS member_id,
      m.role
    FROM platform_workspace_members m
    INNER JOIN platform_workspaces w ON w.id = m.workspace_id
    WHERE m.user_id = $1
      AND m.status = 'active'
    ORDER BY m.created_at ASC
    LIMIT 1
    `,
    [resolvedUserId],
  );

  return result.rows[0] || null;
}

export async function ensureWorkspaceForUser(session, options = {}) {
  const userId = String(session?.user?.id || "").trim();
  if (!userId) {
    throw new Error("Session user id is required.");
  }

  const email = String(session?.user?.email || "").trim();
  const name = String(session?.user?.name || "").trim();

  await dbQuery(
    `
    INSERT INTO auth_users (id, email, name)
    VALUES ($1, NULLIF($2, ''), NULLIF($3, ''))
    ON CONFLICT (id)
    DO UPDATE SET
      email = COALESCE(NULLIF(EXCLUDED.email, ''), auth_users.email),
      name = COALESCE(NULLIF(EXCLUDED.name, ''), auth_users.name),
      updated_at = NOW()
    `,
    [userId, email, name],
  );

  const existing = await getPrimaryWorkspaceForUser(userId);
  if (existing) return existing;

  const defaultName = email
    ? `${email.split("@")[0]}'s workspace`
    : "My workspace";

  return dbTx(async (client) => {
    const workspaceId = normalizeIdOverride(options?.workspaceId, "ws");
    const memberId = normalizeIdOverride(options?.memberId, "member");

    await client.query(
      `
      INSERT INTO platform_workspaces (id, name)
      VALUES ($1, $2)
      `,
      [workspaceId, defaultName],
    );

    await client.query(
      `
      INSERT INTO platform_workspace_members (id, workspace_id, user_id, role, status)
      VALUES ($1, $2, $3, 'owner', 'active')
      `,
      [memberId, workspaceId, userId],
    );

    for (const capability of OWNER_DEFAULT_CAPABILITIES) {
      await client.query(
        `
        INSERT INTO platform_permissions (id, member_id, capability)
        VALUES ($1, $2, $3)
        ON CONFLICT (member_id, capability) DO NOTHING
        `,
        [createId("perm"), memberId, capability],
      );
    }

    await client.query(
      `
      INSERT INTO platform_audit_events (id, workspace_id, actor_user_id, event_type, payload)
      VALUES ($1, $2, $3, $4, $5::jsonb)
      `,
      [
        createId("audit"),
        workspaceId,
        userId,
        "workspace.created",
        JSON.stringify({ workspaceId, memberId }),
      ],
    );

    return {
      id: workspaceId,
      name: defaultName,
      member_id: memberId,
      role: "owner",
    };
  });
}

export async function resolveWorkspaceForUser(
  userId,
  requestedWorkspaceId = "",
) {
  const resolvedUserId = String(userId || "").trim();
  if (!resolvedUserId) return null;

  const requested = normalizeWorkspaceId(requestedWorkspaceId);
  if (!requested) {
    return getPrimaryWorkspaceForUser(resolvedUserId);
  }

  const result = await dbQuery(
    `
    SELECT
      w.id,
      w.name,
      w.created_at,
      w.updated_at,
      m.id AS member_id,
      m.role
    FROM platform_workspace_members m
    INNER JOIN platform_workspaces w ON w.id = m.workspace_id
    WHERE m.user_id = $1
      AND m.workspace_id = $2
      AND m.status = 'active'
    LIMIT 1
    `,
    [resolvedUserId, requested],
  );

  return result.rows[0] || null;
}

export async function listCapabilitiesForMember(memberId) {
  const result = await dbQuery(
    `
    SELECT capability
    FROM platform_permissions
    WHERE member_id = $1
    ORDER BY capability ASC
    `,
    [String(memberId || "").trim()],
  );

  return result.rows.map((row) => String(row.capability || "")).filter(Boolean);
}

export async function userHasCapability(userId, capability, workspaceId = "") {
  const workspace = await resolveWorkspaceForUser(userId, workspaceId);
  if (!workspace?.member_id) {
    return { ok: false, reason: "workspace-not-found" };
  }

  const result = await dbQuery(
    `
    SELECT 1
    FROM platform_permissions
    WHERE member_id = $1 AND capability = $2
    LIMIT 1
    `,
    [workspace.member_id, String(capability || "").trim()],
  );

  return {
    ok: result.rowCount > 0,
    reason: result.rowCount > 0 ? "granted" : "denied",
    workspace,
  };
}

export async function getWorkspaceSummary(userId, workspaceId = "") {
  const workspace = await resolveWorkspaceForUser(userId, workspaceId);
  if (!workspace) return null;

  const capabilities = await listCapabilitiesForMember(workspace.member_id);

  return {
    accountId: workspace.id,
    workspaceId: workspace.id,
    name: workspace.name,
    role: workspace.role,
    capabilities,
    createdAt: workspace.created_at,
    updatedAt: workspace.updated_at,
  };
}

export async function renameWorkspace(userId, workspaceId, name) {
  const workspace = await resolveWorkspaceForUser(userId, workspaceId);
  if (!workspace) return null;

  const nextName = String(name || "").trim();
  if (!nextName) throw new Error("Workspace name is required.");

  await dbQuery(
    `
    UPDATE platform_workspaces
    SET name = $2,
        updated_at = NOW()
    WHERE id = $1
    `,
    [workspace.id, nextName],
  );

  return getWorkspaceSummary(userId, workspace.id);
}

export async function listManagedUsers(userId, workspaceId = "") {
  const workspace = await resolveWorkspaceForUser(userId, workspaceId);
  if (!workspace) return null;

  const result = await dbQuery(
    `
    SELECT id, display_name, avatar_public_id, user_key, profile_id, identity_public_key, identity_key_fingerprint, status, created_at, updated_at
    FROM platform_managed_users
    WHERE workspace_id = $1
      AND status != 'deleted'
    ORDER BY created_at ASC
    `,
    [workspace.id],
  );

  return {
    workspace,
    users: result.rows.map((row) => ({
      id: row.id,
      displayName: row.display_name,
      avatarPublicId: row.avatar_public_id,
      userKey: row.user_key,
      profileId: row.profile_id || null,
      identityPublicKey: row.identity_public_key || null,
      identityKeyFingerprint: row.identity_key_fingerprint || null,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })),
  };
}

export async function resetManagedIdentityData(userId, workspaceId = "") {
  const workspace = await resolveWorkspaceForUser(userId, workspaceId);
  if (!workspace) return null;

  return dbTx(async (client) => {
    const removedBooks = await client.query(
      `
      UPDATE platform_books
      SET status = 'deleted',
          updated_at = NOW()
      WHERE workspace_id = $1
        AND status != 'deleted'
      RETURNING id
      `,
      [workspace.id]
    );

    const removedUsers = await client.query(
      `
      UPDATE platform_managed_users
      SET status = 'deleted',
          updated_at = NOW()
      WHERE workspace_id = $1
        AND status != 'deleted'
      RETURNING id
      `,
      [workspace.id]
    );

    await client.query(
      `
      INSERT INTO platform_audit_events (id, workspace_id, actor_user_id, event_type, payload)
      VALUES ($1, $2, $3, $4, $5::jsonb)
      `,
      [
        createId("audit"),
        workspace.id,
        String(userId || "").trim() || null,
        "managed-user.identity.reset",
        JSON.stringify({
          removedManagedUserIds: removedUsers.rows
            .map((row) => String(row.id || "").trim())
            .filter(Boolean),
          removedBookIds: removedBooks.rows
            .map((row) => String(row.id || "").trim())
            .filter(Boolean),
        }),
      ]
    );

    return {
      removedManagedUsers: removedUsers.rowCount,
      removedBooks: removedBooks.rowCount,
    };
  });
}

export async function createManagedUser(userId, workspaceId, input) {
  const workspace = await resolveWorkspaceForUser(userId, workspaceId);
  if (!workspace) return null;

  const displayName = String(input?.displayName || "").trim();
  if (!displayName) throw new Error("displayName is required.");

  const binding = normalizeIdentityBinding(input || {});
  if (!binding.isBound) {
    throw new Error("profileId and identityPublicKey are required.");
  }

  const avatarPublicId = String(input?.avatarPublicId || "").trim() || null;
  const rawUserKey = String(input?.userKey || "").trim();
  const userKey =
    rawUserKey ||
    `concord:${binding.profileId}:${binding.identityKeyFingerprint.slice(
      0,
      24,
    )}`;
  const toManagedUserResult = (id) => ({
    id: String(id || "").trim(),
    displayName,
    avatarPublicId,
    userKey,
    profileId: binding.profileId,
    identityPublicKey: binding.identityPublicKey,
    identityKeyFingerprint: binding.identityKeyFingerprint,
    status: "active",
  });

  return dbTx(async (client) => {
    const byBinding = await client.query(
      `
      SELECT id
      FROM platform_managed_users
      WHERE workspace_id = $1
        AND profile_id = $2
        AND identity_key_fingerprint = $3
      ORDER BY created_at ASC
      LIMIT 1
      FOR UPDATE
      `,
      [workspace.id, binding.profileId, binding.identityKeyFingerprint]
    );

    if (byBinding.rowCount > 0) {
      const existingId = String(byBinding.rows[0]?.id || "").trim();
      await client.query(
        `
        UPDATE platform_managed_users
        SET
          display_name = COALESCE(NULLIF($2, ''), display_name),
          avatar_public_id = COALESCE($3, avatar_public_id),
          profile_id = $4,
          identity_public_key = $5,
          identity_key_fingerprint = $6,
          status = 'active',
          updated_at = NOW()
        WHERE id = $1
        `,
        [
          existingId,
          displayName,
          avatarPublicId,
          binding.profileId,
          binding.identityPublicKey,
          binding.identityKeyFingerprint,
        ]
      );
      return toManagedUserResult(existingId);
    }

    const byUserKey = await client.query(
      `
      SELECT id
      FROM platform_managed_users
      WHERE workspace_id = $1
        AND user_key = $2
      ORDER BY created_at ASC
      LIMIT 1
      FOR UPDATE
      `,
      [workspace.id, userKey]
    );

    if (byUserKey.rowCount > 0) {
      const existingId = String(byUserKey.rows[0]?.id || "").trim();
      await client.query(
        `
        UPDATE platform_managed_users
        SET
          display_name = COALESCE(NULLIF($2, ''), display_name),
          avatar_public_id = COALESCE($3, avatar_public_id),
          profile_id = $4,
          identity_public_key = $5,
          identity_key_fingerprint = $6,
          status = 'active',
          updated_at = NOW()
        WHERE id = $1
        `,
        [
          existingId,
          displayName,
          avatarPublicId,
          binding.profileId,
          binding.identityPublicKey,
          binding.identityKeyFingerprint,
        ]
      );
      return toManagedUserResult(existingId);
    }

    const id = normalizeIdOverride(input?.id, "managed-user");
    try {
      await client.query(
        `
        INSERT INTO platform_managed_users
          (
            id,
            workspace_id,
            display_name,
            avatar_public_id,
            user_key,
            profile_id,
            identity_public_key,
            identity_key_fingerprint,
            status
          )
        VALUES
          ($1, $2, $3, $4, $5, $6, $7, $8, 'active')
        `,
        [
          id,
          workspace.id,
          displayName,
          avatarPublicId,
          userKey,
          binding.profileId,
          binding.identityPublicKey,
          binding.identityKeyFingerprint,
        ]
      );
      return toManagedUserResult(id);
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;

      const raced = await client.query(
        `
        SELECT id
        FROM platform_managed_users
        WHERE workspace_id = $1
          AND (
            (profile_id = $2 AND identity_key_fingerprint = $3)
            OR user_key = $4
          )
        ORDER BY created_at ASC
        LIMIT 1
        FOR UPDATE
        `,
        [workspace.id, binding.profileId, binding.identityKeyFingerprint, userKey]
      );
      if (raced.rowCount === 0) throw error;
      const existingId = String(raced.rows[0]?.id || "").trim();
      await client.query(
        `
        UPDATE platform_managed_users
        SET
          display_name = COALESCE(NULLIF($2, ''), display_name),
          avatar_public_id = COALESCE($3, avatar_public_id),
          profile_id = $4,
          identity_public_key = $5,
          identity_key_fingerprint = $6,
          status = 'active',
          updated_at = NOW()
        WHERE id = $1
        `,
        [
          existingId,
          displayName,
          avatarPublicId,
          binding.profileId,
          binding.identityPublicKey,
          binding.identityKeyFingerprint,
        ]
      );
      return toManagedUserResult(existingId);
    }
  });
}

export async function updateManagedUser(
  userId,
  workspaceId,
  managedUserId,
  input,
) {
  const workspace = await resolveWorkspaceForUser(userId, workspaceId);
  if (!workspace) return null;
  const profileId = String(input?.profileId || "").trim();
  const identityPublicKey = String(input?.identityPublicKey || "")
    .replace(/\r/g, "")
    .trim();
  if ((profileId && !identityPublicKey) || (!profileId && identityPublicKey)) {
    throw new Error(
      "profileId and identityPublicKey must be provided together.",
    );
  }
  const identityKeyFingerprint = identityPublicKey
    ? hashIdentityPublicKey(identityPublicKey)
    : "";

  const result = await dbQuery(
    `
    UPDATE platform_managed_users
    SET
      display_name = COALESCE(NULLIF($3, ''), display_name),
      avatar_public_id = CASE
        WHEN $4::text = '__clear__' THEN NULL
        WHEN NULLIF($4::text, '') IS NULL THEN avatar_public_id
        ELSE $4
      END,
      status = COALESCE(NULLIF($5, ''), status),
      profile_id = COALESCE(NULLIF($6, ''), profile_id),
      identity_public_key = COALESCE(NULLIF($7, ''), identity_public_key),
      identity_key_fingerprint = CASE
        WHEN NULLIF($7, '') IS NULL THEN identity_key_fingerprint
        ELSE $8
      END,
      updated_at = NOW()
    WHERE id = $1
      AND workspace_id = $2
      AND status != 'deleted'
    RETURNING id
    `,
    [
      String(managedUserId || "").trim(),
      workspace.id,
      String(input?.displayName || "").trim(),
      typeof input?.avatarPublicId === "string" ? input.avatarPublicId : "",
      String(input?.status || "").trim(),
      profileId,
      identityPublicKey,
      identityKeyFingerprint,
    ],
  );

  return result.rowCount > 0 ? { id: result.rows[0].id } : null;
}

export async function listBooks(userId, workspaceId = "") {
  const workspace = await resolveWorkspaceForUser(userId, workspaceId);
  if (!workspace) return null;

  const result = await dbQuery(
    `
    SELECT
      b.id,
      b.managed_user_id,
      b.collection_id,
      b.name,
      b.status,
      b.current_version,
      b.created_at,
      b.updated_at,
      u.display_name AS managed_user_display_name
    FROM platform_books b
    INNER JOIN platform_managed_users u ON u.id = b.managed_user_id
    WHERE b.workspace_id = $1
      AND b.status != 'deleted'
    ORDER BY b.created_at ASC
    `,
    [workspace.id],
  );

  return {
    workspace,
    books: result.rows.map((row) => ({
      id: row.id,
      managedUserId: row.managed_user_id,
      collectionId: normalizeCollectionId(row.collection_id),
      managedUserDisplayName: row.managed_user_display_name,
      name: row.name,
      status: row.status,
      currentVersion: row.current_version,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })),
  };
}

export async function getBookForWorkspace(
  userId,
  workspaceId = "",
  bookId = "",
) {
  const workspace = await resolveWorkspaceForUser(userId, workspaceId);
  if (!workspace) return null;

  const canonicalBookId = String(bookId || "").trim();
  if (!canonicalBookId) return null;

  const result = await dbQuery(
    `
    SELECT
      b.id,
      b.managed_user_id,
      b.collection_id,
      b.name,
      b.status,
      b.current_version,
      b.created_at,
      b.updated_at,
      u.display_name AS managed_user_display_name,
      u.avatar_public_id,
      u.user_key,
      u.profile_id,
      u.identity_public_key,
      u.identity_key_fingerprint,
      u.status AS managed_user_status
    FROM platform_books b
    INNER JOIN platform_managed_users u ON u.id = b.managed_user_id
    WHERE b.workspace_id = $1
      AND b.id = $2
      AND b.status != 'deleted'
      AND u.status != 'deleted'
    LIMIT 1
    `,
    [workspace.id, canonicalBookId],
  );

  if (result.rowCount === 0) return null;
  const row = result.rows[0];

  return {
    workspace,
    managedUser: {
      id: row.managed_user_id,
      displayName: row.managed_user_display_name,
      avatarPublicId: row.avatar_public_id || null,
      userKey: row.user_key,
      profileId: row.profile_id || null,
      identityPublicKey: row.identity_public_key || null,
      identityKeyFingerprint: row.identity_key_fingerprint || null,
      status: row.managed_user_status,
    },
    book: {
      id: row.id,
      managedUserId: row.managed_user_id,
      collectionId: normalizeCollectionId(row.collection_id),
      name: row.name,
      status: row.status,
      currentVersion: Number(row.current_version || 0),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    },
  };
}

export async function createBook(userId, workspaceId, input) {
  const workspace = await resolveWorkspaceForUser(userId, workspaceId);
  if (!workspace) return null;

  const managedUserId = String(input?.managedUserId || "").trim();
  const name = String(input?.name || "").trim();
  const collectionId = normalizeCollectionId(input?.collectionId);

  if (!managedUserId) throw new Error("managedUserId is required.");
  if (!name) throw new Error("name is required.");

  const owner = await dbQuery(
    `
    SELECT id FROM platform_managed_users
    WHERE id = $1 AND workspace_id = $2 AND status = 'active'
    LIMIT 1
    `,
    [managedUserId, workspace.id],
  );

  if (owner.rowCount === 0) {
    throw new Error("managedUserId is not valid for this workspace.");
  }

  const existing = await dbQuery(
    `
    SELECT id
    FROM platform_books
    WHERE workspace_id = $1
      AND managed_user_id = $2
      AND collection_id = $3
      AND status != 'deleted'
    LIMIT 1
    `,
    [workspace.id, managedUserId, collectionId],
  );
  if (existing.rowCount > 0) {
    throw new Error(
      "A pixbook already exists for this identity in the requested collection.",
    );
  }

  const id = normalizeIdOverride(input?.id, "book");
  await dbQuery(
    `
    INSERT INTO platform_books
      (id, workspace_id, managed_user_id, collection_id, name, status, current_version)
    VALUES
      ($1, $2, $3, $4, $5, 'active', 0)
    `,
    [id, workspace.id, managedUserId, collectionId, name],
  );

  return { id };
}

export async function updateBook(userId, workspaceId, bookId, input) {
  const workspace = await resolveWorkspaceForUser(userId, workspaceId);
  if (!workspace) return null;

  const result = await dbQuery(
    `
    UPDATE platform_books
    SET
      name = COALESCE(NULLIF($3, ''), name),
      status = COALESCE(NULLIF($4, ''), status),
      updated_at = NOW()
    WHERE id = $1 AND workspace_id = $2
    RETURNING id
    `,
    [
      String(bookId || "").trim(),
      workspace.id,
      String(input?.name || "").trim(),
      String(input?.status || "").trim(),
    ],
  );

  return result.rowCount > 0 ? { id: result.rows[0].id } : null;
}

export async function removeBook(userId, workspaceId, bookId) {
  const workspace = await resolveWorkspaceForUser(userId, workspaceId);
  if (!workspace) return null;

  const canonicalBookId = String(bookId || "").trim();
  if (!canonicalBookId) throw new Error("bookId is required.");

  return dbTx(async (client) => {
    const removed = await client.query(
      `
      UPDATE platform_books
      SET status = 'deleted',
          updated_at = NOW()
      WHERE id = $1
        AND workspace_id = $2
        AND status != 'deleted'
      RETURNING id, managed_user_id, collection_id
      `,
      [canonicalBookId, workspace.id]
    );

    if (removed.rowCount === 0) return null;
    const row = removed.rows[0] || {};

    await client.query(
      `
      INSERT INTO platform_audit_events (id, workspace_id, actor_user_id, event_type, payload)
      VALUES ($1, $2, $3, $4, $5::jsonb)
      `,
      [
        createId("audit"),
        workspace.id,
        String(userId || "").trim() || null,
        "book.removed",
        JSON.stringify({
          bookId: row.id || canonicalBookId,
          managedUserId: row.managed_user_id || null,
          collectionId: normalizeCollectionId(row.collection_id),
        }),
      ]
    );

    return {
      id: row.id || canonicalBookId,
      managedUserId: row.managed_user_id || null,
      collectionId: normalizeCollectionId(row.collection_id),
    };
  });
}

export async function ensurePersonalPixbook(
  userId,
  workspaceId = "",
  defaults = {},
  binding = {},
  options = {},
) {
  const workspace = await resolveWorkspaceForUser(userId, workspaceId);
  if (!workspace) return null;

  const canonicalUserId = String(userId || "").trim();
  if (!canonicalUserId) return null;

  const normalizedBinding = normalizeIdentityBinding(binding || {});
  const userKey = resolvePersonalUserKey(canonicalUserId, normalizedBinding);
  const defaultName = String(
    defaults?.displayName || defaults?.email || "My Pixbook",
  ).trim();
  const collectionId = normalizeCollectionId(
    options?.collectionId || defaults?.collectionId,
  );
  const allowCreate = options?.createIfMissing !== false;

  const loadManagedUser = async () => {
    const result = await dbQuery(
      `
      SELECT id, display_name, avatar_public_id, user_key, profile_id, identity_public_key, identity_key_fingerprint, status, created_at, updated_at
      FROM platform_managed_users
      WHERE workspace_id = $1
        AND (
          user_key = $2
          OR (
            $3::text IS NOT NULL
            AND profile_id = $3
            AND identity_key_fingerprint = $4
          )
        )
      ORDER BY
        CASE WHEN status = 'active' THEN 0 ELSE 1 END,
        CASE
          WHEN
            $3::text IS NOT NULL
            AND profile_id = $3
            AND identity_key_fingerprint = $4
          THEN 0
          ELSE 1
        END,
        CASE WHEN user_key = $2 THEN 0 ELSE 1 END,
        created_at ASC
      LIMIT 1
      `,
      [
        workspace.id,
        userKey,
        normalizedBinding.profileId || null,
        normalizedBinding.identityKeyFingerprint || null,
      ],
    );
    return result.rowCount > 0 ? result.rows[0] : null;
  };

  let managedUser = await loadManagedUser();
  if (!managedUser) {
    if (!allowCreate) return null;
    const managedUserId = normalizeIdOverride(options?.managedUserId, "managed-user");
    const managedUserDisplayName = defaultName || "My Pixbook";
    try {
      await dbQuery(
        `
        INSERT INTO platform_managed_users
          (
            id,
            workspace_id,
            display_name,
            avatar_public_id,
            user_key,
            profile_id,
            identity_public_key,
            identity_key_fingerprint,
            status
          )
        VALUES
          ($1, $2, $3, NULL, $4, $5, $6, $7, 'active')
        `,
        [
          managedUserId,
          workspace.id,
          managedUserDisplayName,
          userKey,
          normalizedBinding.profileId || null,
          normalizedBinding.identityPublicKey || null,
          normalizedBinding.identityKeyFingerprint || null,
        ],
      );
      managedUser = {
        id: managedUserId,
        display_name: managedUserDisplayName,
        avatar_public_id: null,
        user_key: userKey,
        profile_id: normalizedBinding.profileId || null,
        identity_public_key: normalizedBinding.identityPublicKey || null,
        identity_key_fingerprint:
          normalizedBinding.identityKeyFingerprint || null,
        status: "active",
      };
    } catch (error) {
      if (String(error?.code || "") !== "23505") throw error;
      managedUser = await loadManagedUser();
      if (!managedUser) throw error;
    }
  }

  if (
    managedUser.status === "deleted" ||
    (normalizedBinding.isBound &&
      (!managedUser.profile_id ||
        !managedUser.identity_public_key ||
        !managedUser.identity_key_fingerprint))
  ) {
    if (!allowCreate) return null;
    const refreshed = await dbQuery(
      `
      UPDATE platform_managed_users
      SET
        status = 'active',
        profile_id = COALESCE(NULLIF($3, ''), profile_id),
        identity_public_key = COALESCE(NULLIF($4, ''), identity_public_key),
        identity_key_fingerprint = COALESCE(NULLIF($5, ''), identity_key_fingerprint),
        updated_at = NOW()
      WHERE id = $1
        AND workspace_id = $2
      RETURNING id, display_name, avatar_public_id, user_key, profile_id, identity_public_key, identity_key_fingerprint, status, created_at, updated_at
      `,
      [
        managedUser.id,
        workspace.id,
        normalizedBinding.profileId,
        normalizedBinding.identityPublicKey,
        normalizedBinding.identityKeyFingerprint,
      ],
    );
    if (refreshed.rowCount > 0) {
      managedUser = refreshed.rows[0];
    }
  }

  let book = null;
  const existingBook = await dbQuery(
    `
    SELECT id, managed_user_id, collection_id, name, status, current_version, created_at, updated_at
    FROM platform_books
    WHERE workspace_id = $1
      AND managed_user_id = $2
      AND collection_id = $3
      AND status != 'deleted'
    ORDER BY created_at ASC
    LIMIT 1
    `,
    [workspace.id, managedUser.id, collectionId],
  );

  if (existingBook.rowCount > 0) {
    book = existingBook.rows[0];
  } else {
    if (!allowCreate) return null;
    const bookId = normalizeIdOverride(options?.bookId, "book");
    await dbQuery(
      `
      INSERT INTO platform_books
        (id, workspace_id, managed_user_id, collection_id, name, status, current_version)
      VALUES
        ($1, $2, $3, $4, $5, 'active', 0)
      `,
      [bookId, workspace.id, managedUser.id, collectionId, "My Pixbook"],
    );
    book = {
      id: bookId,
      managed_user_id: managedUser.id,
      collection_id: collectionId,
      name: "My Pixbook",
      status: "active",
      current_version: 0,
    };
  }

  return {
    workspace,
    managedUser: {
      id: managedUser.id,
      displayName: managedUser.display_name,
      avatarPublicId: managedUser.avatar_public_id,
      userKey: managedUser.user_key,
      profileId: managedUser.profile_id || null,
      identityPublicKey: managedUser.identity_public_key || null,
      identityKeyFingerprint: managedUser.identity_key_fingerprint || null,
      status: managedUser.status,
    },
    book: {
      id: book.id,
      managedUserId: book.managed_user_id,
      collectionId: normalizeCollectionId(book.collection_id),
      name: book.name,
      status: book.status,
      currentVersion: Number(book.current_version || 0),
      createdAt: book.created_at,
      updatedAt: book.updated_at,
    },
  };
}

export async function removeManagedUserIdentity(
  userId,
  workspaceId,
  managedUserId,
) {
  const workspace = await resolveWorkspaceForUser(userId, workspaceId);
  if (!workspace) return null;

  const targetId = String(managedUserId || "").trim();
  if (!targetId) throw new Error("managedUserId is required.");

  return dbTx(async (client) => {
    const existing = await client.query(
      `
      SELECT id
      FROM platform_managed_users
      WHERE id = $1
        AND workspace_id = $2
        AND status != 'deleted'
      LIMIT 1
      FOR UPDATE
      `,
      [targetId, workspace.id],
    );
    if (existing.rowCount === 0) return null;

    const removedBooks = await client.query(
      `
      UPDATE platform_books
      SET status = 'deleted',
          updated_at = NOW()
      WHERE workspace_id = $1
        AND managed_user_id = $2
        AND status != 'deleted'
      RETURNING id
      `,
      [workspace.id, targetId],
    );

    const removedUser = await client.query(
      `
      UPDATE platform_managed_users
      SET status = 'deleted',
          updated_at = NOW()
      WHERE id = $1
        AND workspace_id = $2
        AND status != 'deleted'
      RETURNING id
      `,
      [targetId, workspace.id],
    );
    if (removedUser.rowCount === 0) return null;

    const removedBookIds = removedBooks.rows
      .map((row) => String(row.id || "").trim())
      .filter(Boolean);

    await client.query(
      `
      INSERT INTO platform_audit_events (id, workspace_id, actor_user_id, event_type, payload)
      VALUES ($1, $2, $3, $4, $5::jsonb)
      `,
      [
        createId("audit"),
        workspace.id,
        String(userId || "").trim() || null,
        "managed-user.identity.removed",
        JSON.stringify({
          managedUserId: targetId,
          removedBookIds,
        }),
      ],
    );

    return {
      id: targetId,
      removedBookIds,
    };
  });
}

export async function getLatestBookSnapshot(bookId, workspaceIdHint = "") {
  const canonicalBookId = String(bookId || "").trim();
  if (!canonicalBookId) return null;

  let workspaceId = String(workspaceIdHint || "").trim();
  if (!workspaceId) {
    const owner = await dbQuery(
      `
      SELECT workspace_id
      FROM platform_books
      WHERE id = $1
      LIMIT 1
      `,
      [canonicalBookId]
    );
    workspaceId = String(owner.rows?.[0]?.workspace_id || "").trim();
  }
  if (!workspaceId) return null;

  const ledgerState = await readPixbookLedgerState({
    accountId: workspaceId,
    bookId: canonicalBookId,
  });
  if (ledgerState.ok && ledgerState.state) {
    return {
      id: ledgerState.state.id,
      bookId: ledgerState.state.bookId,
      version: Number(ledgerState.state.version || 0),
      ledgerHead: ledgerState.state.ledgerHead || null,
      checksum: ledgerState.state.checksum || "",
      createdAt: ledgerState.state.createdAt || null,
      payload: ledgerState.state.payload ?? null,
    };
  }

  const legacy = await hydrateLedgerFromLegacySnapshot(workspaceId, canonicalBookId);
  if (!legacy) return null;
  return {
    id: legacy.id || `book-ledger:${legacy.bookId}:v${legacy.version}`,
    bookId: legacy.bookId,
    version: Number(legacy.version || 0),
    ledgerHead: legacy.ledgerHead || null,
    checksum: legacy.checksum || "",
    createdAt: legacy.createdAt || null,
    payload: legacy.payload ?? null,
  };
}

export async function saveBookSnapshot(userId, workspaceId, bookId, input) {
  const workspace = await resolveWorkspaceForUser(userId, workspaceId);
  if (!workspace) return null;

  const canonicalBookId = String(bookId || "").trim();
  if (!canonicalBookId) throw new Error("bookId is required.");

  const payload = input?.payload;
  if (payload == null || typeof payload !== "object") {
    throw new Error("payload object is required.");
  }

  const ledgerHead = String(input?.ledgerHead || "").trim() || null;
  const payloadJson = toCanonicalJson(payload);
  const checksum = sha256Hex(payloadJson);
  const expectedVersion = parseExpectedVersion(input?.expectedVersion);
  const expectedLedgerHead = parseExpectedLedgerHead(input);

  const saved = await dbTx(async (client) => {
    const ownedBook = await client.query(
      `
      SELECT id, workspace_id, current_version
      FROM platform_books
      WHERE id = $1
        AND workspace_id = $2
        AND status != 'deleted'
      FOR UPDATE
      `,
      [canonicalBookId, workspace.id],
    );

    if (ownedBook.rowCount === 0) {
      throw new Error("Book not found for workspace.");
    }

    const currentVersion = Number(ownedBook.rows[0].current_version || 0);
    const latestSnapshot = await getLatestBookSnapshot(canonicalBookId, workspace.id);
    const effectiveCurrentVersion = Math.max(
      currentVersion,
      Number(latestSnapshot?.version || 0)
    );

    if (expectedVersion !== null && expectedVersion !== effectiveCurrentVersion) {
      throw new BookSnapshotConflictError(
        "Pixbook has changed since you last synced. Load latest cloud state before saving.",
        {
          expectedVersion,
          currentVersion: effectiveCurrentVersion,
          latestSnapshot,
        },
      );
    }

    if (expectedLedgerHead !== null) {
      const currentLedgerHead = String(latestSnapshot?.ledgerHead || "").trim();
      if (expectedLedgerHead !== currentLedgerHead) {
        throw new BookSnapshotConflictError(
          "Pixbook ledger head conflict. Another device saved a different ledger state.",
          {
            expectedLedgerHead,
            currentLedgerHead,
            currentVersion: effectiveCurrentVersion,
            latestSnapshot,
          },
        );
      }
    }

    const nextVersion = effectiveCurrentVersion + 1;
    const writtenAt =
      String(input?.savedAt || input?.createdAt || "").trim() ||
      new Date().toISOString();
    const stored = await writePixbookLedgerState({
      accountId: workspace.id,
      bookId: canonicalBookId,
      version: nextVersion,
      ledgerHead,
      checksum,
      payload,
      updatedAt: writtenAt,
    });

    await client.query(
      `
      UPDATE platform_books
      SET current_version = $2,
          updated_at = NOW()
      WHERE id = $1
      `,
      [canonicalBookId, nextVersion],
    );

    await client.query(
      `
      INSERT INTO platform_audit_events (id, workspace_id, actor_user_id, event_type, payload)
      VALUES ($1, $2, $3, $4, $5::jsonb)
      `,
      [
        createId("audit"),
        workspace.id,
        String(userId || "").trim() || null,
        "book.ledger.saved",
        JSON.stringify({
          bookId: canonicalBookId,
          version: nextVersion,
          ledgerHead,
          checksum,
          storageKey: stored.key,
        }),
      ],
    );

    return {
      id: `book-ledger:${canonicalBookId}:v${nextVersion}`,
      bookId: canonicalBookId,
      version: nextVersion,
      ledgerHead,
      checksum,
      createdAt: writtenAt,
      payload,
    };
  });

  return saved;
}
