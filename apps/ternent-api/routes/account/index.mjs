import { createHash } from "node:crypto";
import { requireSession, upsertAuthUserShadow } from "../../services/auth/platform-auth.mjs";
import { requirePermission } from "../../services/auth/permissions.mjs";
import {
  createBook,
  createManagedUser,
  derivePersonalPixbookUserKey,
  ensurePersonalPixbook,
  ensureWorkspaceForUser,
  getBookForWorkspace,
  getWorkspaceSummary,
  listBooks,
  listManagedUsers,
  removeManagedUserIdentity,
  resetManagedIdentityData,
  removeBook,
  renameWorkspace,
  updateBook,
  updateManagedUser,
} from "../../services/account/platform-account-store-switch.mjs";
import {
  asAccountAliasPayload,
  resolveRequestedAccountId,
} from "../../services/account/account-schema-flags.mjs";
import {
  applyLegacyDeprecationHeaders,
  getLegacyPixbookSnapshot,
  saveLegacyPixbookSnapshot,
} from "../../modules/pixbooks/legacy-bridge.mjs";
import { createIdentityBackupRepo } from "../../services/account/identity-backup-repo.mjs";

const DEFAULT_COLLECTION_ID = "primary";
const IDENTITY_BACKUP_MAX_ENVELOPE_BYTES = 128 * 1024;
const IDENTITY_BACKUP_FORMAT = "pixpax-identity-backup-encrypted";
const IDENTITY_BACKUP_VERSION = "1.0";
const IDENTITY_BACKUP_KDF_NAME = "PBKDF2-SHA256";
const IDENTITY_BACKUP_KDF_ITERATIONS = 310000;
const IDENTITY_BACKUP_CIPHER_NAME = "AES-256-GCM";

const identityBackupRepo = createIdentityBackupRepo();

function resolveAccountId(req) {
  return resolveRequestedAccountId(req);
}

function sessionUserId(req) {
  return String(req?.platformSession?.user?.id || "").trim();
}

function trim(value) {
  return String(value || "").trim();
}

function isTruthyEnv(value) {
  const normalized = trim(value).toLowerCase();
  return (
    normalized === "1" ||
    normalized === "true" ||
    normalized === "yes" ||
    normalized === "on"
  );
}

function identityBackupsEnabled() {
  return isTruthyEnv(process.env.PIX_PAX_IDENTITY_BACKUPS_ENABLED);
}

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hashIdentityPublicKey(value) {
  const normalized = String(value || "")
    .replace(/\r/g, "")
    .replace(/\s+/g, "")
    .trim();
  if (!normalized) return "";
  return createHash("sha256").update(normalized, "utf8").digest("hex");
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    trim(value)
  );
}

function backupMetadataFromEnvelope(envelope = {}) {
  return {
    format: trim(envelope.format),
    version: trim(envelope.version),
    accountId: trim(envelope.accountId),
    managedUserId: trim(envelope.managedUserId),
    profileId: trim(envelope.profileId),
    identityPublicKey: trim(envelope.identityPublicKey),
    identityKeyFingerprint: trim(envelope.identityKeyFingerprint),
    label: trim(envelope.label),
    metadata: isObject(envelope.metadata) ? envelope.metadata : {},
    createdAt: trim(envelope.createdAt),
    ciphertextB64: trim(envelope.ciphertextB64),
    crypto: isObject(envelope.crypto) ? envelope.crypto : {},
  };
}

function validateEncryptedIdentityBackupEnvelope(body = {}) {
  const managedUserId = trim(body.managedUserId);
  const backupNonce = trim(body.backupNonce);
  const envelope = isObject(body.envelope) ? body.envelope : null;
  if (!managedUserId) {
    throw new Error("managedUserId is required.");
  }
  if (!backupNonce || !isUuid(backupNonce)) {
    throw new Error("backupNonce must be a valid UUID.");
  }
  if (!envelope) {
    throw new Error("envelope is required.");
  }

  const metadata = backupMetadataFromEnvelope(envelope);
  if (metadata.format !== IDENTITY_BACKUP_FORMAT) {
    throw new Error(`envelope.format must be ${IDENTITY_BACKUP_FORMAT}.`);
  }
  if (metadata.version !== IDENTITY_BACKUP_VERSION) {
    throw new Error(`envelope.version must be ${IDENTITY_BACKUP_VERSION}.`);
  }
  if (!metadata.accountId || !metadata.managedUserId || !metadata.profileId) {
    throw new Error("envelope account/profile identifiers are required.");
  }
  if (!metadata.identityPublicKey || !metadata.identityKeyFingerprint) {
    throw new Error("envelope identity binding is required.");
  }
  if (!metadata.label) {
    throw new Error("envelope.label is required.");
  }
  if (!metadata.createdAt || Number.isNaN(new Date(metadata.createdAt).getTime())) {
    throw new Error("envelope.createdAt must be an ISO timestamp.");
  }
  if (!metadata.ciphertextB64) {
    throw new Error("envelope.ciphertextB64 is required.");
  }

  const crypto = metadata.crypto;
  const kdf = isObject(crypto.kdf) ? crypto.kdf : null;
  const cipher = isObject(crypto.cipher) ? crypto.cipher : null;
  const aad = isObject(crypto.aad) ? crypto.aad : null;
  if (!kdf || !cipher || !aad) {
    throw new Error("envelope.crypto must include kdf, cipher, and aad.");
  }
  if (trim(kdf.name) !== IDENTITY_BACKUP_KDF_NAME) {
    throw new Error(`envelope.crypto.kdf.name must be ${IDENTITY_BACKUP_KDF_NAME}.`);
  }
  if (Number(kdf.iterations) !== IDENTITY_BACKUP_KDF_ITERATIONS) {
    throw new Error(
      `envelope.crypto.kdf.iterations must be ${IDENTITY_BACKUP_KDF_ITERATIONS}.`
    );
  }
  if (!trim(kdf.saltB64)) {
    throw new Error("envelope.crypto.kdf.saltB64 is required.");
  }
  if (trim(cipher.name) !== IDENTITY_BACKUP_CIPHER_NAME) {
    throw new Error(`envelope.crypto.cipher.name must be ${IDENTITY_BACKUP_CIPHER_NAME}.`);
  }
  if (!trim(cipher.ivB64)) {
    throw new Error("envelope.crypto.cipher.ivB64 is required.");
  }

  const aadAccountId = trim(aad.accountId);
  const aadManagedUserId = trim(aad.managedUserId);
  const aadProfileId = trim(aad.profileId);
  const aadIdentityKeyFingerprint = trim(aad.identityKeyFingerprint);
  const aadFormat = trim(aad.format);
  const aadVersion = trim(aad.version);
  if (
    !aadAccountId ||
    !aadManagedUserId ||
    !aadProfileId ||
    !aadIdentityKeyFingerprint ||
    !aadFormat ||
    !aadVersion
  ) {
    throw new Error("envelope.crypto.aad is missing required fields.");
  }

  return {
    managedUserId,
    backupNonce,
    envelope,
    envelopeMeta: metadata,
  };
}

function resolveBookId(req) {
  return String(
    req?.headers?.["x-book-id"] ||
      req?.query?.bookId ||
      req?.body?.bookId ||
      ""
  ).trim();
}

function resolveCollectionId(req) {
  return (
    String(
      req?.headers?.["x-pixbook-collection-id"] ||
        req?.query?.collectionId ||
        req?.body?.collectionId ||
        ""
    ).trim() || DEFAULT_COLLECTION_ID
  );
}

function resolveProfileBinding(req) {
  const profileId = String(
    req?.headers?.["x-pixbook-profile-id"] ||
      req?.query?.profileId ||
      req?.body?.profileId ||
      ""
  ).trim();
  const identityPublicKey = String(
    req?.headers?.["x-pixbook-identity-key"] ||
      req?.query?.identityPublicKey ||
      req?.body?.identityPublicKey ||
      ""
  ).trim();
  const profileDisplayName = String(
    req?.headers?.["x-pixbook-profile-name"] ||
      req?.query?.profileDisplayName ||
      req?.body?.profileDisplayName ||
      ""
  ).trim();
  return {
    profileId,
    identityPublicKey,
    profileDisplayName,
    isBound: Boolean(profileId && identityPublicKey),
  };
}

async function resolveManagedUserForAccount(req, managedUserId) {
  const accountId = resolveAccountId(req);
  const userId = sessionUserId(req);
  const data = await listManagedUsers(userId, accountId);
  if (!data) return null;
  const targetManagedUserId = trim(managedUserId);
  const managedUser = (data.users || []).find(
    (entry) => trim(entry.id) === targetManagedUserId
  );
  if (!managedUser) {
    return {
      accountId: trim(data.workspace?.id || data.workspace?.workspaceId || ""),
      managedUser: null,
    };
  }
  return {
    accountId: trim(data.workspace?.id || data.workspace?.workspaceId || ""),
    managedUser,
  };
}

async function purgeIdentityBackupsForManagedUser(req, managedUserId) {
  try {
    if (!identityBackupsEnabled()) return;
    const workspace = await getWorkspaceSummary(sessionUserId(req), resolveAccountId(req));
    const accountId = trim(workspace?.workspaceId || workspace?.accountId);
    if (!accountId || !trim(managedUserId)) return;
    await identityBackupRepo.purgeByManagedUser(accountId, managedUserId);
  } catch (error) {
    console.error("[account] identity backup purge by managed user failed:", error);
  }
}

async function purgeIdentityBackupsForAccount(req) {
  try {
    if (!identityBackupsEnabled()) return;
    const workspace = await getWorkspaceSummary(sessionUserId(req), resolveAccountId(req));
    const accountId = trim(workspace?.workspaceId || workspace?.accountId);
    if (!accountId) return;
    await identityBackupRepo.purgeByAccount(accountId);
  } catch (error) {
    console.error("[account] identity backup purge by account failed:", error);
  }
}

export default function accountRoutes(router) {
  router.get("/v1/account/session", requireSession, async (req, res) => {
    try {
      await upsertAuthUserShadow(req.platformSession);
      await ensureWorkspaceForUser(req.platformSession);
    } catch (error) {
      console.error("[account] ensure session workspace failed:", error);
    }

    const user = req.platformSession?.user || null;
    const workspace = await getWorkspaceSummary(sessionUserId(req), resolveAccountId(req));

    res.status(200).send({
      ok: true,
      user,
      workspace,
    });
  });

  router.get(
    "/v1/account/workspace",
    requirePermission("platform.account.manage"),
    async (req, res) => {
      const workspace = await getWorkspaceSummary(sessionUserId(req), resolveAccountId(req));
      if (!workspace) {
        res.status(404).send({ ok: false, error: "Workspace not found." });
        return;
      }
      res.status(200).send({ ok: true, workspace });
    }
  );

  router.patch(
    "/v1/account/workspace",
    requirePermission("platform.workspace.manage"),
    async (req, res) => {
      try {
        const workspace = await renameWorkspace(
          sessionUserId(req),
          resolveAccountId(req),
          req.body?.name
        );
        if (!workspace) {
          res.status(404).send({ ok: false, error: "Workspace not found." });
          return;
        }
        res.status(200).send({ ok: true, workspace });
      } catch (error) {
        res.status(400).send({ ok: false, error: error?.message || "Unable to update workspace." });
      }
    }
  );

  router.get("/v1/account/users", requirePermission("platform.account.manage"), async (req, res) => {
    const data = await listManagedUsers(sessionUserId(req), resolveAccountId(req));
    if (!data) {
      res.status(404).send({ ok: false, error: "Workspace not found." });
      return;
    }
    res.status(200).send({
      ok: true,
      accountId: data.workspace.id,
      workspaceId: data.workspace.id,
      users: data.users,
    });
  });

  router.post("/v1/account/users", requirePermission("platform.account.manage"), async (req, res) => {
    try {
      const created = await createManagedUser(sessionUserId(req), resolveAccountId(req), req.body);
      if (!created) {
        res.status(404).send({ ok: false, error: "Workspace not found." });
        return;
      }
      res.status(201).send({
        ok: true,
        id: created.id,
        user: created,
      });
    } catch (error) {
      res.status(400).send({ ok: false, error: error?.message || "Unable to create managed user." });
    }
  });

  router.patch(
    "/v1/account/users/:userId",
    requirePermission("platform.account.manage"),
    async (req, res) => {
      try {
        const updated = await updateManagedUser(
          sessionUserId(req),
          resolveAccountId(req),
          req.params?.userId,
          req.body
        );
        if (!updated) {
          res.status(404).send({ ok: false, error: "Managed user not found." });
          return;
        }
        res.status(200).send({ ok: true, id: updated.id });
      } catch (error) {
        res.status(400).send({ ok: false, error: error?.message || "Unable to update managed user." });
      }
    }
  );

  router.delete(
    "/v1/account/users/:userId/identity",
    requirePermission("platform.account.manage"),
    async (req, res) => {
      try {
        const removed = await removeManagedUserIdentity(
          sessionUserId(req),
          resolveAccountId(req),
          req.params?.userId
        );
        if (!removed) {
          res.status(404).send({ ok: false, error: "Managed user not found." });
          return;
        }
        res.status(200).send({
          ok: true,
          id: removed.id,
          removedBookIds: removed.removedBookIds || [],
        });
        await purgeIdentityBackupsForManagedUser(req, removed.id);
      } catch (error) {
        res.status(400).send({
          ok: false,
          error: error?.message || "Unable to remove managed identity.",
        });
      }
    }
  );

  router.get(
    "/v1/account/identities",
    requirePermission("platform.account.manage"),
    async (req, res) => {
      const data = await listManagedUsers(sessionUserId(req), resolveAccountId(req));
      if (!data) {
        res.status(404).send({ ok: false, error: "Workspace not found." });
        return;
      }
      res.status(200).send({
        ok: true,
        accountId: data.workspace.id,
        workspaceId: data.workspace.id,
        identities: data.users,
      });
    }
  );

  router.post(
    "/v1/account/identities",
    requirePermission("platform.account.manage"),
    async (req, res) => {
      try {
        const created = await createManagedUser(sessionUserId(req), resolveAccountId(req), req.body);
        if (!created) {
          res.status(404).send({ ok: false, error: "Workspace not found." });
          return;
        }
        res.status(201).send({
          ok: true,
          id: created.id,
          user: created,
        });
      } catch (error) {
        res.status(400).send({ ok: false, error: error?.message || "Unable to create identity." });
      }
    }
  );

  router.patch(
    "/v1/account/identities/:identityId",
    requirePermission("platform.account.manage"),
    async (req, res) => {
      try {
        const updated = await updateManagedUser(
          sessionUserId(req),
          resolveAccountId(req),
          req.params?.identityId,
          req.body
        );
        if (!updated) {
          res.status(404).send({ ok: false, error: "Identity not found." });
          return;
        }
        res.status(200).send({ ok: true, id: updated.id });
      } catch (error) {
        res.status(400).send({ ok: false, error: error?.message || "Unable to update identity." });
      }
    }
  );

  router.post(
    "/v1/account/identity-backups",
    requirePermission("platform.account.manage"),
    async (req, res) => {
      if (!identityBackupsEnabled()) {
        res.status(404).send({
          ok: false,
          error: "Identity backup recovery is not enabled for this environment.",
          code: "IDENTITY_BACKUPS_DISABLED",
        });
        return;
      }

      try {
        const parsed = validateEncryptedIdentityBackupEnvelope(req.body || {});
        const resolved = await resolveManagedUserForAccount(req, parsed.managedUserId);
        if (!resolved) {
          res.status(404).send({ ok: false, error: "Workspace not found." });
          return;
        }
        if (!resolved.managedUser) {
          res.status(404).send({
            ok: false,
            error: "Managed identity not found.",
            code: "MANAGED_IDENTITY_NOT_FOUND",
          });
          return;
        }

        const envelopeBytes = Buffer.byteLength(
          JSON.stringify(parsed.envelope),
          "utf8"
        );
        if (envelopeBytes > IDENTITY_BACKUP_MAX_ENVELOPE_BYTES) {
          res.status(400).send({
            ok: false,
            code: "IDENTITY_BACKUP_TOO_LARGE",
            error: "Encrypted backup envelope exceeds the maximum allowed size.",
          });
          return;
        }

        const accountId = resolved.accountId;
        const managedUser = resolved.managedUser;
        const managedProfileId = trim(managedUser.profileId);
        const managedIdentityPublicKey = trim(managedUser.identityPublicKey);
        const managedIdentityKeyFingerprint =
          trim(managedUser.identityKeyFingerprint) ||
          hashIdentityPublicKey(managedIdentityPublicKey);
        const envelopeIdentityFingerprint =
          trim(parsed.envelopeMeta.identityKeyFingerprint) ||
          hashIdentityPublicKey(parsed.envelopeMeta.identityPublicKey);
        if (trim(parsed.envelopeMeta.accountId) !== accountId) {
          res.status(400).send({
            ok: false,
            code: "IDENTITY_BACKUP_ACCOUNT_MISMATCH",
            error: "Backup envelope accountId does not match the authenticated account.",
          });
          return;
        }
        if (trim(parsed.envelopeMeta.managedUserId) !== trim(managedUser.id)) {
          res.status(400).send({
            ok: false,
            code: "IDENTITY_BACKUP_MANAGED_USER_MISMATCH",
            error:
              "Backup envelope managedUserId does not match the requested identity.",
          });
          return;
        }
        if (
          managedProfileId !== trim(parsed.envelopeMeta.profileId) ||
          managedIdentityPublicKey !== trim(parsed.envelopeMeta.identityPublicKey) ||
          managedIdentityKeyFingerprint !== envelopeIdentityFingerprint
        ) {
          res.status(400).send({
            ok: false,
            code: "IDENTITY_BACKUP_BINDING_MISMATCH",
            error:
              "Encrypted backup envelope identity binding does not match the account identity record.",
          });
          return;
        }

        const aad = parsed.envelopeMeta.crypto?.aad || {};
        if (
          trim(aad.accountId) !== accountId ||
          trim(aad.managedUserId) !== trim(managedUser.id) ||
          trim(aad.profileId) !== managedProfileId ||
          trim(aad.identityKeyFingerprint) !== managedIdentityKeyFingerprint ||
          trim(aad.format) !== IDENTITY_BACKUP_FORMAT ||
          trim(aad.version) !== IDENTITY_BACKUP_VERSION
        ) {
          res.status(400).send({
            ok: false,
            code: "IDENTITY_BACKUP_AAD_MISMATCH",
            error: "Encrypted backup AAD does not match expected identity/account scope.",
          });
          return;
        }

        const result = await identityBackupRepo.createOrReplayByNonce({
          accountId,
          managedUserId: trim(managedUser.id),
          backupNonce: parsed.backupNonce,
          profileId: managedProfileId,
          identityKeyFingerprint: managedIdentityKeyFingerprint,
          envelope: parsed.envelope,
        });
        if (!result.replayed) {
          await identityBackupRepo.pruneToLatestN(accountId, trim(managedUser.id), 5);
        }

        res.status(200).send({
          ok: true,
          backup: result.backup,
        });
      } catch (error) {
        if (trim(error?.code) === "BACKUP_NONCE_CONFLICT") {
          res.status(409).send({
            ok: false,
            code: "IDENTITY_BACKUP_NONCE_CONFLICT",
            error: error.message,
          });
          return;
        }
        res.status(400).send({
          ok: false,
          code: trim(error?.code) || "IDENTITY_BACKUP_INVALID_REQUEST",
          error: error?.message || "Unable to store encrypted identity backup.",
        });
      }
    }
  );

  router.get(
    "/v1/account/identity-backups",
    requirePermission("platform.account.manage"),
    async (req, res) => {
      if (!identityBackupsEnabled()) {
        res.status(404).send({
          ok: false,
          error: "Identity backup recovery is not enabled for this environment.",
          code: "IDENTITY_BACKUPS_DISABLED",
        });
        return;
      }

      const managedUserId = trim(req.query?.managedUserId);
      if (!managedUserId) {
        res.status(400).send({
          ok: false,
          code: "MANAGED_USER_ID_REQUIRED",
          error: "managedUserId query parameter is required.",
        });
        return;
      }

      const resolved = await resolveManagedUserForAccount(req, managedUserId);
      if (!resolved) {
        res.status(404).send({ ok: false, error: "Workspace not found." });
        return;
      }
      if (!resolved.managedUser) {
        res.status(404).send({
          ok: false,
          error: "Managed identity not found.",
          code: "MANAGED_IDENTITY_NOT_FOUND",
        });
        return;
      }

      const backups = await identityBackupRepo.listByManagedUser(
        resolved.accountId,
        managedUserId
      );
      res.status(200).send({
        ok: true,
        managedUserId,
        backups,
      });
    }
  );

  router.get(
    "/v1/account/identity-backups/latest",
    requirePermission("platform.account.manage"),
    async (req, res) => {
      if (!identityBackupsEnabled()) {
        res.status(404).send({
          ok: false,
          error: "Identity backup recovery is not enabled for this environment.",
          code: "IDENTITY_BACKUPS_DISABLED",
        });
        return;
      }

      const managedUserId = trim(req.query?.managedUserId);
      if (!managedUserId) {
        res.status(400).send({
          ok: false,
          code: "MANAGED_USER_ID_REQUIRED",
          error: "managedUserId query parameter is required.",
        });
        return;
      }

      const resolved = await resolveManagedUserForAccount(req, managedUserId);
      if (!resolved) {
        res.status(404).send({ ok: false, error: "Workspace not found." });
        return;
      }
      if (!resolved.managedUser) {
        res.status(404).send({
          ok: false,
          error: "Managed identity not found.",
          code: "MANAGED_IDENTITY_NOT_FOUND",
        });
        return;
      }

      const latest = await identityBackupRepo.getLatestByManagedUser(
        resolved.accountId,
        managedUserId
      );
      if (!latest) {
        res.status(404).send({
          ok: false,
          code: "IDENTITY_BACKUP_NOT_FOUND",
          error: "No recovery backup found for this identity.",
        });
        return;
      }

      res.status(200).send({
        ok: true,
        managedUserId,
        backup: latest,
      });
    }
  );

  router.delete(
    "/v1/account/identities",
    requirePermission("platform.account.manage"),
    async (req, res) => {
      try {
        const removed = await resetManagedIdentityData(
          sessionUserId(req),
          resolveAccountId(req)
        );
        if (!removed) {
          res.status(404).send({ ok: false, error: "Workspace not found." });
          return;
        }
        res.status(200).send({
          ok: true,
          removedManagedUsers: removed.removedManagedUsers || 0,
          removedBooks: removed.removedBooks || 0,
        });
        await purgeIdentityBackupsForAccount(req);
      } catch (error) {
        res.status(400).send({
          ok: false,
          error: error?.message || "Unable to reset account identities.",
        });
      }
    }
  );

  router.delete(
    "/v1/account/identities/:identityId",
    requirePermission("platform.account.manage"),
    async (req, res) => {
      try {
        const removed = await removeManagedUserIdentity(
          sessionUserId(req),
          resolveAccountId(req),
          req.params?.identityId
        );
        if (!removed) {
          res.status(404).send({ ok: false, error: "Identity not found." });
          return;
        }
        res.status(200).send({
          ok: true,
          id: removed.id,
          removedBookIds: removed.removedBookIds || [],
        });
        await purgeIdentityBackupsForManagedUser(req, removed.id);
      } catch (error) {
        res.status(400).send({
          ok: false,
          error: error?.message || "Unable to remove identity.",
        });
      }
    }
  );

  router.get("/v1/account/books", requirePermission("platform.account.manage"), async (req, res) => {
    const data = await listBooks(sessionUserId(req), resolveAccountId(req));
    if (!data) {
      res.status(404).send({ ok: false, error: "Workspace not found." });
      return;
    }
    res.status(200).send({
      ok: true,
      accountId: data.workspace.id,
      workspaceId: data.workspace.id,
      books: data.books,
    });
  });

  router.post("/v1/account/books", requirePermission("platform.account.manage"), async (req, res) => {
    try {
      const created = await createBook(sessionUserId(req), resolveAccountId(req), req.body);
      if (!created) {
        res.status(404).send({ ok: false, error: "Workspace not found." });
        return;
      }
      res.status(201).send({
        ok: true,
        id: created.id,
      });
    } catch (error) {
      res.status(400).send({ ok: false, error: error?.message || "Unable to create book." });
    }
  });

  router.patch(
    "/v1/account/books/:bookId",
    requirePermission("platform.account.manage"),
    async (req, res) => {
      try {
        const updated = await updateBook(
          sessionUserId(req),
          resolveAccountId(req),
          req.params?.bookId,
          req.body
        );
        if (!updated) {
          res.status(404).send({ ok: false, error: "Book not found." });
          return;
        }
        res.status(200).send({ ok: true, id: updated.id });
      } catch (error) {
        res.status(400).send({ ok: false, error: error?.message || "Unable to update book." });
      }
    }
  );

  router.delete(
    "/v1/account/books/:bookId",
    requirePermission("platform.account.manage"),
    async (req, res) => {
      try {
        const removed = await removeBook(
          sessionUserId(req),
          resolveAccountId(req),
          req.params?.bookId
        );
        if (!removed) {
          res.status(404).send({ ok: false, error: "Book not found." });
          return;
        }
        res.status(200).send({
          ok: true,
          id: removed.id,
          managedUserId: removed.managedUserId || null,
          collectionId: removed.collectionId || null,
        });
      } catch (error) {
        res.status(400).send({
          ok: false,
          error: error?.message || "Unable to remove book.",
        });
      }
    }
  );

  router.get(
    "/v1/account/pixbooks",
    requirePermission("platform.account.manage"),
    async (req, res) => {
      const data = await listBooks(sessionUserId(req), resolveAccountId(req));
      if (!data) {
        res.status(404).send({ ok: false, error: "Workspace not found." });
        return;
      }
      res.status(200).send({
        ok: true,
        accountId: data.workspace.id,
        workspaceId: data.workspace.id,
        pixbooks: data.books,
      });
    }
  );

  router.post(
    "/v1/account/pixbooks",
    requirePermission("platform.account.manage"),
    async (req, res) => {
      try {
        const created = await createBook(sessionUserId(req), resolveAccountId(req), req.body);
        if (!created) {
          res.status(404).send({ ok: false, error: "Workspace not found." });
          return;
        }
        res.status(201).send({
          ok: true,
          id: created.id,
        });
      } catch (error) {
        res.status(400).send({ ok: false, error: error?.message || "Unable to create pixbook." });
      }
    }
  );

  router.patch(
    "/v1/account/pixbooks/:pixbookId",
    requirePermission("platform.account.manage"),
    async (req, res) => {
      try {
        const updated = await updateBook(
          sessionUserId(req),
          resolveAccountId(req),
          req.params?.pixbookId,
          req.body
        );
        if (!updated) {
          res.status(404).send({ ok: false, error: "Pixbook not found." });
          return;
        }
        res.status(200).send({ ok: true, id: updated.id });
      } catch (error) {
        res.status(400).send({ ok: false, error: error?.message || "Unable to update pixbook." });
      }
    }
  );

  router.delete(
    "/v1/account/pixbooks/:pixbookId",
    requirePermission("platform.account.manage"),
    async (req, res) => {
      try {
        const removed = await removeBook(
          sessionUserId(req),
          resolveAccountId(req),
          req.params?.pixbookId
        );
        if (!removed) {
          res.status(404).send({ ok: false, error: "Pixbook not found." });
          return;
        }
        res.status(200).send({
          ok: true,
          id: removed.id,
          managedUserId: removed.managedUserId || null,
          collectionId: removed.collectionId || null,
        });
      } catch (error) {
        res.status(400).send({
          ok: false,
          error: error?.message || "Unable to remove pixbook.",
        });
      }
    }
  );

  router.get("/v1/account/pixbook", requireSession, async (req, res) => {
    applyLegacyDeprecationHeaders(res);
    try {
      await upsertAuthUserShadow(req.platformSession);
      await ensureWorkspaceForUser(req.platformSession);
    } catch (error) {
      console.error("[account] ensure pixbook workspace failed:", error);
    }

    const profileBinding = resolveProfileBinding(req);
    const requestedBookId = resolveBookId(req);
    const requestedCollectionId = resolveCollectionId(req);
    const isExplicitBookLookup = Boolean(requestedBookId);
    if (!profileBinding.isBound && !isExplicitBookLookup) {
      res.status(400).send({
        ok: false,
        error: "profileId and identityPublicKey are required for pixbook profile resolution.",
        code: "PIXBOOK_PROFILE_BINDING_REQUIRED",
      });
      return;
    }

    try {
      const resolved = requestedBookId
        ? await getBookForWorkspace(sessionUserId(req), resolveAccountId(req), requestedBookId)
        : await ensurePersonalPixbook(
            sessionUserId(req),
            resolveAccountId(req),
            {
              displayName:
                profileBinding.profileDisplayName ||
                req.platformSession?.user?.name ||
                req.platformSession?.user?.email ||
                "My Pixbook",
              email: req.platformSession?.user?.email || "",
            },
            profileBinding,
            {
              collectionId: requestedCollectionId,
              createIfMissing: false,
            }
          );

      if (!resolved) {
        res.status(404).send({
          ok: false,
          error:
            "No account pixbook exists for this identity. Save identity to account first.",
          code: "PIXBOOK_NOT_SAVED_TO_ACCOUNT",
        });
        return;
      }

      if (profileBinding.isBound) {
        const expectedUserKey = derivePersonalPixbookUserKey(
          sessionUserId(req),
          profileBinding
        );
        const matchesIdentityBinding =
          String(resolved.managedUser.profileId || "") === profileBinding.profileId &&
          String(resolved.managedUser.identityKeyFingerprint || "") ===
            profileBinding.identityKeyFingerprint;
        if (resolved.managedUser.userKey !== expectedUserKey && !matchesIdentityBinding) {
          res.status(409).send({
            ok: false,
            code: "PIXBOOK_BOOK_PROFILE_MISMATCH",
            error:
              "Selected book belongs to a different profile identity. Load that profile first.",
          });
          return;
        }
      }
      if (String(resolved.book.collectionId || "").trim() !== requestedCollectionId) {
        res.status(409).send({
          ok: false,
          code: "PIXBOOK_BOOK_COLLECTION_MISMATCH",
          error:
            "Selected book belongs to a different collection. Switch collection before opening this pixbook.",
        });
        return;
      }

      const snapshot = await getLegacyPixbookSnapshot({
        req,
        userId: sessionUserId(req),
        accountId: resolved.workspace.id,
        bookId: resolved.book.id,
      });

      res.status(200).send({
        ok: true,
        ...asAccountAliasPayload(resolved.workspace.id),
        managedUser: resolved.managedUser,
        book: resolved.book,
        snapshot,
      });
    } catch (error) {
      console.error("[account] pixbook resolve failed:", error);
      res.status(500).send({
        ok: false,
        error: "Unable to resolve pixbook.",
      });
    }
  });

  router.put("/v1/account/pixbook/snapshot", requireSession, async (req, res) => {
    applyLegacyDeprecationHeaders(res);
    try {
      await upsertAuthUserShadow(req.platformSession);
      await ensureWorkspaceForUser(req.platformSession);
    } catch (error) {
      console.error("[account] ensure pixbook workspace failed:", error);
    }

    const profileBinding = resolveProfileBinding(req);
    if (!profileBinding.isBound) {
      res.status(400).send({
        ok: false,
        error: "profileId and identityPublicKey are required to save cloud pixbook ledger state.",
        code: "PIXBOOK_PROFILE_BINDING_REQUIRED",
      });
      return;
    }

    const requestedBookId = resolveBookId(req);
    const requestedCollectionId = resolveCollectionId(req);

    let resolved = null;
    if (requestedBookId) {
      const byBookId = await getBookForWorkspace(
        sessionUserId(req),
        resolveAccountId(req),
        requestedBookId
      );
      if (!byBookId) {
        res.status(404).send({ ok: false, error: "Book not found." });
        return;
      }

      const expectedUserKey = derivePersonalPixbookUserKey(
        sessionUserId(req),
        profileBinding
      );
      const matchesIdentityBinding =
        String(byBookId.managedUser.profileId || "") === profileBinding.profileId &&
        String(byBookId.managedUser.identityKeyFingerprint || "") ===
          profileBinding.identityKeyFingerprint;
      if (byBookId.managedUser.userKey !== expectedUserKey && !matchesIdentityBinding) {
        res.status(409).send({
          ok: false,
          code: "PIXBOOK_BOOK_PROFILE_MISMATCH",
          error:
            "Selected book belongs to a different profile identity. Load that profile first.",
        });
        return;
      }
      if (String(byBookId.book.collectionId || "").trim() !== requestedCollectionId) {
        res.status(409).send({
          ok: false,
          code: "PIXBOOK_BOOK_COLLECTION_MISMATCH",
          error:
            "Selected book belongs to a different collection. Switch collection before saving.",
        });
        return;
      }
      resolved = byBookId;
    } else {
        resolved = await ensurePersonalPixbook(
          sessionUserId(req),
          resolveAccountId(req),
          {
            displayName:
            profileBinding.profileDisplayName ||
            req.platformSession?.user?.name ||
            req.platformSession?.user?.email ||
            "My Pixbook",
            email: req.platformSession?.user?.email || "",
          },
          profileBinding,
          {
            collectionId: requestedCollectionId,
            createIfMissing: false,
          }
        );
      }

      if (!resolved) {
        res.status(404).send({
          ok: false,
          error:
            "No account pixbook exists for this identity. Save identity to account first.",
          code: "PIXBOOK_NOT_SAVED_TO_ACCOUNT",
        });
        return;
      }

    try {
      const saved = await saveLegacyPixbookSnapshot({
        req,
        userId: sessionUserId(req),
        accountId: resolved.workspace.id,
        bookId: resolved.book.id,
        payload: req.body?.payload,
        ledgerHead: req.body?.ledgerHead,
        expectedVersion: req.body?.expectedVersion,
        expectedLedgerHead: req.body?.expectedLedgerHead,
        signingIdentityId: req?.headers?.["x-signing-identity-id"],
      });

      res.status(200).send({
        ok: true,
        ...asAccountAliasPayload(resolved.workspace.id),
        managedUser: resolved.managedUser,
        book: {
          ...resolved.book,
          currentVersion: saved?.snapshot?.version ?? resolved.book.currentVersion,
        },
        snapshot: saved?.snapshot || null,
      });
    } catch (error) {
      if (error?.code === "BOOK_SNAPSHOT_CONFLICT") {
        res.status(409).send({
          ok: false,
          error: error.message,
          code: error.code,
          conflict: error.details || null,
        });
        return;
      }
      if (error?.code === "IDEMPOTENCY_CONFLICT") {
        res.status(409).send({
          ok: false,
          error: error.message,
          code: error.code,
        });
        return;
      }
      if (error?.statusCode === 404) {
        res.status(404).send({
          ok: false,
          error: error.message || "Book not found.",
          code: error.code || "BOOK_NOT_FOUND",
        });
        return;
      }
      if (error?.statusCode === 401) {
        res.status(401).send({
          ok: false,
          error: error.message || "Unauthorized.",
          code: error.code || "UNAUTHORIZED",
        });
        return;
      }
      if (
        String(error?.message || "").includes(
          "Pixbook receipt storage is not configured"
        )
      ) {
        res.status(503).send({
          ok: false,
          error: error.message,
          code: "PIXBOOK_LEDGER_STORAGE_UNAVAILABLE",
        });
        return;
      }
      res.status(400).send({
        ok: false,
        error: error?.message || "Unable to save pixbook cloud state.",
        code: error?.code || "PIXBOOK_SAVE_FAILED",
      });
    }
  });
}
