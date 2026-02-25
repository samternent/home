import { createId, dbQuery, dbTx } from "../platform-db/index.mjs";
import { canonicalStringify } from "@ternent/concord-protocol";

function trim(value) {
  return String(value || "").trim();
}

function normalizeEnvelope(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value;
}

function sameEnvelope(left, right) {
  try {
    return canonicalStringify(left ?? null) === canonicalStringify(right ?? null);
  } catch {
    return false;
  }
}

function toMetadata(row) {
  if (!row) return null;
  return {
    id: row.id,
    managedUserId: row.managed_user_id,
    backupVersion: Number(row.backup_version || 0),
    createdAt: row.created_at,
    profileId: row.profile_id,
    identityKeyFingerprint: row.identity_key_fingerprint,
  };
}

function toLatest(row) {
  if (!row) return null;
  return {
    ...toMetadata(row),
    envelope: row.envelope_json ?? null,
  };
}

export function createIdentityBackupRepo() {
  return {
    async listByManagedUser(accountId, managedUserId) {
      const result = await dbQuery(
        `
        SELECT
          id,
          managed_user_id,
          backup_version,
          profile_id,
          identity_key_fingerprint,
          created_at
        FROM identity_key_backups
        WHERE account_id = $1
          AND managed_user_id = $2
        ORDER BY backup_version DESC, created_at DESC
        `,
        [trim(accountId), trim(managedUserId)]
      );
      return result.rows.map((row) => toMetadata(row));
    },

    async getLatestByManagedUser(accountId, managedUserId) {
      const result = await dbQuery(
        `
        SELECT
          id,
          managed_user_id,
          backup_version,
          profile_id,
          identity_key_fingerprint,
          envelope_json,
          created_at
        FROM identity_key_backups
        WHERE account_id = $1
          AND managed_user_id = $2
        ORDER BY backup_version DESC, created_at DESC
        LIMIT 1
        `,
        [trim(accountId), trim(managedUserId)]
      );
      if (result.rowCount === 0) return null;
      return toLatest(result.rows[0]);
    },

    async createOrReplayByNonce(input) {
      const accountId = trim(input?.accountId);
      const managedUserId = trim(input?.managedUserId);
      const backupNonce = trim(input?.backupNonce);
      const profileId = trim(input?.profileId);
      const identityKeyFingerprint = trim(input?.identityKeyFingerprint);
      const envelope = normalizeEnvelope(input?.envelope);

      return dbTx(async (client) => {
        const existing = await client.query(
          `
          SELECT
            id,
            managed_user_id,
            backup_version,
            profile_id,
            identity_key_fingerprint,
            envelope_json,
            created_at
          FROM identity_key_backups
          WHERE account_id = $1
            AND managed_user_id = $2
            AND backup_nonce = $3
          LIMIT 1
          FOR UPDATE
          `,
          [accountId, managedUserId, backupNonce]
        );

        if (existing.rowCount > 0) {
          const row = existing.rows[0];
          if (!sameEnvelope(row.envelope_json, envelope)) {
            const error = new Error(
              "Backup nonce was already used with a different encrypted payload."
            );
            error.code = "BACKUP_NONCE_CONFLICT";
            error.statusCode = 409;
            throw error;
          }
          return {
            replayed: true,
            backup: toMetadata(row),
          };
        }

        const nextVersionResult = await client.query(
          `
          SELECT COALESCE(MAX(backup_version), 0) + 1 AS next_version
          FROM identity_key_backups
          WHERE account_id = $1
            AND managed_user_id = $2
          `,
          [accountId, managedUserId]
        );
        const nextVersion = Number(nextVersionResult.rows[0]?.next_version || 1);

        const inserted = await client.query(
          `
          INSERT INTO identity_key_backups (
            id,
            account_id,
            managed_user_id,
            backup_version,
            backup_nonce,
            profile_id,
            identity_key_fingerprint,
            envelope_json
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)
          RETURNING
            id,
            managed_user_id,
            backup_version,
            profile_id,
            identity_key_fingerprint,
            created_at
          `,
          [
            createId("identity_backup"),
            accountId,
            managedUserId,
            nextVersion,
            backupNonce,
            profileId,
            identityKeyFingerprint,
            JSON.stringify(envelope),
          ]
        );

        return {
          replayed: false,
          backup: toMetadata(inserted.rows[0]),
        };
      });
    },

    async pruneToLatestN(accountId, managedUserId, keep = 5) {
      const keepCount = Number.isFinite(Number(keep))
        ? Math.max(1, Math.trunc(Number(keep)))
        : 5;
      const result = await dbQuery(
        `
        DELETE FROM identity_key_backups
        WHERE account_id = $1
          AND managed_user_id = $2
          AND id IN (
            SELECT id
            FROM identity_key_backups
            WHERE account_id = $1
              AND managed_user_id = $2
            ORDER BY backup_version DESC, created_at DESC
            OFFSET $3
          )
        `,
        [trim(accountId), trim(managedUserId), keepCount]
      );
      return result.rowCount;
    },

    async purgeByManagedUser(accountId, managedUserId) {
      const result = await dbQuery(
        `
        DELETE FROM identity_key_backups
        WHERE account_id = $1
          AND managed_user_id = $2
        `,
        [trim(accountId), trim(managedUserId)]
      );
      return result.rowCount;
    },

    async purgeByAccount(accountId) {
      const result = await dbQuery(
        `
        DELETE FROM identity_key_backups
        WHERE account_id = $1
        `,
        [trim(accountId)]
      );
      return result.rowCount;
    },
  };
}
