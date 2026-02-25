CREATE TABLE IF NOT EXISTS identity_key_backups (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  managed_user_id TEXT NOT NULL,
  backup_version BIGINT NOT NULL,
  backup_nonce TEXT NOT NULL,
  profile_id TEXT NOT NULL,
  identity_key_fingerprint TEXT NOT NULL,
  envelope_json JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (account_id, managed_user_id, backup_version),
  UNIQUE (account_id, managed_user_id, backup_nonce)
);

CREATE INDEX IF NOT EXISTS identity_key_backups_account_user_created_idx
  ON identity_key_backups (account_id, managed_user_id, created_at DESC);
