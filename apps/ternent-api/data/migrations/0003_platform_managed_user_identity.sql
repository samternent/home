ALTER TABLE IF EXISTS platform_managed_users
  ADD COLUMN IF NOT EXISTS profile_id TEXT;

ALTER TABLE IF EXISTS platform_managed_users
  ADD COLUMN IF NOT EXISTS identity_public_key TEXT;

ALTER TABLE IF EXISTS platform_managed_users
  ADD COLUMN IF NOT EXISTS identity_key_fingerprint TEXT;

CREATE INDEX IF NOT EXISTS platform_managed_users_identity_idx
  ON platform_managed_users (workspace_id, profile_id, identity_key_fingerprint);

CREATE UNIQUE INDEX IF NOT EXISTS platform_managed_users_workspace_identity_uq
  ON platform_managed_users (workspace_id, profile_id, identity_key_fingerprint)
  WHERE profile_id IS NOT NULL AND identity_key_fingerprint IS NOT NULL;
