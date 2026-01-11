// useProfile.ts
import { provide, inject, computed, watch } from "vue";
import { useLocalStorage } from "@vueuse/core";
import { hashData } from "ternent-utils";
import { useIdentity } from "../identity/useIdentity";
import { useEncryption } from "../encryption/useEncryption";

const useProfileSymbol = Symbol("useProfile");

export type ProfileMeta = Record<string, unknown>;

export interface PublicProfile {
  format: "concord-profile";
  version: "1.0";
  profileId: string;
  identity: {
    type: "ecdsa-p256";
    publicKey: string; // stripped PEM as stored by useIdentity
  };
  encryption: {
    type: "age";
    recipients: string[]; // age recipients (public keys)
  };
  metadata: ProfileMeta;
}

export interface PrivateProfile {
  format: "concord-profile-private";
  version: "1.0";
  profileId: string;
  identity: {
    type: "ecdsa-p256";
    publicKey: string; // stripped PEM
    privateKey: {
      format: "pkcs8-pem";
      encrypted: false;
      payload: string; // PEM as stored by useIdentity
    };
  };
  encryption: {
    type: "age";
    privateKeys: Array<{
      format: "age-secret";
      encrypted: false;
      payload: string; // age secret as stored by useEncryption
    }>;
  };
  metadata: ProfileMeta;
}

export interface DownloadFiles {
  public: { filename: string; json: string; object: PublicProfile };
  private: { filename: string; json: string; object: PrivateProfile };
}

function shortId(id: string, n = 8): string {
  return (id || "").slice(0, n);
}

async function deriveProfileId(params: {
  identityPublicKeyPem: string;
}): Promise<string> {
  // Deterministic, non-secret, protocol-aligned: sha256(canonical({...}))
  // We wrap the string so future changes (e.g. using DER bytes) can version cleanly.
  return hashData({
    type: "concord-profile-id",
    v: 1,
    identityPublicKeyPem: params.identityPublicKeyPem,
  });
}

function Profile() {
  const identity = useIdentity();
  const encryption = useEncryption();

  if (!identity || !encryption) {
    throw new Error(
      "useProfile requires provideIdentity() and provideEncryption() to be called first."
    );
  }

  // Flexible metadata store (user-defined schema)
  const meta = useLocalStorage<ProfileMeta>("concords/profile/meta", {});

  // Stable derived profile id (full sha256 hex)
  const profileId = useLocalStorage<string>("concords/profile/id", "");

  const ready = computed(() => {
    return Boolean(identity.ready?.value) && Boolean(encryption.isReady?.value);
  });

  /**
   * Ensure we have a stable profileId once identity keys exist.
   * This is intentionally derived from the identity public key only,
   * so metadata changes won't change the profileId.
   */
  async function ensureProfileId(): Promise<void> {
    if (profileId.value) return;
    const publicPem = identity.publicKeyPEM.value;
    if (!publicPem) return;
    profileId.value = await deriveProfileId({
      identityPublicKeyPem: publicPem,
    });
  }

  // Auto-derive profileId when keys become available / after init.
  watch(
    () => [ready.value, identity.publicKeyPEM.value] as const,
    async ([isReady, publicPem]) => {
      if (!isReady) return;
      if (!publicPem) return;
      if (profileId.value) return;
      await ensureProfileId();
    },
    { immediate: true }
  );

  function setProfileMeta(partial: ProfileMeta) {
    meta.value = { ...(meta.value || {}), ...(partial || {}) };
  }

  function replaceProfileMeta(next: ProfileMeta) {
    meta.value = { ...(next || {}) };
  }

  function clearProfileMeta() {
    meta.value = {};
  }

  /**
   * Allows advanced flows (multi-identity, imported profiles, etc).
   * Normally you should not call this.
   */
  function setProfileId(id: string) {
    profileId.value = id || "";
  }

  function resetProfileId() {
    profileId.value = "";
    // it will re-derive automatically once ready/publicKey exists
  }

  function getPublicProfile(): PublicProfile {
    // Safe to share publicly
    return {
      format: "concord-profile",
      version: "1.0",
      profileId: profileId.value || "",
      identity: {
        type: "ecdsa-p256",
        publicKey: identity.publicKeyPEM.value || "",
      },
      encryption: {
        type: "age",
        recipients: encryption.publicKey.value
          ? [encryption.publicKey.value]
          : [],
      },
      metadata: meta.value || {},
    };
  }

  function getPrivateProfile(): PrivateProfile {
    // WARNING: This contains secrets. Never share this.
    return {
      format: "concord-profile-private",
      version: "1.0",
      profileId: profileId.value || "",
      identity: {
        type: "ecdsa-p256",
        publicKey: identity.publicKeyPEM.value || "",
        privateKey: {
          format: "pkcs8-pem",
          encrypted: false,
          payload: identity.privateKeyPEM.value || "",
        },
      },
      encryption: {
        type: "age",
        privateKeys: encryption.privateKey.value
          ? [
              {
                format: "age-secret",
                encrypted: false,
                payload: encryption.privateKey.value,
              },
            ]
          : [],
      },
      metadata: meta.value || {},
    };
  }

  function getPublicProfileJson(pretty = true): string {
    return JSON.stringify(getPublicProfile(), null, pretty ? 2 : 0);
  }

  function getPrivateProfileJson(pretty = true): string {
    return JSON.stringify(getPrivateProfile(), null, pretty ? 2 : 0);
  }

  function getDownloadFiles(options?: { pretty?: boolean }): DownloadFiles {
    const pretty = options?.pretty ?? true;
    const id = profileId.value || "profile";
    const sid = shortId(id, 10);

    const pub = getPublicProfile();
    const priv = getPrivateProfile();

    return {
      public: {
        filename: `concord-profile.public.${sid}.json`,
        json: JSON.stringify(pub, null, pretty ? 2 : 0),
        object: pub,
      },
      private: {
        filename: `concord-profile.private.${sid}.json`,
        json: JSON.stringify(priv, null, pretty ? 2 : 0),
        object: priv,
      },
    };
  }

  return {
    // state
    ready,
    meta,
    profileId,

    // profile id lifecycle
    ensureProfileId,
    setProfileId,
    resetProfileId,

    // metadata lifecycle
    setProfileMeta,
    replaceProfileMeta,
    clearProfileMeta,

    // export
    getPublicProfile,
    getPrivateProfile,
    getPublicProfileJson,
    getPrivateProfileJson,
    getDownloadFiles,
  };
}

export type UseProfile = ReturnType<typeof Profile>;

export function provideProfile() {
  const profile = Profile();
  provide(useProfileSymbol, profile);
  return profile;
}

export function useProfile(): UseProfile {
  const profile = inject<UseProfile>(useProfileSymbol);
  if (!profile)
    throw new Error("useProfile() called without provideProfile().");
  return profile;
}
