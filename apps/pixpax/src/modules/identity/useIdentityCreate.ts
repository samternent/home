import { ref } from "vue";
import { createIdentity } from "@ternent/identity";
import { useIdentitySession, type StoredIdentity } from "./useIdentitySession";

function createDefaultDisplayName() {
  const timestamp = new Date();
  return `Child ${timestamp.getHours().toString().padStart(2, "0")}${timestamp
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;
}

function toStoredIdentity(
  serializedIdentity: Awaited<ReturnType<typeof createIdentity>>,
): StoredIdentity {
  return {
    id: `identity-${serializedIdentity.keyId.slice(0, 12)}`,
    displayName: createDefaultDisplayName(),
    fingerprint: serializedIdentity.keyId,
    serializedIdentity,
    managedUserId: null,
  };
}

let ensurePromise: Promise<StoredIdentity> | null = null;

export function useIdentityCreate() {
  const session = useIdentitySession();

  const isCreating = ref(false);
  const error = ref<string | null>(null);

  const create = async (): Promise<StoredIdentity> => {
    isCreating.value = true;
    error.value = null;

    try {
      const identity = toStoredIdentity(await createIdentity());
      session.setIdentity(identity);
      return identity;
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Failed to create identity";
      error.value = message;
      throw new Error(message);
    } finally {
      isCreating.value = false;
    }
  };

  return {
    isCreating,
    error,
    create,
  };
}

export async function ensureLocalIdentity(): Promise<StoredIdentity> {
  const session = useIdentitySession();
  if (session.identity.value) {
    return session.identity.value;
  }

  if (!ensurePromise) {
    const creator = useIdentityCreate();
    ensurePromise = creator
      .create()
      .finally(() => {
        ensurePromise = null;
      });
  }

  return ensurePromise;
}
