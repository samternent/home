import { createHash } from "node:crypto";
import { createId, dbQuery, dbTx } from "../platform-db/index.mjs";

const OWNER_DEFAULT_CAPABILITIES = Object.freeze([
  "platform.account.manage",
  "platform.workspace.manage",
  "pixpax.admin.manage",
  "pixpax.analytics.read",
  "pixpax.creator.publish",
  "pixpax.creator.view",
]);

function normalizeWorkspaceId(value) {
  return String(value || "").trim();
}

function hashValue(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) return "";
  return createHash("sha256").update(normalized, "utf8").digest("hex");
}

function toCanonicalJson(value) {
  return JSON.stringify(value ?? null);
}

function sha256Hex(value) {
  return createHash("sha256").update(String(value || ""), "utf8").digest("hex");
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
  if (!Object.prototype.hasOwnProperty.call(input, "expectedLedgerHead")) return null;
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
    [resolvedUserId]
  );

  return result.rows[0] || null;
}

export async function ensureWorkspaceForUser(session) {
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
    [userId, email, name]
  );

  const existing = await getPrimaryWorkspaceForUser(userId);
  if (existing) return existing;

  const defaultName = email ? `${email.split("@")[0]}'s workspace` : "My workspace";

  return dbTx(async (client) => {
    const workspaceId = createId("ws");
    const memberId = createId("member");

    await client.query(
      `
      INSERT INTO platform_workspaces (id, name)
      VALUES ($1, $2)
      `,
      [workspaceId, defaultName]
    );

    await client.query(
      `
      INSERT INTO platform_workspace_members (id, workspace_id, user_id, role, status)
      VALUES ($1, $2, $3, 'owner', 'active')
      `,
      [memberId, workspaceId, userId]
    );

    for (const capability of OWNER_DEFAULT_CAPABILITIES) {
      await client.query(
        `
        INSERT INTO platform_permissions (id, member_id, capability)
        VALUES ($1, $2, $3)
        ON CONFLICT (member_id, capability) DO NOTHING
        `,
        [createId("perm"), memberId, capability]
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
      ]
    );

    return {
      id: workspaceId,
      name: defaultName,
      member_id: memberId,
      role: "owner",
    };
  });
}

export async function resolveWorkspaceForUser(userId, requestedWorkspaceId = "") {
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
    [resolvedUserId, requested]
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
    [String(memberId || "").trim()]
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
    [workspace.member_id, String(capability || "").trim()]
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
    [workspace.id, nextName]
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
    ORDER BY created_at ASC
    `,
    [workspace.id]
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
    `concord:${binding.profileId}:${binding.identityKeyFingerprint.slice(0, 24)}`;

  const id = createId("managed-user");
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

  return { id };
}

export async function updateManagedUser(userId, workspaceId, managedUserId, input) {
  const workspace = await resolveWorkspaceForUser(userId, workspaceId);
  if (!workspace) return null;
  const profileId = String(input?.profileId || "").trim();
  const identityPublicKey = String(input?.identityPublicKey || "")
    .replace(/\r/g, "")
    .trim();
  if ((profileId && !identityPublicKey) || (!profileId && identityPublicKey)) {
    throw new Error("profileId and identityPublicKey must be provided together.");
  }
  const identityKeyFingerprint = identityPublicKey
    ? hashIdentityPublicKey(identityPublicKey)
    : "";

  const result = await dbQuery(
    `
    UPDATE platform_managed_users
    SET
      display_name = COALESCE(NULLIF($4, ''), display_name),
      avatar_public_id = CASE
        WHEN $5::text = '__clear__' THEN NULL
        WHEN NULLIF($5::text, '') IS NULL THEN avatar_public_id
        ELSE $5
      END,
      status = COALESCE(NULLIF($6, ''), status),
      profile_id = COALESCE(NULLIF($7, ''), profile_id),
      identity_public_key = COALESCE(NULLIF($8, ''), identity_public_key),
      identity_key_fingerprint = CASE
        WHEN NULLIF($8, '') IS NULL THEN identity_key_fingerprint
        ELSE $9
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
    ]
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
    [workspace.id]
  );

  return {
    workspace,
    books: result.rows.map((row) => ({
      id: row.id,
      managedUserId: row.managed_user_id,
      managedUserDisplayName: row.managed_user_display_name,
      name: row.name,
      status: row.status,
      currentVersion: row.current_version,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })),
  };
}

export async function getBookForWorkspace(userId, workspaceId = "", bookId = "") {
  const workspace = await resolveWorkspaceForUser(userId, workspaceId);
  if (!workspace) return null;

  const canonicalBookId = String(bookId || "").trim();
  if (!canonicalBookId) return null;

  const result = await dbQuery(
    `
    SELECT
      b.id,
      b.managed_user_id,
      b.name,
      b.status,
      b.current_version,
      b.created_at,
      b.updated_at,
      u.display_name AS managed_user_display_name,
      u.avatar_public_id,
      u.user_key,
      u.status AS managed_user_status
    FROM platform_books b
    INNER JOIN platform_managed_users u ON u.id = b.managed_user_id
    WHERE b.workspace_id = $1
      AND b.id = $2
      AND b.status != 'deleted'
      AND u.status != 'deleted'
    LIMIT 1
    `,
    [workspace.id, canonicalBookId]
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
      status: row.managed_user_status,
    },
    book: {
      id: row.id,
      managedUserId: row.managed_user_id,
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

  if (!managedUserId) throw new Error("managedUserId is required.");
  if (!name) throw new Error("name is required.");

  const owner = await dbQuery(
    `
    SELECT id FROM platform_managed_users
    WHERE id = $1 AND workspace_id = $2 AND status = 'active'
    LIMIT 1
    `,
    [managedUserId, workspace.id]
  );

  if (owner.rowCount === 0) {
    throw new Error("managedUserId is not valid for this workspace.");
  }

  const id = createId("book");
  await dbQuery(
    `
    INSERT INTO platform_books
      (id, workspace_id, managed_user_id, name, status, current_version)
    VALUES
      ($1, $2, $3, $4, 'active', 0)
    `,
    [id, workspace.id, managedUserId, name]
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
      name = COALESCE(NULLIF($4, ''), name),
      status = COALESCE(NULLIF($5, ''), status),
      updated_at = NOW()
    WHERE id = $1 AND workspace_id = $2
    RETURNING id
    `,
    [
      String(bookId || "").trim(),
      workspace.id,
      String(input?.name || "").trim(),
      String(input?.status || "").trim(),
    ]
  );

  return result.rowCount > 0 ? { id: result.rows[0].id } : null;
}

export async function ensurePersonalPixbook(userId, workspaceId = "", defaults = {}, binding = {}) {
  const workspace = await resolveWorkspaceForUser(userId, workspaceId);
  if (!workspace) return null;

  const canonicalUserId = String(userId || "").trim();
  if (!canonicalUserId) return null;

  const normalizedBinding = normalizeIdentityBinding(binding || {});
  const userKey = resolvePersonalUserKey(canonicalUserId, normalizedBinding);
  const defaultName = String(defaults?.displayName || defaults?.email || "My Pixbook").trim();

  let managedUser = null;
  const existingManaged = await dbQuery(
    `
    SELECT id, display_name, avatar_public_id, user_key, profile_id, identity_public_key, identity_key_fingerprint, status, created_at, updated_at
    FROM platform_managed_users
    WHERE workspace_id = $1
      AND user_key = $2
      AND status != 'deleted'
    ORDER BY created_at ASC
    LIMIT 1
    `,
    [workspace.id, userKey]
  );

  if (existingManaged.rowCount > 0) {
    managedUser = existingManaged.rows[0];
    if (
      normalizedBinding.isBound &&
      (!managedUser.profile_id ||
        !managedUser.identity_public_key ||
        !managedUser.identity_key_fingerprint)
    ) {
      await dbQuery(
        `
        UPDATE platform_managed_users
        SET
          profile_id = COALESCE(NULLIF($3, ''), profile_id),
          identity_public_key = COALESCE(NULLIF($4, ''), identity_public_key),
          identity_key_fingerprint = COALESCE(NULLIF($5, ''), identity_key_fingerprint),
          updated_at = NOW()
        WHERE id = $1
          AND workspace_id = $2
        `,
        [
          managedUser.id,
          workspace.id,
          normalizedBinding.profileId,
          normalizedBinding.identityPublicKey,
          normalizedBinding.identityKeyFingerprint,
        ]
      );
      managedUser = {
        ...managedUser,
        profile_id: normalizedBinding.profileId,
        identity_public_key: normalizedBinding.identityPublicKey,
        identity_key_fingerprint: normalizedBinding.identityKeyFingerprint,
      };
    }
  } else {
    const managedUserId = createId("managed-user");
    const managedUserDisplayName = defaultName || "My Pixbook";
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
      ]
    );
    managedUser = {
      id: managedUserId,
      display_name: managedUserDisplayName,
      avatar_public_id: null,
      user_key: userKey,
      profile_id: normalizedBinding.profileId || null,
      identity_public_key: normalizedBinding.identityPublicKey || null,
      identity_key_fingerprint: normalizedBinding.identityKeyFingerprint || null,
      status: "active",
    };
  }

  let book = null;
  const existingBook = await dbQuery(
    `
    SELECT id, managed_user_id, name, status, current_version, created_at, updated_at
    FROM platform_books
    WHERE workspace_id = $1
      AND managed_user_id = $2
      AND status != 'deleted'
    ORDER BY created_at ASC
    LIMIT 1
    `,
    [workspace.id, managedUser.id]
  );

  if (existingBook.rowCount > 0) {
    book = existingBook.rows[0];
  } else {
    const bookId = createId("book");
    await dbQuery(
      `
      INSERT INTO platform_books
        (id, workspace_id, managed_user_id, name, status, current_version)
      VALUES
        ($1, $2, $3, $4, 'active', 0)
      `,
      [bookId, workspace.id, managedUser.id, "My Pixbook"]
    );
    book = {
      id: bookId,
      managed_user_id: managedUser.id,
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
      name: book.name,
      status: book.status,
      currentVersion: Number(book.current_version || 0),
      createdAt: book.created_at,
      updatedAt: book.updated_at,
    },
  };
}

export async function getLatestBookSnapshot(bookId) {
  const canonicalBookId = String(bookId || "").trim();
  if (!canonicalBookId) return null;

  const result = await dbQuery(
    `
    SELECT
      id,
      book_id,
      version,
      cipher_object_key,
      cipher_sha256,
      wrapped_dek,
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
    ledgerHead: row.ledger_head || null,
    checksum: row.cipher_sha256 || "",
    createdAt: row.created_at,
    payload: row.payload_json ?? null,
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
      [canonicalBookId, workspace.id]
    );

    if (ownedBook.rowCount === 0) {
      throw new Error("Book not found for workspace.");
    }

    const currentVersion = Number(ownedBook.rows[0].current_version || 0);
    const latestSnapshotResult = await client.query(
      `
      SELECT id, version, ledger_head, cipher_sha256, created_at
      FROM platform_book_snapshots
      WHERE book_id = $1
      ORDER BY version DESC
      LIMIT 1
      `,
      [canonicalBookId]
    );
    const latestSnapshot =
      latestSnapshotResult.rowCount > 0
        ? {
            id: latestSnapshotResult.rows[0].id,
            version: Number(latestSnapshotResult.rows[0].version || 0),
            ledgerHead: latestSnapshotResult.rows[0].ledger_head || null,
            checksum: latestSnapshotResult.rows[0].cipher_sha256 || "",
            createdAt: latestSnapshotResult.rows[0].created_at || null,
          }
        : null;

    if (expectedVersion !== null && expectedVersion !== currentVersion) {
      throw new BookSnapshotConflictError(
        "Pixbook has changed since you last synced. Load latest cloud snapshot before saving.",
        {
          expectedVersion,
          currentVersion,
          latestSnapshot,
        }
      );
    }

    if (expectedLedgerHead !== null) {
      const currentLedgerHead = String(latestSnapshot?.ledgerHead || "").trim();
      if (expectedLedgerHead !== currentLedgerHead) {
        throw new BookSnapshotConflictError(
          "Pixbook ledger head conflict. Another device saved a different snapshot.",
          {
            expectedLedgerHead,
            currentLedgerHead,
            currentVersion,
            latestSnapshot,
          }
        );
      }
    }

    const nextVersion = currentVersion + 1;
    const snapshotId = createId("book-snap");

    const insertedSnapshot = await client.query(
      `
      INSERT INTO platform_book_snapshots
        (id, book_id, version, cipher_object_key, cipher_sha256, wrapped_dek, ledger_head, payload_json)
      VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)
      RETURNING created_at
      `,
      [
        snapshotId,
        canonicalBookId,
        nextVersion,
        "inline:json:v1",
        checksum,
        "none",
        ledgerHead,
        payloadJson,
      ]
    );

    await client.query(
      `
      UPDATE platform_books
      SET current_version = $2,
          updated_at = NOW()
      WHERE id = $1
      `,
      [canonicalBookId, nextVersion]
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
        "book.snapshot.saved",
        JSON.stringify({
          bookId: canonicalBookId,
          version: nextVersion,
          ledgerHead,
          checksum,
        }),
      ]
    );

    return {
      id: snapshotId,
      bookId: canonicalBookId,
      version: nextVersion,
      ledgerHead,
      checksum,
      createdAt: insertedSnapshot.rows?.[0]?.created_at || null,
      payload,
    };
  });

  return saved;
}
