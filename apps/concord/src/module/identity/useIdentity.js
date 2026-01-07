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

  async function init() {
    if (publicKeyPEM.value && privateKeyPEM.value) {
      publicKey.value = await importPublicKeyFromPem(publicKeyPEM.value);
      privateKey.value = await importPrivateKeyFromPem(privateKeyPEM.value);
    }
  }

  init();

  async function createNewIdentity() {
    const keys = await createIdentity();
    publicKeyPEM.value = stripIdentityKey(
      await exportPublicKeyAsPem(keys.publicKey)
    );
    privateKeyPEM.value = await exportPrivateKeyAsPem(keys.privateKey);
  }

  return {
    publicKey,
    privateKey,
    publicKeyPEM,
    privateKeyPEM,
    createIdentity: createNewIdentity,
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
