# @ternent/identity

Ed25519 identity utilities with mnemonic support, signing, verification,
X25519 derivation, and Age-compatible key helpers.

---

## Install

```bash
pnpm add @ternent/identity
# or
npm install @ternent/identity
# or
yarn add @ternent/identity
```

---

## Quick Start

### Create Identity

```ts
import { createIdentity } from "@ternent/identity";

const identity = await createIdentity();

console.log(identity.publicKey);
console.log(identity.keyId);
```

### Create Mnemonic Identity

```ts
import { createMnemonicIdentity } from "@ternent/identity";

const { mnemonic, identity } = await createMnemonicIdentity({ words: 12 });

console.log(mnemonic);
console.log(identity);
```

### Restore From Mnemonic

```ts
import { createIdentityFromMnemonic } from "@ternent/identity";

const identity = await createIdentityFromMnemonic({
  mnemonic:
    "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about",
});
```

---

## Signing

### Sign UTF-8

```ts
import { signUtf8 } from "@ternent/identity";

const signature = await signUtf8(identity, "hello world");
```

### Verify UTF-8

```ts
import { verifyUtf8 } from "@ternent/identity";

const ok = await verifyUtf8(identity.publicKey, "hello world", signature);
```

### Custom Context

```ts
await signUtf8(identity, "payload", { context: "my-app/v1" });
```

---

## Mnemonics

### Generate

```ts
import { generateMnemonic } from "@ternent/identity";

const mnemonic = generateMnemonic({ words: 24 });
```

### Validate

```ts
import { validateMnemonic } from "@ternent/identity";

const valid = validateMnemonic(mnemonic);
```

---

## Identity Utilities

### Parse

```ts
import { parseIdentity } from "@ternent/identity";

const identity = parseIdentity(json);
```

### Serialize

```ts
import { serializeIdentity } from "@ternent/identity";

const json = serializeIdentity(identity);
```

### Validate Integrity

```ts
import { validateIdentity } from "@ternent/identity";

await validateIdentity(identity);
```

---

## Public Key & Key ID

### Derive Public Key

```ts
import { derivePublicKey } from "@ternent/identity";

const publicKey = await derivePublicKey(seed);
```

### Derive Key ID

```ts
import { deriveKeyId } from "@ternent/identity";

const keyId = await deriveKeyId(publicKey);
```

---

## Raw Signing

### Sign Bytes

```ts
import { signBytes } from "@ternent/identity";

const signature = await signBytes(identity, bytes);
```

### Verify Bytes

```ts
import { verifyBytes } from "@ternent/identity";

const ok = await verifyBytes(identity.publicKey, bytes, signature);
```

---

## X25519 & Age

### X25519 Private Key

```ts
import { deriveX25519PrivateKey } from "@ternent/identity";

const privateKey = await deriveX25519PrivateKey(identity);
```

### X25519 Public Key

```ts
import { deriveX25519PublicKey } from "@ternent/identity";

const publicKey = await deriveX25519PublicKey(identity);
```

### Convert Ed25519 → X25519

```ts
import { convertEd25519PublicKeyToX25519PublicKey } from "@ternent/identity";

const x25519 = await convertEd25519PublicKeyToX25519PublicKey(
  identity.publicKey,
);
```

### Age Recipient

```ts
import { deriveAgeRecipient } from "@ternent/identity";

const recipient = await deriveAgeRecipient(identity);
```

### Age Secret Key

```ts
import { deriveAgeSecretKey } from "@ternent/identity";

const secret = await deriveAgeSecretKey(identity);
```

---

## Types

```ts
type MnemonicWordCount = 12 | 24;

type SerializedIdentity = {
  format: "ternent-identity";
  version: "2";
  algorithm: "Ed25519";
  createdAt: string;
  publicKey: string;
  keyId: string;
  material: {
    kind: "seed";
    seed: string;
  };
};
```

---

MIT License
