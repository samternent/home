ALTER TABLE command_idempotency
  ADD COLUMN IF NOT EXISTS route_template TEXT,
  ADD COLUMN IF NOT EXISTS book_id TEXT,
  ADD COLUMN IF NOT EXISTS error_code TEXT,
  ADD COLUMN IF NOT EXISTS error_body JSONB,
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- Best-effort backfill from receipt index.
UPDATE command_idempotency c
SET
  book_id = COALESCE(c.book_id, i.book_id),
  route_template = COALESCE(
    c.route_template,
    CASE
      WHEN i.event_type = 'PIXBOOK_CREATED' THEN 'POST /v1/pixbooks/commands/create'
      ELSE 'POST /v1/pixbooks/{id}/commands/save'
    END
  )
FROM pixbook_receipt_index i
WHERE c.account_id = i.account_id
  AND c.idempotency_key = i.idempotency_key
  AND (c.book_id IS NULL OR c.route_template IS NULL);

-- Fallback for any historical rows that cannot be mapped.
UPDATE command_idempotency
SET
  book_id = COALESCE(book_id, '__legacy__'),
  route_template = COALESCE(route_template, '__legacy__')
WHERE book_id IS NULL
   OR route_template IS NULL;

UPDATE command_idempotency
SET expires_at = CASE
  WHEN status = 'in_progress' THEN NOW() + INTERVAL '120 seconds'
  WHEN status = 'failed' THEN NOW() + INTERVAL '1 day'
  ELSE NOW() + INTERVAL '7 days'
END
WHERE expires_at IS NULL;

UPDATE command_idempotency
SET status = CASE
  WHEN status IN ('in_progress', 'succeeded', 'failed') THEN status
  WHEN status = 'success' THEN 'succeeded'
  WHEN status = 'error' THEN 'failed'
  ELSE 'failed'
END;

ALTER TABLE command_idempotency
  ALTER COLUMN route_template SET NOT NULL,
  ALTER COLUMN book_id SET NOT NULL,
  ALTER COLUMN expires_at SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'command_idempotency_status_check'
      AND conrelid = 'command_idempotency'::regclass
  ) THEN
    ALTER TABLE command_idempotency
      ADD CONSTRAINT command_idempotency_status_check
      CHECK (status IN ('in_progress', 'succeeded', 'failed'));
  END IF;
END $$;

ALTER TABLE command_idempotency
  DROP CONSTRAINT IF EXISTS command_idempotency_pkey;

ALTER TABLE command_idempotency
  ADD CONSTRAINT command_idempotency_pkey
  PRIMARY KEY (account_id, route_template, book_id, idempotency_key);

CREATE INDEX IF NOT EXISTS command_idempotency_lookup_idx
  ON command_idempotency (account_id, book_id, route_template, idempotency_key);
