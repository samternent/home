import { provide, inject, shallowRef } from "vue";
import { useLocalStorage } from "@vueuse/core";
import {
  createIdentity,
  exportPrivateKeyAsPem,
  exportPublicKeyAsPem,
  importPrivateKeyFromPem,
  importPublicKeyFromPem,
} from "ternent-identity";
import { stripIdentityKey } from "ternent-utils";

const useIdentitySymbol = Symbol("useIdentity");

function Identity() {
  const publicKeyPEM = useLocalStorage("concords/identity/publicKey", "");
  const privateKeyPEM = useLocalStorage("concords/identity/privateKey", "");

  const publicKey = shallowRef(null);
  const privateKey = shallowRef(null);
  const ready = shallowRef(null);

  async function init() {
    if (publicKeyPEM.value && privateKeyPEM.value) {
      publicKey.value = await importPublicKeyFromPem(publicKeyPEM.value);
      privateKey.value = await importPrivateKeyFromPem(privateKeyPEM.value);
    }
    ready.value = true;
  }

  async function impersonate(profile) {
    ready.value = false;
    const {
      publicKey: publicPEM,
      privateKey: { payload: privatePEM },
    } = profile.identity;
    if (publicPEM && privatePEM) {
      publicKeyPEM.value = publicPEM;
      privateKeyPEM.value = privatePEM;
      publicKey.value = await importPublicKeyFromPem(publicPEM);
      privateKey.value = await importPrivateKeyFromPem(privatePEM);
    }
    ready.value = true;
  }

  init();

  async function createNewIdentity() {
    const keys = await createIdentity();
    publicKeyPEM.value = stripIdentityKey(
      await exportPublicKeyAsPem(keys.publicKey)
    );
    publicKey.value = keys.publicKey;
    privateKey.value = keys.privateKey;
    privateKeyPEM.value = await exportPrivateKeyAsPem(keys.privateKey);
  }

  return {
    publicKey,
    privateKey,
    publicKeyPEM,
    privateKeyPEM,
    ready,
    impersonate,
    createIdentity: createNewIdentity,
    init,
  };
}

/**
 * @type {Identity}
 */
export function provideIdentity() {
  const identity = Identity();
  provide(useIdentitySymbol, identity);
  return identity;
}

/**
 * @type {Identity}
 */
export function useIdentity() {
  return inject(useIdentitySymbol);
}
