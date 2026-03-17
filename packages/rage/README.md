# `@ternent/rage`

`@ternent/rage` is an async-first WebAssembly wrapper around `age`/`rage`.

It provides low-level encryption primitives for:

- X25519 key generation
- multi-recipient encryption
- recipient-based decryption
- passphrase encryption
- passphrase decryption
- explicit armored or binary ciphertext output

It is not:

- an identity manager
- a signing library
- an envelope format
- a product abstraction
- a mode-detecting convenience wrapper

## Async-first

All public APIs are asynchronous. You must initialize the WASM engine before use:

```ts
import { initRage } from "@ternent/rage";

await initRage();
```

## Multi-recipient example

```ts
import {
  initRage,
  generateKeyPair,
  encryptWithRecipients,
  decryptWithIdentity,
} from "@ternent/rage";

await initRage();

const alice = await generateKeyPair();
const bob = await generateKeyPair();
const plaintext = new TextEncoder().encode("shared secret");

const ciphertext = await encryptWithRecipients({
  recipients: [alice.publicKey, bob.publicKey],
  data: plaintext,
});

const decrypted = await decryptWithIdentity({
  identity: bob.privateKey,
  data: ciphertext,
});
```

## Passphrase example

```ts
import {
  initRage,
  encryptWithPassphrase,
  decryptWithPassphrase,
} from "@ternent/rage";

await initRage();

const ciphertext = await encryptWithPassphrase({
  passphrase: "correct horse battery staple",
  data: new TextEncoder().encode("passphrase secret"),
});

const decrypted = await decryptWithPassphrase({
  passphrase: "correct horse battery staple",
  data: ciphertext,
});
```

## Binary example

```ts
import { initRage, encryptWithRecipients } from "@ternent/rage";

await initRage();

const ciphertext = await encryptWithRecipients({
  recipients: ["age1..."],
  data: new Uint8Array([1, 2, 3, 4]),
  output: "binary",
});
```

## Relationship to `@ternent/armour-core`

`@ternent/rage` stays at the primitive encryption layer.

`@ternent/armour-core` is the place for:

- identity integration
- higher-level composition
- envelope formats
- opinionated product APIs
