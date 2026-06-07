export interface RageRuntime {
  init(): Promise<void>;
  generateKeyPair(): Promise<unknown>;
  encryptWithRecipients(recipients: string[], data: Uint8Array, armor: boolean): Promise<unknown>;
  decryptWithIdentity(identity: string, data: Uint8Array): Promise<unknown>;
  encryptWithPassphrase(passphrase: string, data: Uint8Array, armor: boolean): Promise<unknown>;
  decryptWithPassphrase(passphrase: string, data: Uint8Array): Promise<unknown>;
}
