CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS account_members (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (account_id, user_id)
);

CREATE INDEX IF NOT EXISTS account_members_user_idx
  ON account_members (user_id, status);

CREATE TABLE IF NOT EXISTS identities (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  avatar_public_id TEXT,
  user_key TEXT NOT NULL,
  profile_id TEXT,
  identity_public_key TEXT,
  identity_key_fingerprint TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (account_id, user_key),
  UNIQUE (account_id, id)
);

CREATE INDEX IF NOT EXISTS identities_account_idx
  ON identities (account_id, status);

CREATE INDEX IF NOT EXISTS identities_account_profile_identity_idx
  ON identities (account_id, profile_id, identity_key_fingerprint);

CREATE UNIQUE INDEX IF NOT EXISTS identities_account_identity_fingerprint_uq
  ON identities (account_id, identity_key_fingerprint)
  WHERE identity_key_fingerprint IS NOT NULL AND status != 'deleted';

CREATE TABLE IF NOT EXISTS pixbooks (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  identity_id TEXT NOT NULL REFERENCES identities(id) ON DELETE CASCADE,
  collection_id TEXT NOT NULL DEFAULT 'primary',
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  current_version BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT pixbooks_account_identity_fk
    FOREIGN KEY (account_id, identity_id)
    REFERENCES identities (account_id, id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS pixbooks_account_idx
  ON pixbooks (account_id, status);

CREATE INDEX IF NOT EXISTS pixbooks_account_identity_collection_idx
  ON pixbooks (account_id, identity_id, collection_id, status);

CREATE UNIQUE INDEX IF NOT EXISTS pixbooks_identity_collection_active_uq
  ON pixbooks (identity_id, collection_id)
  WHERE status != 'deleted';

CREATE TABLE IF NOT EXISTS pixbook_snapshots (
  id TEXT PRIMARY KEY,
  pixbook_id TEXT NOT NULL REFERENCES pixbooks(id) ON DELETE CASCADE,
  version BIGINT NOT NULL,
  cipher_object_key TEXT NOT NULL,
  cipher_sha256 TEXT NOT NULL,
  wrapped_dek TEXT NOT NULL,
  ledger_head TEXT,
  payload_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (pixbook_id, version)
);

CREATE INDEX IF NOT EXISTS pixbook_snapshots_pixbook_idx
  ON pixbook_snapshots (pixbook_id, created_at DESC);

CREATE TABLE IF NOT EXISTS audit_events (
  id TEXT PRIMARY KEY,
  account_id TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  actor_user_id TEXT REFERENCES auth_users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS audit_events_account_created_idx
  ON audit_events (account_id, created_at DESC);
