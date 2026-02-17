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
    SELECT id, display_name, avatar_public_id, user_key, status, created_at, updated_at
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

  const avatarPublicId = String(input?.avatarPublicId || "").trim() || null;
  const rawUserKey = String(input?.userKey || "").trim();
  const userKey = rawUserKey || `public:${hashValue(`${workspace.id}:${displayName}:${Date.now()}`).slice(0, 24)}`;

  const id = createId("managed-user");
  await dbQuery(
    `
    INSERT INTO platform_managed_users
      (id, workspace_id, display_name, avatar_public_id, user_key, status)
    VALUES
      ($1, $2, $3, $4, $5, 'active')
    `,
    [id, workspace.id, displayName, avatarPublicId, userKey]
  );

  return { id };
}

export async function updateManagedUser(userId, workspaceId, managedUserId, input) {
  const workspace = await resolveWorkspaceForUser(userId, workspaceId);
  if (!workspace) return null;

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
