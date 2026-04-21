import type { SerializedIdentity } from "@ternent/identity";
import {
  enforceSolidConcordAccess,
  enforceSolidPrivateResourceWrite,
} from "./access.js";
import { createSolidIdentityCache } from "./cache.js";
import {
  bootstrapSolidConcordProfile,
  createSolidConcordPaths,
  discoverSolidConcordResources,
} from "./profile.js";
import { createSolidJsonResource } from "./resource.js";
import {
  createSolidEncryptedIdentityBlob,
  createSolidMnemonicIdentity,
  createSolidIdentity,
  createSolidMnemonicSecret,
  createSolidWalletBackup,
  isSolidEncryptedIdentityBlob,
  isSolidMnemonicSecret,
  isSolidWalletBackup,
  resolveSolidIdentityUnlocker,
  restoreSolidIdentityFromEncryptedBlob,
  restoreSolidIdentityFromBackup,
} from "./identity.js";
import type {
  CreateSolidEncryptedIdentityStorageOptions,
  CreateSolidMnemonicStorageOptions,
  CreateSolidWalletStorageOptions,
  ProvisionSolidIdentityOptions,
  ProvisionSolidIdentityResult,
  ResolveSolidIdentityInput,
  SolidEncryptedIdentityBlob,
  SolidIdentityCacheLike,
  SolidMnemonicSecret,
  SolidSessionLike,
  SolidWalletBackup,
} from "./types.js";

export function createSolidMnemonicStorage(
  session: SolidSessionLike,
  url: string,
  options: CreateSolidMnemonicStorageOptions = {},
) {
  return createSolidJsonResource<SolidMnemonicSecret>({
    session,
    url,
    name: "solid-mnemonic",
    contentType: options.contentType,
    coerce(value) {
      if (!isSolidMnemonicSecret(value)) {
        throw new Error(
          "Solid mnemonic payload must be a ternent-solid-mnemonic secret object.",
        );
      }
      return value;
    },
  });
}

export function createSolidWalletStorage(
  session: SolidSessionLike,
  url: string,
  options: CreateSolidWalletStorageOptions = {},
) {
  return createSolidJsonResource<SolidWalletBackup>({
    session,
    url,
    name: "solid-wallet",
    contentType: options.contentType,
    coerce(value) {
      if (!isSolidWalletBackup(value)) {
        throw new Error(
          "Solid wallet payload must be a ternent-solid-wallet backup object.",
        );
      }
      return value;
    },
  });
}

export function createSolidEncryptedIdentityStorage(
  session: SolidSessionLike,
  url: string,
  options: CreateSolidEncryptedIdentityStorageOptions = {},
) {
  return createSolidJsonResource<SolidEncryptedIdentityBlob>({
    session,
    url,
    name: "solid-encrypted-identity",
    contentType: options.contentType,
    coerce(value) {
      if (!isSolidEncryptedIdentityBlob(value)) {
        throw new Error(
          "Solid identity payload must be a ternent-solid-encrypted-identity object.",
        );
      }
      return value;
    },
  });
}

function requireWalletPassphrase(value: string | undefined): string {
  const normalized = String(value || "");
  if (!normalized) {
    throw new Error(
      "walletPassphrase is required when restoring a Solid identity from walletBackup or walletUrl.",
    );
  }
  return normalized;
}

async function loadIdentityFromCache(
  cache: SolidIdentityCacheLike | undefined,
): Promise<SerializedIdentity | null> {
  if (!cache) {
    return null;
  }

  try {
    return await cache.load();
  } catch (error) {
    if (typeof console !== "undefined" && typeof console.warn === "function") {
      console.warn(
        `[ternent/solid] Identity cache load failed; clearing cache entry: ${String(error)}`,
      );
    }
    await cache.clear().catch(() => undefined);
    return null;
  }
}

async function saveIdentityToCache(
  cache: SolidIdentityCacheLike | undefined,
  identity: SerializedIdentity,
): Promise<void> {
  if (!cache) {
    return;
  }

  try {
    await cache.save(identity);
  } catch {
    return;
  }
}

export async function resolveSolidIdentity(
  session: SolidSessionLike,
  input: ResolveSolidIdentityInput,
): Promise<SerializedIdentity> {
  if (input.identity) {
    await saveIdentityToCache(input.cache, input.identity);
    return input.identity;
  }

  const unlocker = input.unlocker
    ? resolveSolidIdentityUnlocker(input.unlocker)
    : undefined;

  if (input.encryptedIdentity) {
    if (!unlocker) {
      throw new Error(
        "unlocker is required when restoring from an encrypted Solid identity blob.",
      );
    }
    const identity = await restoreSolidIdentityFromEncryptedBlob({
      blob: input.encryptedIdentity,
      unlocker,
      expectedWebId: input.expectedWebId,
      storage: "solid-resource",
    });
    await saveIdentityToCache(input.cache, identity);
    return identity;
  }

  if (input.mnemonic) {
    const identity = await createSolidIdentity({
      mnemonic: input.mnemonic,
      passphrase: input.mnemonicPassphrase,
      createdAt: input.createdAt,
    });
    await saveIdentityToCache(input.cache, identity);
    return identity;
  }

  if (input.walletBackup) {
    const identity = await restoreSolidIdentityFromBackup({
      backup: input.walletBackup,
      passphrase: requireWalletPassphrase(input.walletPassphrase),
      expectedWebId: input.expectedWebId,
    });
    await saveIdentityToCache(input.cache, identity);
    return identity;
  }

  if (input.walletUrl) {
    const walletStorage = createSolidWalletStorage(session, input.walletUrl, {
      contentType: input.walletContentType,
    });
    const backup = await walletStorage.load();
    if (backup) {
      const identity = await restoreSolidIdentityFromBackup({
        backup,
        passphrase: requireWalletPassphrase(input.walletPassphrase),
        expectedWebId: input.expectedWebId,
      });
      await saveIdentityToCache(input.cache, identity);
      return identity;
    }
  }

  if (input.encryptedIdentityUrl) {
    if (!unlocker) {
      throw new Error(
        "unlocker is required when restoring from encryptedIdentityUrl.",
      );
    }
    const encryptedStorage = createSolidEncryptedIdentityStorage(
      session,
      input.encryptedIdentityUrl,
      {
        contentType: input.encryptedIdentityContentType,
      },
    );
    const blob = await encryptedStorage.load();
    if (blob) {
      const identity = await restoreSolidIdentityFromEncryptedBlob({
        blob,
        unlocker,
        expectedWebId: input.expectedWebId,
        storage: "solid-resource",
        resourceUrl: input.encryptedIdentityUrl,
      });
      await saveIdentityToCache(input.cache, identity);
      return identity;
    }
  }

  if (input.identityUrl) {
    if (!unlocker) {
      throw new Error(
        "unlocker is required when restoring from identityUrl.",
      );
    }
    const encryptedStorage = createSolidEncryptedIdentityStorage(
      session,
      input.identityUrl,
      {
        contentType:
          input.identityContentType ?? input.encryptedIdentityContentType,
      },
    );
    const blob = await encryptedStorage.load();
    if (blob) {
      const identity = await restoreSolidIdentityFromEncryptedBlob({
        blob,
        unlocker,
        expectedWebId: input.expectedWebId,
        storage: "solid-resource",
        resourceUrl: input.identityUrl,
      });
      await saveIdentityToCache(input.cache, identity);
      return identity;
    }
  }

  const cachedIdentity = await loadIdentityFromCache(input.cache);
  if (cachedIdentity) {
    return cachedIdentity;
  }

  throw new Error(
    "Solid identity configuration is required. Provide one or more fallback sources: identity, encryptedIdentity, encryptedIdentityUrl (with unlocker), mnemonic, walletBackup, or walletUrl with walletPassphrase.",
  );
}

export async function provisionSolidIdentity(
  input: ProvisionSolidIdentityOptions,
): Promise<ProvisionSolidIdentityResult> {
  const webId = input.webId ?? input.session.info?.webId ?? null;
  const profileEnabled = input.profile?.enabled === true;
  const shouldBootstrapProfile = profileEnabled && input.profile?.bootstrap !== false;
  const discoveredResources =
    profileEnabled && input.profile?.discover !== false
      ? await discoverSolidConcordResources(input.session, input.profile)
      : null;
  const defaultPaths =
    profileEnabled &&
    (shouldBootstrapProfile || !input.identityUrl || !input.walletUrl)
      ? await createSolidConcordPaths(input.session, input.profile)
      : null;
  const shouldPersistWalletBackup =
    Boolean(String(input.walletPassphrase || "").trim()) || Boolean(input.walletUrl);
  const identityUrl =
    input.identityUrl ??
    discoveredResources?.identityUrl ??
    (shouldBootstrapProfile ? defaultPaths?.identityUrl : undefined);
  const walletUrl = shouldPersistWalletBackup
    ? input.walletUrl ??
      discoveredResources?.walletUrl ??
      (shouldBootstrapProfile ? defaultPaths?.walletUrl : undefined)
    : undefined;
  const { identity, mnemonic } = await createSolidMnemonicIdentity({
    words: input.words,
    passphrase: input.mnemonicPassphrase,
    createdAt: input.createdAt,
  });

  const mnemonicSecret = await createSolidMnemonicSecret({
    mnemonic,
    mnemonicPassphrase: input.mnemonicPassphrase,
    createdAt: input.createdAt,
    webId,
    identity,
  });

  const unlocker = resolveSolidIdentityUnlocker(input.unlocker);
  const encryptedIdentity = await createSolidEncryptedIdentityBlob({
    identity,
    unlocker,
    webId,
    createdAt: input.createdAt,
    storage: "solid-resource",
    resourceUrl: identityUrl,
  });

  if (identityUrl) {
    await enforceSolidPrivateResourceWrite(identityUrl, {
      privateRootUrl:
        defaultPaths?.privateRootUrl ?? discoveredResources?.privateRootUrl ?? null,
    });
    await createSolidEncryptedIdentityStorage(input.session, identityUrl, {
      contentType: input.identityContentType,
    }).save(encryptedIdentity);
  }

  let walletBackup: SolidWalletBackup | undefined;
  if (walletUrl) {
    const passphrase = requireWalletPassphrase(input.walletPassphrase);
    walletBackup = await createSolidWalletBackup({
      identity,
      passphrase,
      webId,
      createdAt: input.createdAt,
    });
    await enforceSolidPrivateResourceWrite(walletUrl, {
      privateRootUrl:
        defaultPaths?.privateRootUrl ?? discoveredResources?.privateRootUrl ?? null,
    });
    await createSolidWalletStorage(input.session, walletUrl, {
      contentType: input.walletContentType,
    }).save(walletBackup);
  }

  await saveIdentityToCache(input.cache, identity);

  const resources =
    shouldBootstrapProfile && profileEnabled
      ? await bootstrapSolidConcordProfile({
          session: input.session,
          ...input.profile,
          identityUrl: identityUrl ?? null,
          mnemonicUrl: null,
          walletUrl: walletUrl ?? null,
          identity,
          createdAt: input.createdAt,
        })
      : discoveredResources ?? undefined;
  const accessReport =
    resources && profileEnabled
      ? await enforceSolidConcordAccess(
          resources,
          input.profile?.accessValidation ?? "strict",
        )
      : undefined;

  return {
    identity,
    mnemonic,
    encryptedIdentity,
    mnemonicSecret,
    walletBackup,
    resources,
    accessReport,
  };
}

export function createDefaultSolidIdentityCache(
  session: SolidSessionLike,
  cache?: SolidIdentityCacheLike,
): SolidIdentityCacheLike {
  return cache ?? createSolidIdentityCache({ session });
}
