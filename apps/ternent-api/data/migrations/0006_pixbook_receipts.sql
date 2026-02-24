CREATE TABLE IF NOT EXISTS signing_identities (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  vault_key_name TEXT NOT NULL,
  public_key_pem TEXT NOT NULL,
  public_key_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (account_id, vault_key_name),
  UNIQUE (account_id, public_key_id)
);

CREATE INDEX IF NOT EXISTS signing_identities_account_status_idx
  ON signing_identities (account_id, status);

CREATE TABLE IF NOT EXISTS pixbook_ledger_heads (
  account_id TEXT NOT NULL,
  book_id TEXT NOT NULL,
  last_event_id TEXT,
  last_hash TEXT,
  stream_version BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (account_id, book_id)
);

CREATE TABLE IF NOT EXISTS pixbook_receipt_index (
  account_id TEXT NOT NULL,
  book_id TEXT NOT NULL,
  event_id TEXT NOT NULL,
  stream_version BIGINT NOT NULL,
  event_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  prev_hash TEXT,
  hash TEXT NOT NULL,
  spaces_key TEXT NOT NULL,
  signing_identity_id TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  PRIMARY KEY (account_id, book_id, event_id),
  UNIQUE (account_id, book_id, stream_version)
);

CREATE INDEX IF NOT EXISTS pixbook_receipt_index_stream_idx
  ON pixbook_receipt_index (account_id, book_id, stream_version);

CREATE INDEX IF NOT EXISTS pixbook_receipt_index_event_idx
  ON pixbook_receipt_index (account_id, book_id, event_id);

CREATE TABLE IF NOT EXISTS command_idempotency (
  account_id TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  request_hash TEXT NOT NULL,
  status TEXT NOT NULL,
  http_status INTEGER NOT NULL DEFAULT 200,
  response_body JSONB,
  event_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (account_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS command_idempotency_account_created_idx
  ON command_idempotency (account_id, created_at DESC);

CREATE TABLE IF NOT EXISTS projector_offsets (
  projector_name TEXT PRIMARY KEY,
  account_id TEXT,
  book_id TEXT,
  stream_version BIGINT,
  event_id TEXT,
  checkpoint JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
