import { initArmour } from "@ternent/armour";
import { createConcordApp } from "@ternent/concord/browser";
import { enforceSolidConcordAccess } from "./access.js";
import type { CreateSolidConcordAppResult } from "./types.js";
import {
  bootstrapSolidConcordProfile,
  createSolidConcordPaths,
  discoverSolidConcordResources,
} from "./profile.js";
import { createSolidStorage } from "./storage.js";
import { getSolidWebId } from "./identity.js";
import { createDefaultSolidIdentityCache, resolveSolidIdentity } from "./wallet.js";
import type { CreateSolidConcordAppOptions } from "./types.js";

export async function createSolidConcordApp(
  input: CreateSolidConcordAppOptions,
): Promise<CreateSolidConcordAppResult> {
  const webId = getSolidWebId(input.session);
  const profileUrl = (() => {
    const url = new URL(webId);
    url.hash = "";
    return url.toString();
  })();
  const profileEnabled = input.profile?.enabled === true;
  const shouldBootstrapProfile = profileEnabled && input.profile?.bootstrap === true;
  const discoveredResources =
    profileEnabled && input.profile?.discover !== false
      ? await discoverSolidConcordResources(input.session, input.profile)
      : null;
  const defaultPaths =
    profileEnabled && (!input.ledgerUrl || shouldBootstrapProfile)
      ? await createSolidConcordPaths(input.session, input.profile)
      : null;
  const encryptedIdentityUrl =
    input.encryptedIdentityUrl ??
    input.identityUrl ??
    discoveredResources?.identityUrl ??
    defaultPaths?.identityUrl ??
    undefined;
  const walletUrl = input.walletUrl ?? discoveredResources?.walletUrl ?? undefined;
  const ledgerUrl =
    input.ledgerUrl ??
    discoveredResources?.ledgerUrl ??
    defaultPaths?.ledgerUrl ??
    null;

  if (!ledgerUrl) {
    throw new Error(
      "Solid ledgerUrl is required. Provide ledgerUrl directly or enable Solid profile discovery/bootstrap.",
    );
  }

  const cache = input.cache
    ? createDefaultSolidIdentityCache(input.session, input.cache)
    : undefined;
  const identity = await resolveSolidIdentity(input.session, {
    cache,
    unlocker: input.unlocker,
    identity: input.identity,
    encryptedIdentity: input.encryptedIdentity,
    encryptedIdentityUrl,
    encryptedIdentityContentType: input.encryptedIdentityContentType ?? input.identityContentType,
    mnemonic: input.mnemonic,
    mnemonicPassphrase: input.mnemonicPassphrase,
    walletBackup: input.walletBackup,
    walletUrl,
    walletPassphrase: input.walletPassphrase,
    walletContentType: input.walletContentType,
    createdAt: input.createdAt,
    expectedWebId: input.expectedWebId ?? webId,
  });

  if (input.encryption) {
    await initArmour();
  }

  const storage = createSolidStorage(
    input.session,
    ledgerUrl,
    input.storageOptions,
  );

  const app = await createConcordApp({
    identity,
    storage,
    plugins: input.plugins,
    now: input.now,
    protocol: input.protocol,
    seal: input.seal,
    armour: input.armour,
    ledger: input.ledger,
    policy: input.policy,
  });

  const resources =
    shouldBootstrapProfile && profileEnabled
      ? await bootstrapSolidConcordProfile({
          session: input.session,
          ...input.profile,
          identityUrl: encryptedIdentityUrl ?? null,
          walletUrl: walletUrl ?? null,
          ledgerUrl,
          identity,
          createdAt: input.createdAt,
        })
      : profileEnabled
        ? {
            ...(discoveredResources ?? {
              webId,
              profileUrl: defaultPaths?.profileUrl ?? profileUrl,
              podRoot: defaultPaths?.podRoot ?? null,
              settingsRootUrl: defaultPaths?.settingsRootUrl ?? null,
              appRootUrl: defaultPaths?.appRootUrl ?? null,
              systemRootUrl: defaultPaths?.systemRootUrl ?? null,
              systemPrivateRootUrl: defaultPaths?.systemPrivateRootUrl ?? null,
              workspaceRootUrl: defaultPaths?.workspaceRootUrl ?? null,
              workspacePrivateRootUrl: defaultPaths?.workspacePrivateRootUrl ?? null,
              workspaceSharedRootUrl: defaultPaths?.workspaceSharedRootUrl ?? null,
              workspacePublicRootUrl: defaultPaths?.workspacePublicRootUrl ?? null,
              privateRootUrl: defaultPaths?.privateRootUrl ?? null,
              publicRootUrl: defaultPaths?.publicRootUrl ?? null,
              preferencesUrl: defaultPaths?.preferencesUrl ?? null,
              publicTypeIndexUrl: defaultPaths?.publicTypeIndexUrl ?? null,
              privateTypeIndexUrl: defaultPaths?.privateTypeIndexUrl ?? null,
              identityUrl: null,
              mnemonicUrl: null,
              walletUrl: null,
              ledgerUrl: null,
              peopleUrl: null,
              verificationUrl: input.profile?.verificationUrl ?? null,
              seeAlso: [],
            }),
            identityUrl:
              encryptedIdentityUrl ?? discoveredResources?.identityUrl ?? null,
            walletUrl: walletUrl ?? discoveredResources?.walletUrl ?? null,
            ledgerUrl,
          }
        : undefined;
  const accessReport =
    resources && profileEnabled
      ? await enforceSolidConcordAccess(
          resources,
          input.profile?.accessValidation ?? "strict",
        )
      : undefined;

  return {
    app,
    identity,
    storage,
    resources,
    accessReport,
  };
}
