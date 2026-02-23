-- Stage F manual archive migration.
-- Intentionally stored outside data/migrations/*.sql so platform:migrate will not auto-run it.

BEGIN;

CREATE SCHEMA IF NOT EXISTS legacy;

ALTER TABLE IF EXISTS public.platform_workspaces SET SCHEMA legacy;
ALTER TABLE IF EXISTS public.platform_workspace_members SET SCHEMA legacy;
ALTER TABLE IF EXISTS public.platform_managed_users SET SCHEMA legacy;
ALTER TABLE IF EXISTS public.platform_books SET SCHEMA legacy;
ALTER TABLE IF EXISTS public.platform_book_snapshots SET SCHEMA legacy;
ALTER TABLE IF EXISTS public.platform_audit_events SET SCHEMA legacy;
ALTER TABLE IF EXISTS public.platform_permissions SET SCHEMA legacy;

ALTER TABLE IF EXISTS legacy.platform_workspaces RENAME TO platform_workspaces_legacy;
ALTER TABLE IF EXISTS legacy.platform_workspace_members RENAME TO platform_workspace_members_legacy;
ALTER TABLE IF EXISTS legacy.platform_managed_users RENAME TO platform_managed_users_legacy;
ALTER TABLE IF EXISTS legacy.platform_books RENAME TO platform_books_legacy;
ALTER TABLE IF EXISTS legacy.platform_book_snapshots RENAME TO platform_book_snapshots_legacy;
ALTER TABLE IF EXISTS legacy.platform_audit_events RENAME TO platform_audit_events_legacy;
ALTER TABLE IF EXISTS legacy.platform_permissions RENAME TO platform_permissions_legacy;

COMMIT;
