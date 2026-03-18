import { provide, inject, shallowRef } from "vue";
import { useLocalStorage } from "@vueuse/core";
import { generate as generateEncryptionKeys } from "ternent-encrypt";

const useEncryptionSymbol = Symbol("useEncryption");

function Encryption() {
  const publicKey = useLocalStorage("concords/encrypt/publicKey", "");
  const privateKey = useLocalStorage("concords/encrypt/privateKey", "");

  const isReady = shallowRef();

  async function init() {
    if (!publicKey.value || !privateKey.value) {
      const [_privateEncryption, _publicEncryption] =
        await generateEncryptionKeys();
      publicKey.value = _publicEncryption;
      privateKey.value = _privateEncryption;
    }

    isReady.value = true;
  }

  async function impersonate(profile) {
    const {
      publicKey: publicPEM,
      privateKey: { payload: privatePEM },
    } = profile.encryption;
    if (publicPEM && privatePEM) {
      publicKey.value = publicPEM;
      privateKey.value = privatePEM;
    }
  }

  init();

  return {
    publicKey,
    privateKey,
    isReady,
    impersonate,
  };
}

/**
 * @type {Encryption}
 */
export function provideEncryption() {
  const encryption = Encryption();
  provide(useEncryptionSymbol, encryption);
  return encryption;
}

/**
 * @type {Encryption}
 */
export function useEncryption() {
  return inject(useEncryptionSymbol);
}
