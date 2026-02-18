ALTER TABLE IF EXISTS platform_book_snapshots
  ADD COLUMN IF NOT EXISTS payload_json JSONB;
