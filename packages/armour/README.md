# `@ternent/armour`

`@ternent/armour` is the opinionated bridge between `@ternent/identity` and `@ternent/rage`.

It exists to:

- derive age-compatible recipients and secret keys from `@ternent/identity`
- expose explicit recipient-mode and passphrase-mode encryption APIs
- keep browser-facing helpers async and environment-safe

It is not:

- a crypto engine
- a signing library
- a storage layer
- a mode-detecting convenience wrapper
- a transport artifact format

`@ternent/rage` owns encryption and decryption.
`@ternent/identity` owns seed-backed identity parsing and age derivation.
`@ternent/armour` composes those two layers without inventing new cryptography.
Portable artifacts and sealed containers belong to `@ternent/seal`.

## Initialization

All operational APIs are async. Initialize Armour before encrypting or decrypting:

```ts
import { initArmour } from "@ternent/armour";

await initArmour();
```

## Identity-based encryption

```ts
import { createIdentity } from "@ternent/identity";
import {
  decryptTextWithIdentity,
  encryptTextForIdentities,
  initArmour,
} from "@ternent/armour";

await initArmour();

const identity = await createIdentity();
const ciphertext = await encryptTextForIdentities({
  identities: [identity],
  text: "hello world",
});

const plaintext = await decryptTextWithIdentity({
  identity,
  data: ciphertext,
});
```

## Multi-recipient encryption

```ts
import { createIdentity } from "@ternent/identity";
import {
  decryptWithIdentity,
  encryptForIdentities,
  initArmour,
} from "@ternent/armour";

await initArmour();

const alice = await createIdentity();
const bob = await createIdentity();

const ciphertext = await encryptForIdentities({
  identities: [alice, bob],
  data: new TextEncoder().encode("shared secret"),
  output: "binary",
});

const plaintext = await decryptWithIdentity({
  identity: bob,
  data: ciphertext,
});
```

## Passphrase encryption

```ts
import {
  decryptTextWithPassphrase,
  encryptTextWithPassphrase,
  initArmour,
} from "@ternent/armour";

await initArmour();

const ciphertext = await encryptTextWithPassphrase({
  passphrase: "correct horse battery staple",
  text: "secret",
});

const plaintext = await decryptTextWithPassphrase({
  passphrase: "correct horse battery staple",
  data: ciphertext,
});
```

## Relationship to the lower layers

- `@ternent/identity` defines the identity model and deterministic age derivation
- `@ternent/rage` performs age-compatible encryption and decryption
- `@ternent/armour` keeps recipient mode and passphrase mode explicit
- `@ternent/seal` owns portable artifact formats and signing

Encryption is not signing.
This package does not imply authenticity, signer identity, or origin integrity.
