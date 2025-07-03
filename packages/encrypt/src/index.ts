import init, {
  keygen_async,
  encrypt_async,
  encrypt_passphrase_async,
  decrypt_async,
  decrypt_passphrase_async,
} from "ternent-rage-wasm";

// Initialize the WASM module once
let wasmReady: Promise<void> | null = null;

async function ensureWasmReady(): Promise<void> {
  if (!wasmReady) {
    wasmReady = init().then(() => {});
  }
  return wasmReady;
}

/**
 * Generates a new X25519 key pair for age encryption
 * @returns A promise that resolves to an array containing [private_key, public_key]
 * @example
 * ```typescript
 * const [privateKey, publicKey] = await generate();
 * console.log('Private key:', privateKey);
 * console.log('Public key:', publicKey);
 * ```
 */
export async function generate(): Promise<string[]> {
  await ensureWasmReady();
  return keygen_async();
}

/**
 * Encrypts data using either X25519 public key or user passphrase
 * Automatically detects the encryption method based on the secret format
 * @param secret - Either an X25519 public key (starts with "age1") or a passphrase
 * @param data - The string data to encrypt
 * @returns A promise that resolves to the encrypted data as an armored string
 * @example
 * ```typescript
 * // Using public key encryption
 * const publicKey = "age1...";
 * const encrypted = await encrypt(publicKey, "sensitive data");
 *
 * // Using passphrase encryption
 * const encrypted2 = await encrypt("my-secret-password", "sensitive data");
 * ```
 */
export async function encrypt(secret: string, data: string): Promise<string> {
  await ensureWasmReady();

  const dataBytes = new TextEncoder().encode(data);
  let encryptedBytes;

  if (secret.startsWith("age1")) {
    encryptedBytes = await encrypt_async(secret, dataBytes, true);
  } else {
    encryptedBytes = await encrypt_passphrase_async(secret, dataBytes, true);
  }

  return new TextDecoder("utf-8").decode(new Uint8Array(encryptedBytes));
}

/**
 * Decrypts data using either X25519 private key or user passphrase
 * Automatically detects the decryption method based on the secret format
 * @param secret - Either an X25519 private key (starts with "AGE-SECRET-KEY-") or a passphrase
 * @param data - The encrypted armored string data to decrypt
 * @returns A promise that resolves to the decrypted plaintext string
 * @example
 * ```typescript
 * // Using private key decryption
 * const privateKey = "AGE-SECRET-KEY-...";
 * const decrypted = await decrypt(privateKey, encryptedData);
 *
 * // Using passphrase decryption
 * const decrypted2 = await decrypt("my-secret-password", encryptedData);
 * ```
 */
export async function decrypt(secret: string, data: string): Promise<string> {
  await ensureWasmReady();

  const dataBytes = new TextEncoder().encode(data);
  let decryptedBytes;

  if (secret.startsWith("AGE-SECRET-KEY-")) {
    decryptedBytes = await decrypt_async(secret, dataBytes);
  } else {
    decryptedBytes = await decrypt_passphrase_async(secret, dataBytes);
  }

  return new TextDecoder("utf-8").decode(new Uint8Array(decryptedBytes));
}

// Export error types for better error handling
export { EncryptionError, ValidationError } from "./errors";
