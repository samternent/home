# Ternent Postgres (Single-Node Cheap Profile)

This directory provisions a low-cost Postgres deployment in the existing `backend` namespace.

## Apply order

1. `kubectl apply -f .ops/postgres/secret-postgres.example.yaml` (replace values first)
2. `kubectl apply -f .ops/postgres/secret-postgres-backup.example.yaml` (replace values first)
3. `kubectl apply -f .ops/postgres/configmap.yaml`
4. `kubectl apply -f .ops/postgres/service.yaml`
5. `kubectl apply -f .ops/postgres/statefulset.yaml`
6. `kubectl apply -f .ops/postgres/networkpolicy.yaml`
7. `kubectl apply -f .ops/postgres/backup-cronjob.yaml`
8. `kubectl apply -f .ops/postgres/namespace-backend-dr.yaml`
9. `kubectl -n backend-dr create secret generic ternent-postgres-backup --from-literal=WALG_S3_PREFIX=...` (or apply a copied secret yaml)
10. `kubectl apply -f .ops/postgres/restore-drill-cronjob.yaml`
11. `kubectl apply -f .ops/postgres/pitr-drill-cronjob.yaml`

## Notes

- This is intentionally a single replica to keep cost low.
- WAL archiving is enabled via `archive_command` with WAL-G.
- The backup cronjob mounts the same PVC and runs `wal-g backup-push` once per day.
  It uses required pod affinity to schedule on the same node as Postgres (RWO PVC constraint).
- The restore drill cron currently verifies backup inventory; expand it to full restore + SQL smoke checks once your storage credentials are stable.

## Recovery (manual runbook)

Detailed checklist:

- `.ops/postgres/FAILURE_RUNBOOK.md`

1. Scale API down:
   `kubectl -n backend scale deploy/ternent-api --replicas=0`
2. Scale Postgres StatefulSet down:
   `kubectl -n backend scale statefulset/ternent-postgres --replicas=0`
3. Create a new restore PVC and run a one-off restore job using `wal-g backup-fetch`.
4. Point StatefulSet volume claim to restored data (or create a temporary restore StatefulSet + service switch).
5. Scale Postgres and verify readiness.
6. Run migration check:
   `pnpm --filter ternent-api platform:migrate`
7. Scale API up:
   `kubectl -n backend scale deploy/ternent-api --replicas=1`

## Retention

Configure retention through WAL-G settings in secret/environment:

- Keep 7 daily backups and 4 weekly backups.
- Keep WAL for at least 7-day PITR.
