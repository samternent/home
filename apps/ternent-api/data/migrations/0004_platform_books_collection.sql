ALTER TABLE IF EXISTS platform_books
  ADD COLUMN IF NOT EXISTS collection_id TEXT;

UPDATE platform_books
SET collection_id = 'primary'
WHERE collection_id IS NULL OR btrim(collection_id) = '';

ALTER TABLE IF EXISTS platform_books
  ALTER COLUMN collection_id SET DEFAULT 'primary';

ALTER TABLE IF EXISTS platform_books
  ALTER COLUMN collection_id SET NOT NULL;

WITH active_ranked AS (
  SELECT
    id,
    row_number() OVER (
      PARTITION BY workspace_id, managed_user_id, collection_id
      ORDER BY created_at ASC, id ASC
    ) AS row_number
  FROM platform_books
  WHERE status != 'deleted'
)
UPDATE platform_books AS books
SET status = 'deleted',
    updated_at = NOW()
FROM active_ranked AS ranked
WHERE books.id = ranked.id
  AND ranked.row_number > 1;

CREATE INDEX IF NOT EXISTS platform_books_workspace_collection_idx
  ON platform_books (workspace_id, managed_user_id, collection_id, status);

CREATE UNIQUE INDEX IF NOT EXISTS platform_books_workspace_identity_collection_uq
  ON platform_books (workspace_id, managed_user_id, collection_id)
  WHERE status != 'deleted';
