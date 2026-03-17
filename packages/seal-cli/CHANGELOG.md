# @ternent/seal-cli

## 0.3.2

### Patch Changes

- [`e3b14dab10ce8da5b875826383c71283cbd5b99c`](https://github.com/samternent/home/commit/e3b14dab10ce8da5b875826383c71283cbd5b99c) Thanks [@samternent](https://github.com/samternent)! - Adds create identity to seal-cli

## 0.3.1

### Patch Changes

- [`ee7aa501b6a57f0896e9a3b8c13c3446f8751a5a`](https://github.com/samternent/home/commit/ee7aa501b6a57f0896e9a3b8c13c3446f8751a5a) Thanks [@samternent](https://github.com/samternent)! - Fix the package runtime dependency graph by shipping `@ternent/identity` and `ternent-utils` as production dependencies. This prevents browser consumers that bundle Seal proof helpers from source from failing to resolve `@ternent/identity` during app builds.

## 0.3.0

### Minor Changes

- [`f364cb7d38f18770d32fe4a628b3c8b4bcccc31f`](https://github.com/samternent/home/commit/f364cb7d38f18770d32fe4a628b3c8b4bcccc31f) Thanks [@samternent](https://github.com/samternent)! - Introduce the new `@ternent/identity` package with Ed25519 signing, BIP-39 mnemonic recovery, Noble-backed Curve25519 conversion helpers, and versioned JSON identity exports. Migrate `@ternent/seal-cli` and the Seal web app to the seed-material envelope format, `SEAL_IDENTITY` configuration, and Ed25519 proof artifacts while keeping `ternent-identity` as the documented legacy package for existing Concord and PixPax consumers.

## 0.2.0

### Minor Changes

- [`f364cb7d38f18770d32fe4a628b3c8b4bcccc31f`](https://github.com/samternent/home/commit/f364cb7d38f18770d32fe4a628b3c8b4bcccc31f) Thanks [@samternent](https://github.com/samternent)! - Introduce the new `@ternent/identity` package with Ed25519 signing, X25519 bridge helpers, and versioned JSON identity exports. Migrate `@ternent/seal-cli` and the Seal web app to the new identity format, `SEAL_IDENTITY` configuration, and Ed25519 proof artifacts while keeping `ternent-identity` as the documented legacy package for existing Concord and PixPax consumers.

### Patch Changes

- [`f364cb7d38f18770d32fe4a628b3c8b4bcccc31f`](https://github.com/samternent/home/commit/f364cb7d38f18770d32fe4a628b3c8b4bcccc31f) Thanks [@samternent](https://github.com/samternent)! - Move idenity algo with v2

## 0.1.8

### Patch Changes

- [`e694239710abbe9ab15bd386901f34334f7692e5`](https://github.com/samternent/home/commit/e694239710abbe9ab15bd386901f34334f7692e5) Thanks [@samternent](https://github.com/samternent)! - code deletion and renaming

## 0.1.7

### Patch Changes

- [`ba97b4b9466f7c16a7226609f8047e5367afdd70`](https://github.com/samternent/home/commit/ba97b4b9466f7c16a7226609f8047e5367afdd70) Thanks [@samternent](https://github.com/samternent)! - Update seal publish

## 0.1.6

### Patch Changes

- [`44a52fc20be15459f3771f37a002d5ea40068d10`](https://github.com/samternent/home/commit/44a52fc20be15459f3771f37a002d5ea40068d10) Thanks [@samternent](https://github.com/samternent)! - Bump version with action

## 0.1.5

### Patch Changes

- [`be5ecca6e2c9db462407c4edd6d3f668c5d51060`](https://github.com/samternent/home/commit/be5ecca6e2c9db462407c4edd6d3f668c5d51060) Thanks [@samternent](https://github.com/samternent)! - Publish seal-cli

## 0.1.4

### Patch Changes

- [`0b11c7d885e591fb1c9f373d209abe9d9f9dfb61`](https://github.com/samternent/home/commit/0b11c7d885e591fb1c9f373d209abe9d9f9dfb61) Thanks [@samternent](https://github.com/samternent)! - Seal publsh bump

## 0.1.3

### Patch Changes

- [`d1ffa2ed2d23d6c007ab829c0c4d4fd026ce188b`](https://github.com/samternent/home/commit/d1ffa2ed2d23d6c007ab829c0c4d4fd026ce188b) Thanks [@samternent](https://github.com/samternent)! - Update seal-cli scoping

## 0.1.2

### Patch Changes

- [`fd130eb5815c2ea636f66acb5a81c947c4081d95`](https://github.com/samternent/home/commit/fd130eb5815c2ea636f66acb5a81c947c4081d95) Thanks [@samternent](https://github.com/samternent)! - Adds to publish script

## 0.1.1

### Patch Changes

- [`36dd9bfac417eba61b8e81756cf15a3d3ac7a216`](https://github.com/samternent/home/commit/36dd9bfac417eba61b8e81756cf15a3d3ac7a216) Thanks [@samternent](https://github.com/samternent)! - Adds cli and GHA
