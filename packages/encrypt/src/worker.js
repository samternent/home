import init, {
  encrypt_with_user_passphrase,
  decrypt_with_user_passphrase,
} from "concords-rage-wasm";

export const ready = init();

export async function encryptWithUserPassphrase(password, data) {
  await ready;

  const encrypted = await encrypt_with_user_passphrase(
    password,
    new TextEncoder().encode(data),
    true
  );
  return new TextDecoder("utf-8").decode(encrypted);
}

export async function decryptWithUserPassphrase(password, data) {
  await ready;

  const decrypted = await decrypt_with_user_passphrase(
    password,
    new TextEncoder().encode(data)
  );

  return new TextDecoder("utf-8").decode(decrypted);
}

const ctx = self;

ctx.onmessage = async function handleMessage(e) {
  if (!e.data.action || !e.data.password || !e.data.data) {
    return;
  }

  if (e.data.action === "encryptWithUserPassphrase") {
    const encryptedData = await encryptWithUserPassphrase(
      e.data.password,
      e.data.data
    );

    ctx.postMessage({ action: "encryptWithUserPassphrase", encryptedData });
  }
};
