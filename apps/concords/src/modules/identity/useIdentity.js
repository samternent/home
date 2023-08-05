import { provide, inject, shallowRef } from "vue";
import { useLocalStorage } from "@vueuse/core";
import {
  createIdentity,
  exportPrivateKeyAsPem,
  exportPublicKeyAsPem,
  importPrivateKeyFromPem,
  importPublicKeyFromPem,
} from "concords-identity";
import { stripIdentityKey } from "concords-utils";

const useIdentitySymbol = Symbol("useIdentity");

function Identity() {
  const publicKeyPEM = useLocalStorage("concords/identity/publicKey", "");
  const privateKeyPEM = useLocalStorage("concords/identity/privateKey", "");

  const publicKey = shallowRef(null);
  const privateKey = shallowRef(null);
  const ready = shallowRef(false);

  async function init() {
    let keys = {};
    if (!publicKeyPEM.value || !privateKeyPEM.value) {
      keys = await createIdentity();
      publicKeyPEM.value = stripIdentityKey(
        await exportPublicKeyAsPem(keys.publicKey)
      );
      privateKeyPEM.value = await exportPrivateKeyAsPem(keys.privateKey);
    } else {
      keys.publicKey = await importPublicKeyFromPem(publicKeyPEM.value);
      keys.privateKey = await importPrivateKeyFromPem(privateKeyPEM.value);
    }

    publicKey.value = keys.publicKey;
    privateKey.value = keys.privateKey;
    ready.value = true;
  }

  init();

  return {
    publicKey,
    privateKey,
    publicKeyPEM,
    privateKeyPEM,
    ready,
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
