import {
  addUrl,
  createContainerAt,
  createSolidDataset,
  createThing,
  getSolidDataset,
  getThing,
  getThingAll,
  getUrl,
  getUrlAll,
  removeAll,
  setThing,
  setUrl,
  solidDatasetAsTurtle,
} from "@inrupt/solid-client";
import type { SerializedIdentity } from "@ternent/identity";
import { createSolidJsonResource } from "./resource.js";
import { getSolidWebId } from "./identity.js";
import type {
  BootstrapSolidConcordProfileOptions,
  CreateSolidConcordPathsOptions,
  SolidConcordPaths,
  SolidConcordResources,
  SolidSessionLike,
  SolidVerificationDocument,
} from "./types.js";

const RDF_TYPE = "http://www.w3.org/1999/02/22-rdf-syntax-ns#type";
const RDFS_SEE_ALSO = "http://www.w3.org/2000/01/rdf-schema#seeAlso";
const FOAF_AGENT = "http://xmlns.com/foaf/0.1/Agent";
const PIM_STORAGE = "http://www.w3.org/ns/pim/space#storage";
const PIM_CONFIGURATION_FILE = "http://www.w3.org/ns/pim/space#ConfigurationFile";
const PIM_PREFERENCES_FILE = "http://www.w3.org/ns/pim/space#preferencesFile";
const SOLID_PUBLIC_TYPE_INDEX = "http://www.w3.org/ns/solid/terms#publicTypeIndex";
const SOLID_PRIVATE_TYPE_INDEX = "http://www.w3.org/ns/solid/terms#privateTypeIndex";
const SOLID_TYPE_INDEX = "http://www.w3.org/ns/solid/terms#TypeIndex";
const SOLID_TYPE_REGISTRATION = "http://www.w3.org/ns/solid/terms#TypeRegistration";
const SOLID_LISTED_DOCUMENT = "http://www.w3.org/ns/solid/terms#ListedDocument";
const SOLID_UNLISTED_DOCUMENT = "http://www.w3.org/ns/solid/terms#UnlistedDocument";
const SOLID_FOR_CLASS = "http://www.w3.org/ns/solid/terms#forClass";
const SOLID_INSTANCE = "http://www.w3.org/ns/solid/terms#instance";
const SOLID_INSTANCE_CONTAINER = "http://www.w3.org/ns/solid/terms#instanceContainer";

export const SOLID_CONCORD_MNEMONIC_CLASS = "urn:ternent:solid:concord:MnemonicSecret";
export const SOLID_CONCORD_WALLET_CLASS = "urn:ternent:solid:concord:WalletBackup";
export const SOLID_CONCORD_IDENTITY_CLASS =
  "urn:ternent:solid:concord:EncryptedIdentity";
export const SOLID_CONCORD_LEDGER_CLASS = "urn:ternent:solid:concord:Ledger";
export const SOLID_CONCORD_PEOPLE_CLASS = "urn:ternent:solid:concord:PeopleRegistry";
export const SOLID_CONCORD_VERIFICATION_CLASS =
  "urn:ternent:solid:concord:SealVerification";

function normalizeUrl(value: string): string {
  return new URL(value).toString();
}

function stripHash(value: string): string {
  const url = new URL(value);
  url.hash = "";
  return url.toString();
}

function normalizeAppPath(value?: string): string {
  const normalized = String(value || "concord").trim().replace(/^\/+|\/+$/g, "");
  return normalized ? `${normalized}/` : "concord/";
}

function getContainerUrls(resourceUrl: string): string[] {
  const url = new URL(resourceUrl);
  const segments = url.pathname.split("/").filter(Boolean);
  if (segments.length === 0) {
    return [];
  }

  segments.pop();
  const root = `${url.protocol}//${url.host}`;
  const urls: string[] = [];
  let currentPath = "/";

  for (const segment of segments) {
    currentPath = `${currentPath}${segment}/`;
    urls.push(new URL(currentPath, root).toString());
  }

  return urls;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getStatusCode(error: unknown): number {
  if (!isRecord(error)) {
    return NaN;
  }

  const response = isRecord(error.response) ? error.response : null;
  const cause = isRecord(error.cause) ? error.cause : null;

  return Number(
    error.statusCode ??
      error.status ??
      error.code ??
      response?.status ??
      cause?.status,
  );
}

function isMissingError(error: unknown): boolean {
  const status = getStatusCode(error);
  const message = String(error ?? "");
  return status === 404 || message.includes("404");
}

function isAlreadyExistsError(error: unknown): boolean {
  const status = getStatusCode(error);
  const message = String(error ?? "");
  return status === 409 || status === 412 || message.includes("409");
}

function ensureProfileThing(dataset: Awaited<ReturnType<typeof getSolidDataset>>, webId: string) {
  return getThing(dataset, webId) ?? createThing({ url: webId });
}

function ensureTypeIndexThing(
  dataset: Awaited<ReturnType<typeof getSolidDataset>> | ReturnType<typeof createSolidDataset>,
  url: string,
  listed: boolean,
) {
  let thing = getThing(dataset, url) ?? createThing({ url });
  thing = setUrl(thing, RDF_TYPE, SOLID_TYPE_INDEX);
  thing = addUrl(thing, RDF_TYPE, listed ? SOLID_LISTED_DOCUMENT : SOLID_UNLISTED_DOCUMENT);
  return thing;
}

function ensurePreferencesThing(
  dataset: Awaited<ReturnType<typeof getSolidDataset>> | ReturnType<typeof createSolidDataset>,
  url: string,
) {
  let thing = getThing(dataset, url) ?? createThing({ url });
  thing = setUrl(thing, RDF_TYPE, PIM_CONFIGURATION_FILE);
  return thing;
}

async function loadOptionalDataset(
  url: string,
  fetchImpl: typeof fetch,
) {
  try {
    return await getSolidDataset(url, {
      fetch: fetchImpl,
    });
  } catch (error) {
    if (isMissingError(error)) {
      return null;
    }
    throw error;
  }
}

async function saveDataset(
  url: string,
  dataset: ReturnType<typeof createSolidDataset> | Awaited<ReturnType<typeof getSolidDataset>>,
  fetchImpl: typeof fetch,
) {
  for (const containerUrl of getContainerUrls(url)) {
    try {
      await createContainerAt(containerUrl, {
        fetch: fetchImpl,
      });
    } catch (error) {
      if (isAlreadyExistsError(error)) {
        continue;
      }
      throw error;
    }
  }

  const body = await solidDatasetAsTurtle(dataset);
  const response = await fetchImpl(url, {
    method: "PUT",
    headers: {
      "Content-Type": "text/turtle",
    },
    body,
  });

  if (!response.ok) {
    throw new Error(
      `Failed to save Solid RDF resource to ${url}: ${response.status} ${response.statusText}`,
    );
  }
}

async function ensurePreferencesDocument(
  url: string,
  fetchImpl: typeof fetch,
) {
  const existing = await loadOptionalDataset(url, fetchImpl);
  const dataset = existing ?? createSolidDataset();
  const thing = ensurePreferencesThing(dataset, url);
  await saveDataset(url, setThing(dataset, thing), fetchImpl);
}

async function ensureTypeIndexDocument(
  url: string,
  listed: boolean,
  fetchImpl: typeof fetch,
) {
  const existing = await loadOptionalDataset(url, fetchImpl);
  const dataset = existing ?? createSolidDataset();
  const thing = ensureTypeIndexThing(dataset, url, listed);
  await saveDataset(url, setThing(dataset, thing), fetchImpl);
}

function getRegistrationUrl(indexUrl: string, id: string): string {
  return new URL(`#${id}`, indexUrl).toString();
}

function getRegisteredInstanceUrl(
  dataset: Awaited<ReturnType<typeof getSolidDataset>> | null,
  classUrl: string,
): string | null {
  if (!dataset) {
    return null;
  }

  for (const thing of getThingAll(dataset)) {
    if (!getUrlAll(thing, SOLID_FOR_CLASS).includes(classUrl)) {
      continue;
    }

    const resourceUrl =
      getUrl(thing, SOLID_INSTANCE) ?? getUrl(thing, SOLID_INSTANCE_CONTAINER) ?? null;
    if (resourceUrl) {
      return normalizeUrl(resourceUrl);
    }
  }

  return null;
}

async function upsertTypeRegistration(input: {
  indexUrl: string;
  fetchImpl: typeof fetch;
  registrationId: string;
  classUrl: string;
  instanceUrl: string;
  listed: boolean;
}) {
  const dataset = (await loadOptionalDataset(input.indexUrl, input.fetchImpl)) ?? createSolidDataset();
  const rootThing = ensureTypeIndexThing(dataset, input.indexUrl, input.listed);
  const registrationUrl = getRegistrationUrl(input.indexUrl, input.registrationId);
  let registration = getThing(dataset, registrationUrl) ?? createThing({ url: registrationUrl });

  registration = setUrl(registration, RDF_TYPE, SOLID_TYPE_REGISTRATION);
  registration = setUrl(registration, SOLID_FOR_CLASS, input.classUrl);
  registration = removeAll(registration, SOLID_INSTANCE_CONTAINER);
  registration = setUrl(registration, SOLID_INSTANCE, normalizeUrl(input.instanceUrl));

  let nextDataset = setThing(dataset, rootThing);
  nextDataset = setThing(nextDataset, registration);
  await saveDataset(input.indexUrl, nextDataset, input.fetchImpl);
}

function createVerificationDocument(input: {
  identity: SerializedIdentity;
  webId: string | null;
  createdAt?: string;
}): SolidVerificationDocument {
  return {
    format: "ternent-solid-verification",
    version: "1",
    createdAt: input.createdAt ?? new Date().toISOString(),
    webId: input.webId,
    keyId: input.identity.keyId,
    publicKey: input.identity.publicKey,
    algorithm: "Ed25519",
    proofPurpose: "assertionMethod",
  };
}

function isSolidVerificationDocument(value: unknown): value is SolidVerificationDocument {
  return (
    isRecord(value) &&
    value.format === "ternent-solid-verification" &&
    value.version === "1" &&
    typeof value.createdAt === "string" &&
    (value.webId === null || typeof value.webId === "string") &&
    typeof value.keyId === "string" &&
    typeof value.publicKey === "string" &&
    value.algorithm === "Ed25519" &&
    value.proofPurpose === "assertionMethod"
  );
}

async function publishSolidVerificationDocument(input: {
  session: SolidSessionLike;
  url: string;
  webId: string | null;
  identity: SerializedIdentity;
  createdAt?: string;
}) {
  const resource = createSolidJsonResource<SolidVerificationDocument>({
    session: input.session,
    url: input.url,
    name: "solid-verification",
    coerce(value) {
      if (!isSolidVerificationDocument(value)) {
        throw new Error(
          "Solid verification document must be a ternent-solid-verification v1 object.",
        );
      }
      return value;
    },
  });

  await resource.save(
    createVerificationDocument({
      identity: input.identity,
      webId: input.webId,
      createdAt: input.createdAt,
    }),
  );
}

export async function createSolidConcordPaths(
  session: SolidSessionLike,
  options: CreateSolidConcordPathsOptions = {},
): Promise<SolidConcordPaths> {
  const webId = getSolidWebId(session);
  const profileUrl = stripHash(webId);
  const profileDataset = await getSolidDataset(profileUrl, {
    fetch: session.fetch,
  });
  const profileThing = ensureProfileThing(profileDataset, webId);
  const podRoot =
    String(options.podRoot || "").trim() ||
    String(getUrl(profileThing, PIM_STORAGE) || "").trim();

  if (!podRoot) {
    throw new Error(
      `Solid profile ${webId} does not advertise a pod root via pim:storage.`,
    );
  }

  const normalizedPodRoot = normalizeUrl(podRoot);
  const settingsRootUrl = new URL("settings/", normalizedPodRoot).toString();
  const appPath = normalizeAppPath(options.appPath);
  const appRootUrl = new URL(appPath, normalizedPodRoot).toString();
  const systemRootUrl = new URL("system/", appRootUrl).toString();
  const systemPrivateRootUrl = new URL("private/", systemRootUrl).toString();
  const workspaceRootUrl = new URL("workspace/", appRootUrl).toString();
  const workspacePrivateRootUrl = new URL("private/", workspaceRootUrl).toString();
  const workspaceSharedRootUrl = new URL("shared/", workspaceRootUrl).toString();
  const workspacePublicRootUrl = new URL("public/", workspaceRootUrl).toString();
  const privateRootUrl = systemPrivateRootUrl;
  const publicRootUrl = new URL("public/", appRootUrl).toString();

  return {
    webId,
    profileUrl,
    podRoot: normalizedPodRoot,
    settingsRootUrl,
    appRootUrl,
    systemRootUrl,
    systemPrivateRootUrl,
    workspaceRootUrl,
    workspacePrivateRootUrl,
    workspaceSharedRootUrl,
    workspacePublicRootUrl,
    privateRootUrl,
    publicRootUrl,
    preferencesUrl: normalizeUrl(
      options.preferencesUrl ?? new URL("preferences.ttl", settingsRootUrl).toString(),
    ),
    publicTypeIndexUrl: normalizeUrl(
      options.publicTypeIndexUrl ??
        new URL("publicTypeIndex.ttl", settingsRootUrl).toString(),
    ),
    privateTypeIndexUrl: normalizeUrl(
      options.privateTypeIndexUrl ??
        new URL("privateTypeIndex.ttl", settingsRootUrl).toString(),
    ),
    identityUrl: normalizeUrl(
      options.identityUrl ??
        new URL("identity.enc.json", systemPrivateRootUrl).toString(),
    ),
    mnemonicUrl: new URL("mnemonic.json", systemPrivateRootUrl).toString(),
    walletUrl: new URL("wallet.json", systemPrivateRootUrl).toString(),
    ledgerUrl: new URL("ledger.json", systemPrivateRootUrl).toString(),
    peopleUrl: new URL("people.json", systemPrivateRootUrl).toString(),
    verificationUrl: normalizeUrl(
      options.verificationUrl ??
        new URL("seal-identity.json", publicRootUrl).toString(),
    ),
  };
}

export async function discoverSolidConcordResources(
  session: SolidSessionLike,
  options: CreateSolidConcordPathsOptions = {},
): Promise<SolidConcordResources> {
  const webId = getSolidWebId(session);
  const profileUrl = stripHash(webId);
  const defaults = await createSolidConcordPaths(session, options).catch(() => null);
  const profileDataset = await getSolidDataset(profileUrl, {
    fetch: session.fetch,
  });
  const profileThing = ensureProfileThing(profileDataset, webId);
  const preferencesUrl = getUrl(profileThing, PIM_PREFERENCES_FILE) ?? null;
  const preferencesDataset =
    preferencesUrl === null
      ? null
      : await loadOptionalDataset(preferencesUrl, session.fetch);
  const preferencesThing =
    preferencesUrl !== null && preferencesDataset !== null
      ? getThing(preferencesDataset, preferencesUrl)
      : null;
  const publicTypeIndexUrl = getUrl(profileThing, SOLID_PUBLIC_TYPE_INDEX) ?? null;
  const privateTypeIndexUrl =
    (preferencesThing && getUrl(preferencesThing, SOLID_PRIVATE_TYPE_INDEX)) ??
    getUrl(profileThing, SOLID_PRIVATE_TYPE_INDEX) ??
    null;
  const seeAlso = getUrlAll(profileThing, RDFS_SEE_ALSO).map(normalizeUrl);
  const publicIndex =
    publicTypeIndexUrl === null
      ? null
      : await loadOptionalDataset(publicTypeIndexUrl, session.fetch);
  const privateIndex =
    privateTypeIndexUrl === null
      ? null
      : await loadOptionalDataset(privateTypeIndexUrl, session.fetch);

  return {
    webId,
    profileUrl,
    podRoot: defaults?.podRoot ?? null,
    settingsRootUrl: defaults?.settingsRootUrl ?? null,
    appRootUrl: defaults?.appRootUrl ?? null,
    systemRootUrl: defaults?.systemRootUrl ?? null,
    systemPrivateRootUrl: defaults?.systemPrivateRootUrl ?? null,
    workspaceRootUrl: defaults?.workspaceRootUrl ?? null,
    workspacePrivateRootUrl: defaults?.workspacePrivateRootUrl ?? null,
    workspaceSharedRootUrl: defaults?.workspaceSharedRootUrl ?? null,
    workspacePublicRootUrl: defaults?.workspacePublicRootUrl ?? null,
    privateRootUrl: defaults?.privateRootUrl ?? null,
    publicRootUrl: defaults?.publicRootUrl ?? null,
    preferencesUrl: preferencesUrl ? normalizeUrl(preferencesUrl) : defaults?.preferencesUrl ?? null,
    publicTypeIndexUrl: publicTypeIndexUrl
      ? normalizeUrl(publicTypeIndexUrl)
      : defaults?.publicTypeIndexUrl ?? null,
    privateTypeIndexUrl: privateTypeIndexUrl
      ? normalizeUrl(privateTypeIndexUrl)
      : defaults?.privateTypeIndexUrl ?? null,
    identityUrl:
      getRegisteredInstanceUrl(privateIndex, SOLID_CONCORD_IDENTITY_CLASS) ??
      defaults?.identityUrl ??
      null,
    mnemonicUrl:
      getRegisteredInstanceUrl(privateIndex, SOLID_CONCORD_MNEMONIC_CLASS) ??
      defaults?.mnemonicUrl ??
      null,
    walletUrl:
      getRegisteredInstanceUrl(privateIndex, SOLID_CONCORD_WALLET_CLASS) ??
      defaults?.walletUrl ??
      null,
    ledgerUrl:
      getRegisteredInstanceUrl(privateIndex, SOLID_CONCORD_LEDGER_CLASS) ??
      defaults?.ledgerUrl ??
      null,
    peopleUrl:
      getRegisteredInstanceUrl(privateIndex, SOLID_CONCORD_PEOPLE_CLASS) ??
      defaults?.peopleUrl ??
      null,
    verificationUrl:
      getRegisteredInstanceUrl(publicIndex, SOLID_CONCORD_VERIFICATION_CLASS) ??
      defaults?.verificationUrl ??
      null,
    seeAlso,
  };
}

export async function bootstrapSolidConcordProfile(
  input: BootstrapSolidConcordProfileOptions,
): Promise<SolidConcordResources> {
  const webId = getSolidWebId(input.session);
  const paths = await createSolidConcordPaths(input.session, input);
  const fetchImpl = input.session.fetch;
  const profileDataset = await getSolidDataset(paths.profileUrl, {
    fetch: fetchImpl,
  });
  let profileThing = ensureProfileThing(profileDataset, webId);
  let profileChanged = false;

  const existingPreferencesUrl = getUrl(profileThing, PIM_PREFERENCES_FILE);
  const existingPublicTypeIndexUrl = getUrl(profileThing, SOLID_PUBLIC_TYPE_INDEX);

  const desiredPreferencesUrl = normalizeUrl(
    input.preferencesUrl ?? existingPreferencesUrl ?? paths.preferencesUrl,
  );
  const existingPreferencesDataset = await loadOptionalDataset(
    desiredPreferencesUrl,
    fetchImpl,
  );
  let preferencesThing =
    existingPreferencesDataset && getThing(existingPreferencesDataset, desiredPreferencesUrl);
  const existingPrivateTypeIndexUrl =
    preferencesThing && getUrl(preferencesThing, SOLID_PRIVATE_TYPE_INDEX);
  const desiredPublicTypeIndexUrl = normalizeUrl(
    input.publicTypeIndexUrl ?? existingPublicTypeIndexUrl ?? paths.publicTypeIndexUrl,
  );
  const desiredPrivateTypeIndexUrl = normalizeUrl(
    input.privateTypeIndexUrl ??
      existingPrivateTypeIndexUrl ??
      paths.privateTypeIndexUrl,
  );

  if (getUrl(profileThing, PIM_PREFERENCES_FILE) !== desiredPreferencesUrl) {
    profileThing = setUrl(profileThing, PIM_PREFERENCES_FILE, desiredPreferencesUrl);
    profileChanged = true;
  }

  if (getUrl(profileThing, SOLID_PUBLIC_TYPE_INDEX) !== desiredPublicTypeIndexUrl) {
    profileThing = setUrl(profileThing, SOLID_PUBLIC_TYPE_INDEX, desiredPublicTypeIndexUrl);
    profileChanged = true;
  }

  if (getUrl(profileThing, SOLID_PRIVATE_TYPE_INDEX) !== null) {
    profileThing = removeAll(profileThing, SOLID_PRIVATE_TYPE_INDEX);
    profileChanged = true;
  }

  if (!getUrlAll(profileThing, RDF_TYPE).includes(FOAF_AGENT)) {
    profileThing = addUrl(profileThing, RDF_TYPE, FOAF_AGENT);
    profileChanged = true;
  }

  const verificationUrl = normalizeUrl(input.verificationUrl ?? paths.verificationUrl);
  if (input.identity && !getUrlAll(profileThing, RDFS_SEE_ALSO).includes(verificationUrl)) {
    profileThing = addUrl(profileThing, RDFS_SEE_ALSO, verificationUrl);
    profileChanged = true;
  }

  if (profileChanged) {
    await saveDataset(paths.profileUrl, setThing(profileDataset, profileThing), fetchImpl);
  }

  if (existingPreferencesDataset === null || preferencesThing === null) {
    preferencesThing = createThing({ url: desiredPreferencesUrl });
  }
  preferencesThing = setUrl(preferencesThing, RDF_TYPE, PIM_CONFIGURATION_FILE);
  preferencesThing = setUrl(
    preferencesThing,
    SOLID_PRIVATE_TYPE_INDEX,
    desiredPrivateTypeIndexUrl,
  );
  const preferencesDataset = setThing(
    existingPreferencesDataset ?? createSolidDataset(),
    preferencesThing,
  );
  await saveDataset(desiredPreferencesUrl, preferencesDataset, fetchImpl);
  await ensureTypeIndexDocument(desiredPublicTypeIndexUrl, true, fetchImpl);
  await ensureTypeIndexDocument(desiredPrivateTypeIndexUrl, false, fetchImpl);

  const identityUrl =
    input.identityUrl === undefined ? paths.identityUrl : input.identityUrl;
  const mnemonicUrl =
    input.mnemonicUrl === undefined ? paths.mnemonicUrl : input.mnemonicUrl;
  const walletUrl =
    input.walletUrl === undefined ? paths.walletUrl : input.walletUrl;
  const ledgerUrl =
    input.ledgerUrl === undefined ? paths.ledgerUrl : input.ledgerUrl;
  const peopleUrl =
    input.peopleUrl === undefined ? paths.peopleUrl : input.peopleUrl;

  if (identityUrl) {
    await upsertTypeRegistration({
      indexUrl: desiredPrivateTypeIndexUrl,
      fetchImpl,
      registrationId: "ternent-solid-encrypted-identity",
      classUrl: SOLID_CONCORD_IDENTITY_CLASS,
      instanceUrl: identityUrl,
      listed: false,
    });
  }

  if (mnemonicUrl) {
    await upsertTypeRegistration({
      indexUrl: desiredPrivateTypeIndexUrl,
      fetchImpl,
      registrationId: "ternent-solid-mnemonic",
      classUrl: SOLID_CONCORD_MNEMONIC_CLASS,
      instanceUrl: mnemonicUrl,
      listed: false,
    });
  }

  if (walletUrl) {
    await upsertTypeRegistration({
      indexUrl: desiredPrivateTypeIndexUrl,
      fetchImpl,
      registrationId: "ternent-solid-wallet",
      classUrl: SOLID_CONCORD_WALLET_CLASS,
      instanceUrl: walletUrl,
      listed: false,
    });
  }

  if (ledgerUrl) {
    await upsertTypeRegistration({
      indexUrl: desiredPrivateTypeIndexUrl,
      fetchImpl,
      registrationId: "ternent-concord-ledger",
      classUrl: SOLID_CONCORD_LEDGER_CLASS,
      instanceUrl: ledgerUrl,
      listed: false,
    });
  }

  if (peopleUrl) {
    await upsertTypeRegistration({
      indexUrl: desiredPrivateTypeIndexUrl,
      fetchImpl,
      registrationId: "ternent-concord-people",
      classUrl: SOLID_CONCORD_PEOPLE_CLASS,
      instanceUrl: peopleUrl,
      listed: false,
    });
  }

  if (input.identity) {
    await publishSolidVerificationDocument({
      session: input.session,
      url: verificationUrl,
      webId,
      identity: input.identity,
      createdAt: input.createdAt,
    });

    await upsertTypeRegistration({
      indexUrl: desiredPublicTypeIndexUrl,
      fetchImpl,
      registrationId: "ternent-solid-verification",
      classUrl: SOLID_CONCORD_VERIFICATION_CLASS,
      instanceUrl: verificationUrl,
      listed: true,
    });
  }

  return await discoverSolidConcordResources(input.session, input);
}
