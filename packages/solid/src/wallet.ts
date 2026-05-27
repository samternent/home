import type { SerializedIdentity } from "@ternent/identity";
import { enforceSolidConcordAccess } from "./access.js";
import { createSolidIdentityCache } from "./cache.js";
import {
  bootstrapSolidConcordProfile,
  createSolidConcordPaths,
  discoverSolidConcordResources,
} from "./profile.js";
import { createSolidJsonResource } from "./resource.js";
import {
  createSolidMnemonicIdentity,
  createSolidIdentity,
  createSolidMnemonicSecret,
  createSolidWalletBackup,
  isSolidMnemonicSecret,
  isSolidWalletBackup,
  restoreSolidIdentityFromMnemonicSecret,
  restoreSolidIdentityFromBackup,
} from "./identity.js";
import type {
  CreateSolidMnemonicStorageOptions,
  CreateSolidWalletStorageOptions,
  ProvisionSolidIdentityOptions,
  ProvisionSolidIdentityResult,
  ResolveSolidIdentityInput,
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
        throw new Error("Solid mnemonic payload must be a ternent-solid-mnemonic secret object.");
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
        throw new Error("Solid wallet payload must be a ternent-solid-wallet backup object.");
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
  } catch {
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
  const cachedIdentity = await loadIdentityFromCache(input.cache);
  if (cachedIdentity) {
    return cachedIdentity;
  }

  if (input.identity) {
    await saveIdentityToCache(input.cache, input.identity);
    return input.identity;
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

  if (input.mnemonicSecret) {
    const identity = await restoreSolidIdentityFromMnemonicSecret({
      secret: input.mnemonicSecret,
      expectedWebId: input.expectedWebId,
    });
    await saveIdentityToCache(input.cache, identity);
    return identity;
  }

  if (input.mnemonicUrl) {
    const mnemonicStorage = createSolidMnemonicStorage(session, input.mnemonicUrl, {
      contentType: input.mnemonicContentType,
    });
    const secret = await mnemonicStorage.load();
    if (!secret) {
      throw new Error(`No Solid mnemonic secret found at ${input.mnemonicUrl}.`);
    }
    const identity = await restoreSolidIdentityFromMnemonicSecret({
      secret,
      expectedWebId: input.expectedWebId,
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
    if (!backup) {
      throw new Error(`No Solid wallet backup found at ${input.walletUrl}.`);
    }
    const identity = await restoreSolidIdentityFromBackup({
      backup,
      passphrase: requireWalletPassphrase(input.walletPassphrase),
      expectedWebId: input.expectedWebId,
    });
    await saveIdentityToCache(input.cache, identity);
    return identity;
  }

  throw new Error(
    "Solid identity configuration is required. Provide one or more fallback sources: identity, mnemonic, mnemonicSecret, mnemonicUrl, walletBackup, or walletUrl with walletPassphrase.",
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
    profileEnabled && (shouldBootstrapProfile || !input.mnemonicUrl || !input.walletUrl)
      ? await createSolidConcordPaths(input.session, input.profile)
      : null;
  const mnemonicUrl =
    input.mnemonicUrl ??
    discoveredResources?.mnemonicUrl ??
    (shouldBootstrapProfile ? defaultPaths?.mnemonicUrl : undefined);
  const walletUrl =
    input.walletUrl ??
    discoveredResources?.walletUrl ??
    (shouldBootstrapProfile ? defaultPaths?.walletUrl : undefined);
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
  const walletBackup = await createSolidWalletBackup({
    identity,
    passphrase: input.walletPassphrase ?? mnemonic,
    webId,
    createdAt: input.createdAt,
  });

  if (mnemonicUrl) {
    await createSolidMnemonicStorage(input.session, mnemonicUrl, {
      contentType: input.mnemonicContentType,
    }).save(mnemonicSecret);
  }

  if (walletUrl) {
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
          mnemonicUrl: mnemonicUrl ?? null,
          walletUrl: walletUrl ?? null,
          identity,
          createdAt: input.createdAt,
        })
      : (discoveredResources ?? undefined);
  const accessReport =
    resources && profileEnabled
      ? await enforceSolidConcordAccess(resources, input.profile?.accessValidation ?? "strict")
      : undefined;

  return {
    identity,
    mnemonic,
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
