# `@ternent/rage` Specification

## Overview

`@ternent/rage` is an async-first WebAssembly wrapper around `age`/`rage`.

It operates only on:

- age recipient strings
- age secret key strings
- passphrases
- `Uint8Array` payloads

It does not perform:

- signing
- identity derivation
- envelope construction
- mode autodetection
- product-layer abstraction

## Public API

```ts
export type RageOutputFormat = "armor" | "binary";

export interface RageKeyPair {
  type: "x25519";
  privateKey: string;
  publicKey: string;
}

export async function initRage(): Promise<void>;
export async function generateKeyPair(): Promise<RageKeyPair>;
export async function encryptWithRecipients(input: {
  recipients: string[];
  data: Uint8Array;
  output?: RageOutputFormat;
}): Promise<Uint8Array>;
export async function decryptWithIdentity(input: {
  identity: string;
  data: Uint8Array;
}): Promise<Uint8Array>;
export async function encryptWithPassphrase(input: {
  passphrase: string;
  data: Uint8Array;
  output?: RageOutputFormat;
}): Promise<Uint8Array>;
export async function decryptWithPassphrase(input: {
  passphrase: string;
  data: Uint8Array;
}): Promise<Uint8Array>;
```

Text convenience helpers are armor-first wrappers over the byte APIs:

- `encryptTextWithRecipients`
- `decryptTextWithIdentity`
- `encryptTextWithPassphrase`
- `decryptTextWithPassphrase`

## Constraints

- async-first public surface
- manual `initRage()` contract
- bytes-first canonical I/O
- explicit recipient or passphrase mode only
- multi-recipient encryption in one pass
- 64MB maximum payload
- typed and structured errors
- age-compatible ciphertext and key formats

## Error Codes

- `RAGE_INIT_FAILED`
- `RAGE_EMPTY_DATA`
- `RAGE_EMPTY_RECIPIENTS`
- `RAGE_INVALID_RECIPIENT`
- `RAGE_INVALID_IDENTITY`
- `RAGE_EMPTY_PASSPHRASE`
- `RAGE_DATA_TOO_LARGE`
- `RAGE_ENCRYPT_FAILED`
- `RAGE_DECRYPT_FAILED`
