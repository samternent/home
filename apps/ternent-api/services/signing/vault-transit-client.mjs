import { badRequest, serviceUnavailable } from "../http/errors.mjs";

function trim(value) {
  return String(value || "").trim();
}

function resolveVaultConfig() {
  return {
    addr: trim(process.env.VAULT_ADDR),
    transitMount: trim(process.env.VAULT_TRANSIT_MOUNT || "transit"),
    token: trim(process.env.VAULT_TOKEN),
    role: trim(process.env.VAULT_ROLE),
    serviceAccountTokenPath: trim(
      process.env.VAULT_K8S_JWT_PATH ||
        "/var/run/secrets/kubernetes.io/serviceaccount/token"
    ),
  };
}

function assertVaultConfig(config) {
  if (!config.addr) {
    throw serviceUnavailable(
      "VAULT_UNAVAILABLE",
      "Vault is not configured (missing VAULT_ADDR)."
    );
  }
  if (!config.transitMount) {
    throw serviceUnavailable(
      "VAULT_UNAVAILABLE",
      "Vault is not configured (missing VAULT_TRANSIT_MOUNT)."
    );
  }
}

function toFetchErrorMessage(error) {
  if (!error) return "unknown fetch error";
  const top = typeof error?.message === "string" ? trim(error.message) : "";
  const causeMessage =
    typeof error?.cause?.message === "string" ? trim(error.cause.message) : "";
  if (top && causeMessage && causeMessage !== top) {
    return `${top}: ${causeMessage}`;
  }
  if (top) {
    return top;
  }
  if (causeMessage) {
    return causeMessage;
  }
  return "unknown fetch error";
}

function throwVaultUnreachable(config, path, error) {
  throw serviceUnavailable(
    "VAULT_UNAVAILABLE",
    `Vault is unreachable at ${config.addr}${path}.`,
    {
      reason: toFetchErrorMessage(error),
    }
  );
}

async function readServiceJwt(pathname) {
  const { readFile } = await import("node:fs/promises");
  try {
    const jwt = await readFile(pathname, "utf8");
    return trim(jwt);
  } catch {
    return "";
  }
}

let cachedKubernetesToken = null;

async function loginWithKubernetes(config) {
  const jwt = await readServiceJwt(config.serviceAccountTokenPath);
  if (!jwt || !config.role) {
    throw serviceUnavailable(
      "VAULT_UNAVAILABLE",
      "Vault token is unavailable (set VAULT_TOKEN or configure VAULT_ROLE with service account JWT)."
    );
  }

  const url = `${config.addr.replace(/\/+$/, "")}/v1/auth/kubernetes/login`;
  let response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        role: config.role,
        jwt,
      }),
    });
  } catch (error) {
    throwVaultUnreachable(config, "/v1/auth/kubernetes/login", error);
  }

  if (!response.ok) {
    const body = await response.text();
    throw serviceUnavailable(
      "VAULT_AUTH_FAILED",
      `Vault kubernetes login failed (${response.status}): ${body || "unknown error"}.`
    );
  }

  const parsed = await response.json();
  const token = trim(parsed?.auth?.client_token);
  if (!token) {
    throw serviceUnavailable(
      "VAULT_AUTH_FAILED",
      "Vault kubernetes login response did not include a client token."
    );
  }
  cachedKubernetesToken = token;
  return token;
}

async function getVaultToken(config) {
  if (config.token) return config.token;
  if (cachedKubernetesToken) return cachedKubernetesToken;
  return loginWithKubernetes(config);
}

async function callVault(config, method, path, body) {
  const token = await getVaultToken(config);
  const url = `${config.addr.replace(/\/+$/, "")}${path}`;
  let response;
  try {
    response = await fetch(url, {
      method,
      headers: {
        "content-type": "application/json",
        "x-vault-token": token,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    throwVaultUnreachable(config, path, error);
  }

  if (response.status === 403 && !config.token && cachedKubernetesToken) {
    cachedKubernetesToken = null;
    return callVault(config, method, path, body);
  }

  if (!response.ok) {
    const text = await response.text();
    throw serviceUnavailable(
      "VAULT_REQUEST_FAILED",
      `Vault request failed (${response.status}) at ${path}: ${text || "unknown error"}.`
    );
  }

  return response.json();
}

export function createVaultTransitClient() {
  const config = resolveVaultConfig();
  assertVaultConfig(config);

  return {
    async signDigest({ keyName, digestBase64, hashAlgorithm = "sha2-256" }) {
      const normalizedKeyName = trim(keyName);
      const normalizedDigest = trim(digestBase64);
      if (!normalizedKeyName || !normalizedDigest) {
        throw badRequest(
          "VAULT_SIGN_INVALID_INPUT",
          "keyName and digestBase64 are required for Vault signing."
        );
      }

      const path = `/v1/${config.transitMount}/sign/${encodeURIComponent(
        normalizedKeyName
      )}`;
      const parsed = await callVault(config, "POST", path, {
        input: normalizedDigest,
        hash_algorithm: hashAlgorithm,
        prehashed: true,
        signature_algorithm: "ecdsa-p256",
        marshaling_algorithm: "asn1",
      });
      const signature = trim(parsed?.data?.signature);
      if (!signature) {
        throw serviceUnavailable(
          "VAULT_SIGN_FAILED",
          "Vault did not return a signature."
        );
      }
      return { signature };
    },

    async readKey({ keyName }) {
      const normalizedKeyName = trim(keyName);
      if (!normalizedKeyName) {
        throw badRequest("VAULT_KEY_INVALID", "keyName is required.");
      }

      const path = `/v1/${config.transitMount}/keys/${encodeURIComponent(
        normalizedKeyName
      )}`;
      const parsed = await callVault(config, "GET", path);
      const keys = parsed?.data?.keys || {};
      const latestVersion = Number(parsed?.data?.latest_version || 0);
      const versionKey = String(latestVersion || "");
      const latest = keys[versionKey] || null;

      if (!latest?.public_key) {
        throw serviceUnavailable(
          "VAULT_KEY_UNAVAILABLE",
          "Vault key does not expose a public key."
        );
      }

      return {
        latestVersion,
        publicKeyPem: String(latest.public_key || ""),
      };
    },
  };
}
