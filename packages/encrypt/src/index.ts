import {
  encrypt_with_user_passphrase,
  decrypt_with_user_passphrase,
  encrypt_with_x25519,
  decrypt_with_x25519,
  keygen,
} from "@kanru/rage-wasm";

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
  return keygen();
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
  let encrypted;
  if (secret.startsWith("age1")) {
    encrypted = await encrypt_with_x25519(
      secret,
      new TextEncoder().encode(data),
      true
    );
  } else {
    encrypted = await encrypt_with_user_passphrase(
      secret,
      new TextEncoder().encode(data),
      true
    );
  }

  return new TextDecoder("utf-8").decode(encrypted);
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
  let decrypted;
  if (secret.startsWith("AGE-SECRET-KEY-")) {
    decrypted = await decrypt_with_x25519(
      secret,
      new TextEncoder().encode(data)
    );
  } else {
    decrypted = await decrypt_with_user_passphrase(
      secret,
      new TextEncoder().encode(data)
    );
  }

  return new TextDecoder("utf-8").decode(decrypted);
}
