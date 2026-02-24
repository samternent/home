import { createId, dbQuery } from "../platform-db/index.mjs";
import { badRequest, notFound } from "../http/errors.mjs";

function trim(value) {
  return String(value || "").trim();
}

function mapRow(row) {
  if (!row) return null;
  return {
    id: trim(row.id),
    accountId: trim(row.account_id),
    vaultKeyName: trim(row.vault_key_name),
    publicKeyPem: String(row.public_key_pem || ""),
    publicKeyId: trim(row.public_key_id),
    status: trim(row.status || "active"),
    createdAt: row.created_at || null,
    updatedAt: row.updated_at || null,
  };
}

export function createSigningIdentityRepo() {
  return {
    async listActiveByAccount(accountId) {
      const normalizedAccountId = trim(accountId);
      if (!normalizedAccountId) return [];
      const result = await dbQuery(
        `
        SELECT id, account_id, vault_key_name, public_key_pem, public_key_id, status, created_at, updated_at
        FROM signing_identities
        WHERE account_id = $1
          AND status = 'active'
        ORDER BY created_at ASC
        `,
        [normalizedAccountId]
      );
      return result.rows.map(mapRow).filter(Boolean);
    },

    async getById(accountId, id) {
      const normalizedAccountId = trim(accountId);
      const normalizedId = trim(id);
      if (!normalizedAccountId || !normalizedId) return null;

      const result = await dbQuery(
        `
        SELECT id, account_id, vault_key_name, public_key_pem, public_key_id, status, created_at, updated_at
        FROM signing_identities
        WHERE account_id = $1
          AND id = $2
        LIMIT 1
        `,
        [normalizedAccountId, normalizedId]
      );
      return mapRow(result.rows[0]);
    },

    async resolveForCommand({
      accountId,
      requestedSigningIdentityId,
      signer,
      fallbackVaultKeyName,
    }) {
      const normalizedAccountId = trim(accountId);
      const requestedId = trim(requestedSigningIdentityId);
      if (!normalizedAccountId) {
        throw notFound("ACCOUNT_NOT_FOUND", "Account is required.");
      }

      const active = await this.listActiveByAccount(normalizedAccountId);
      if (requestedId) {
        const matched = active.find((entry) => entry.id === requestedId);
        if (!matched) {
          throw notFound(
            "SIGNING_IDENTITY_NOT_FOUND",
            "Requested signing identity was not found for account."
          );
        }
        return matched;
      }

      if (active.length === 1) {
        return active[0];
      }
      if (active.length > 1) {
        throw badRequest(
          "SIGNING_IDENTITY_REQUIRED",
          "X-Signing-Identity-Id is required when account has multiple signing identities."
        );
      }

      const keyName = trim(fallbackVaultKeyName);
      if (!keyName) {
        throw notFound(
          "SIGNING_IDENTITY_NOT_FOUND",
          "No signing identity is configured for this account."
        );
      }

      const metadata = await signer.resolveKeyMetadata({ keyName });
      const newId = createId("signing");
      await dbQuery(
        `
        INSERT INTO signing_identities (id, account_id, vault_key_name, public_key_pem, public_key_id, status)
        VALUES ($1, $2, $3, $4, $5, 'active')
        `,
        [
          newId,
          normalizedAccountId,
          metadata.keyName,
          metadata.publicKeyPem,
          metadata.publicKeyId,
        ]
      );
      return {
        id: newId,
        accountId: normalizedAccountId,
        vaultKeyName: metadata.keyName,
        publicKeyPem: metadata.publicKeyPem,
        publicKeyId: metadata.publicKeyId,
        status: "active",
      };
    },
  };
}
