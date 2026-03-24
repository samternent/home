import type {
  SolidAccessValidationMode,
  SolidConcordAccessCheck,
  SolidConcordAccessReport,
  SolidConcordResources,
} from "./types.js";

function getAnonymousFetch(): typeof fetch {
  if (typeof globalThis.fetch !== "function") {
    throw new Error("Global fetch is required to validate anonymous Solid resource access.");
  }

  return globalThis.fetch.bind(globalThis);
}

async function probeAnonymousRead(url: string): Promise<"yes" | "no" | "unknown"> {
  const fetchImpl = getAnonymousFetch();

  try {
    const headResponse = await fetchImpl(url, {
      method: "HEAD",
    });

    if (headResponse.ok) {
      return "yes";
    }

    if (headResponse.status === 401 || headResponse.status === 403 || headResponse.status === 404) {
      return "no";
    }

    if (headResponse.status !== 405 && headResponse.status !== 501) {
      return "unknown";
    }
  } catch {
    return "unknown";
  }

  try {
    const getResponse = await fetchImpl(url, {
      method: "GET",
    });

    if (getResponse.ok) {
      return "yes";
    }

    if (getResponse.status === 401 || getResponse.status === 403 || getResponse.status === 404) {
      return "no";
    }
  } catch {
    return "unknown";
  }

  return "unknown";
}

function createCheck(input: {
  name: SolidConcordAccessCheck["name"];
  url: string | null;
  expectedAccess: SolidConcordAccessCheck["expectedAccess"];
  anonymousRead: "yes" | "no" | "unknown";
}): SolidConcordAccessCheck | null {
  if (!input.url) {
    return null;
  }

  let issue: string | null = null;
  if (input.expectedAccess === "private" && input.anonymousRead === "yes") {
    issue = `Solid ${input.name} resource is anonymously readable: ${input.url}`;
  }

  if (input.expectedAccess === "public" && input.anonymousRead === "no") {
    issue = `Solid ${input.name} resource is not publicly readable: ${input.url}`;
  }

  return {
    name: input.name,
    url: input.url,
    expectedAccess: input.expectedAccess,
    anonymousRead: input.anonymousRead,
    safe: issue === null,
    issue,
  };
}

export async function validateSolidConcordAccess(
  resources: SolidConcordResources,
): Promise<SolidConcordAccessReport> {
  const checks = (
    await Promise.all([
      resources.mnemonicUrl
        ? probeAnonymousRead(resources.mnemonicUrl).then((anonymousRead) =>
            createCheck({
              name: "mnemonic",
              url: resources.mnemonicUrl,
              expectedAccess: "private",
              anonymousRead,
            }),
          )
        : Promise.resolve(null),
      resources.walletUrl
        ? probeAnonymousRead(resources.walletUrl).then((anonymousRead) =>
            createCheck({
              name: "wallet",
              url: resources.walletUrl,
              expectedAccess: "private",
              anonymousRead,
            }),
          )
        : Promise.resolve(null),
      resources.verificationUrl
        ? probeAnonymousRead(resources.verificationUrl).then((anonymousRead) =>
            createCheck({
              name: "verification",
              url: resources.verificationUrl,
              expectedAccess: "public",
              anonymousRead,
            }),
          )
        : Promise.resolve(null),
    ])
  ).filter((value): value is SolidConcordAccessCheck => value !== null);

  const issues = checks.flatMap((check) => (check.issue ? [check.issue] : []));

  return {
    safe: issues.length === 0,
    issues,
    checks,
  };
}

export async function enforceSolidConcordAccess(
  resources: SolidConcordResources,
  mode: SolidAccessValidationMode = "strict",
): Promise<SolidConcordAccessReport | undefined> {
  if (mode === "off") {
    return undefined;
  }

  const report = await validateSolidConcordAccess(resources);
  if (report.safe) {
    return report;
  }

  if (mode === "strict") {
    throw new Error(report.issues.join(" "));
  }

  if (typeof console !== "undefined" && typeof console.warn === "function") {
    console.warn(
      `[ternent/solid] Potentially unsafe Solid resource exposure detected:\n${report.issues.join("\n")}`,
    );
  }

  return report;
}
