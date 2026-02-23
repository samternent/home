CREATE TABLE IF NOT EXISTS auth_users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS auth_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  ip_hash TEXT,
  user_agent_hash TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS auth_sessions_user_idx ON auth_sessions (user_id);
CREATE INDEX IF NOT EXISTS auth_sessions_expires_idx ON auth_sessions (expires_at);

CREATE TABLE IF NOT EXISTS auth_passkeys (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  credential_id TEXT NOT NULL UNIQUE,
  public_key TEXT NOT NULL,
  counter BIGINT NOT NULL DEFAULT 0,
  transports TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS auth_passkeys_user_idx ON auth_passkeys (user_id);

CREATE TABLE IF NOT EXISTS auth_email_verifications (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES auth_users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  purpose TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS auth_email_verifications_email_idx
  ON auth_email_verifications (email, purpose, expires_at);

CREATE TABLE IF NOT EXISTS platform_workspaces (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS platform_workspace_members (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES platform_workspaces(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (workspace_id, user_id)
);

CREATE INDEX IF NOT EXISTS platform_workspace_members_user_idx
  ON platform_workspace_members (user_id, status);

CREATE TABLE IF NOT EXISTS platform_permissions (
  id TEXT PRIMARY KEY,
  member_id TEXT NOT NULL REFERENCES platform_workspace_members(id) ON DELETE CASCADE,
  capability TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (member_id, capability)
);

CREATE INDEX IF NOT EXISTS platform_permissions_capability_idx
  ON platform_permissions (capability);

CREATE TABLE IF NOT EXISTS platform_audit_events (
  id TEXT PRIMARY KEY,
  workspace_id TEXT REFERENCES platform_workspaces(id) ON DELETE SET NULL,
  actor_user_id TEXT REFERENCES auth_users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS platform_audit_workspace_idx
  ON platform_audit_events (workspace_id, created_at DESC);

CREATE TABLE IF NOT EXISTS platform_managed_users (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES platform_workspaces(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  avatar_public_id TEXT,
  user_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (workspace_id, user_key)
);

CREATE INDEX IF NOT EXISTS platform_managed_users_workspace_idx
  ON platform_managed_users (workspace_id, status);

CREATE TABLE IF NOT EXISTS platform_books (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES platform_workspaces(id) ON DELETE CASCADE,
  managed_user_id TEXT NOT NULL REFERENCES platform_managed_users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  current_version BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS platform_books_workspace_idx
  ON platform_books (workspace_id, status);

CREATE TABLE IF NOT EXISTS platform_book_snapshots (
  id TEXT PRIMARY KEY,
  book_id TEXT NOT NULL REFERENCES platform_books(id) ON DELETE CASCADE,
  version BIGINT NOT NULL,
  cipher_object_key TEXT NOT NULL,
  cipher_sha256 TEXT NOT NULL,
  wrapped_dek TEXT NOT NULL,
  ledger_head TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (book_id, version)
);

CREATE INDEX IF NOT EXISTS platform_book_snapshots_book_idx
  ON platform_book_snapshots (book_id, created_at DESC);
