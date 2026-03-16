import { readFile } from "node:fs/promises";
import { parseIdentity, type SerializedIdentity } from "@ternent/identity";

export async function resolveSealIdentityFromEnv(
  env: Record<string, string | undefined>
): Promise<SerializedIdentity> {
  const identityJson = String(env.SEAL_IDENTITY || "").trim();
  if (identityJson) {
    return parseIdentity(identityJson);
  }

  const identityFile = String(env.SEAL_IDENTITY_FILE || "").trim();
  if (identityFile) {
    return parseIdentity(await readFile(identityFile, "utf8"));
  }

  throw new Error(
    "Missing SEAL_IDENTITY or SEAL_IDENTITY_FILE environment variable."
  );
}
