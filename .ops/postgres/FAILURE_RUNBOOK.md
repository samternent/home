# Ternent Postgres Failure Runbook

## Objective

Recover platform auth/account data with minimal downtime on the low-cost single-node profile.

## Preconditions

- Backups and WAL archives exist in Spaces (`WALG_S3_PREFIX`).
- Cluster access and secret access are available.

## Steps

1. Scale API down:

```bash
kubectl -n backend scale deploy/ternent-api --replicas=0
```

2. Stop Postgres:

```bash
kubectl -n backend scale statefulset/ternent-postgres --replicas=0
```

3. Snapshot/retain current PVC for forensic rollback.

4. Create restore job:
- Use `wal-g backup-fetch` into a new PVC.
- Recover WAL to target timestamp when needed (PITR).

5. Bring restored Postgres online:
- Attach restored PVC to temporary restore StatefulSet.
- Validate readiness and SQL smoke checks.

6. Switch service selector from old pod to restored pod.

7. Run migrations:

```bash
pnpm --filter ternent-api platform:migrate
```

8. Scale API back up:

```bash
kubectl -n backend scale deploy/ternent-api --replicas=1
```

9. Verify:
- `/v1/auth/health`
- `/v1/account/session`
- PixPax control/authenticated routes

10. Document incident:
- root cause
- restore point timestamp
- measured RPO/RTO

