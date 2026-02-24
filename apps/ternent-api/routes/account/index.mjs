import { requireSession, upsertAuthUserShadow } from "../../services/auth/platform-auth.mjs";
import { requirePermission } from "../../services/auth/permissions.mjs";
import {
  BookSnapshotConflictError,
  createBook,
  createManagedUser,
  derivePersonalPixbookUserKey,
  ensurePersonalPixbook,
  ensureWorkspaceForUser,
  getBookForWorkspace,
  getLatestBookSnapshot,
  getWorkspaceSummary,
  listBooks,
  listManagedUsers,
  removeManagedUserIdentity,
  resetManagedIdentityData,
  removeBook,
  renameWorkspace,
  saveBookSnapshot,
  updateBook,
  updateManagedUser,
} from "../../services/account/platform-account-store-switch.mjs";
import {
  asAccountAliasPayload,
  resolveRequestedAccountId,
} from "../../services/account/account-schema-flags.mjs";

const DEFAULT_COLLECTION_ID = "primary";

function resolveAccountId(req) {
  return resolveRequestedAccountId(req);
}

function sessionUserId(req) {
  return String(req?.platformSession?.user?.id || "").trim();
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

      const snapshot = await getLatestBookSnapshot(
        resolved.book.id,
        resolved.workspace.id
      );

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
      const saved = await saveBookSnapshot(
        sessionUserId(req),
        resolved.workspace.id,
        resolved.book.id,
        {
          payload: req.body?.payload,
          ledgerHead: req.body?.ledgerHead,
          expectedVersion: req.body?.expectedVersion,
          expectedLedgerHead: req.body?.expectedLedgerHead,
        }
      );

      res.status(200).send({
        ok: true,
        ...asAccountAliasPayload(resolved.workspace.id),
        managedUser: resolved.managedUser,
        book: {
          ...resolved.book,
          currentVersion: saved?.version ?? resolved.book.currentVersion,
        },
        snapshot: saved,
      });
    } catch (error) {
      if (error instanceof BookSnapshotConflictError || error?.code === "BOOK_SNAPSHOT_CONFLICT") {
        res.status(409).send({
          ok: false,
          error: error.message,
          code: error.code,
          conflict: error.details || null,
        });
        return;
      }
      if (
        String(error?.message || "").includes(
          "Pixbook ledger storage is not configured"
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
      });
    }
  });
}
