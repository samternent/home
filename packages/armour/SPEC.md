# `@ternent/armour` Specification

`@ternent/armour` does not define or export any portable artifact format.
Transport containers and sealed artifacts belong to `@ternent/seal`.

## Overview

`@ternent/armour` is the identity-aware encryption bridge above `@ternent/rage`.

It is responsible for:

- parsing `@ternent/identity` serialized identities
- deriving age recipient and secret key strings from those identities
- exposing explicit async encryption APIs for recipient mode and passphrase mode
- normalizing upstream errors into Armour-specific error classes and codes

It is not responsible for:

- raw crypto implementation
- WASM bootstrap internals beyond delegating `initArmour()` to `initRage()`
- signing
- identity seed generation
- mode autodetection
- transport containers or portable artifact semantics

## Public API

### Initialization

- `initArmour(): Promise<void>`

### Identity bridge

- `resolveIdentity(input): Promise<SerializedIdentity>`
- `recipientFromIdentity(input): Promise<string>`
- `secretKeyFromIdentity(input): Promise<string>`

### Recipient mode

- `encryptForRecipients({ recipients, data, output? }): Promise<Uint8Array>`
- `decryptWithSecretKey({ secretKey, data }): Promise<Uint8Array>`
- `encryptForIdentities({ identities, data, output? }): Promise<Uint8Array>`
- `decryptWithIdentity({ identity, data }): Promise<Uint8Array>`

### Passphrase mode

- `encryptWithPassphrase({ passphrase, data, output? }): Promise<Uint8Array>`
- `decryptWithPassphrase({ passphrase, data }): Promise<Uint8Array>`

### Text helpers

- `encryptTextForIdentities({ identities, text }): Promise<string>`
- `decryptTextWithIdentity({ identity, data }): Promise<string>`
- `encryptTextWithPassphrase({ passphrase, text }): Promise<string>`
- `decryptTextWithPassphrase({ passphrase, data }): Promise<string>`

### Binary helpers

- `encryptBinaryForIdentities({ identities, data, output? }): Promise<Uint8Array>`
- `decryptBinaryWithIdentity({ identity, data }): Promise<Uint8Array>`
- `encryptBinaryWithPassphrase({ passphrase, data, output? }): Promise<Uint8Array>`
- `decryptBinaryWithPassphrase({ passphrase, data }): Promise<Uint8Array>`

`data` may be a `Uint8Array`, `ArrayBuffer`, `Blob`, or `File` via the `Blob` type path.

## Error model

Armour normalizes upstream failures to:

- `ArmourInitError`
- `ArmourValidationError`
- `ArmourIdentityError`
- `ArmourEncryptionError`
- `ArmourDecryptionError`

Primary public codes:

- `ARMOUR_INIT_FAILED`
- `ARMOUR_INVALID_IDENTITY`
- `ARMOUR_IDENTITY_DERIVATION_FAILED`
- `ARMOUR_ENCRYPT_FAILED`
- `ARMOUR_DECRYPT_FAILED`

Additional validation codes may be raised for empty data, invalid recipients, invalid secret keys, empty passphrases, and oversized payloads.

## Boundary rules

- Encryption and decryption must delegate to `@ternent/rage`
- Identity derivation must delegate to `@ternent/identity`
- Signing logic must not exist in this package
- Recipient mode and passphrase mode must remain separate
- Portable artifacts and sealed containers belong to `@ternent/seal`
