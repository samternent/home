# @ternent/seal-cli

Seal signs files and manifests. It verifies artifacts offline. It emits portable proof JSON that `apps/seal` can verify in the browser without duplicate crypto logic.

## Install

```bash
pnpm add -D @ternent/seal-cli
```

## Environment

`@ternent/seal-cli` reads signer material from a v2 identity JSON payload:

```bash
export SEAL_IDENTITY="$(cat identity.json)"
# or
export SEAL_IDENTITY_FILE="./identity.json"
```

## Commands

```bash
seal manifest create --input apps/seal/dist --out apps/seal/dist/dist-manifest.json
seal sign --input apps/seal/dist/dist-manifest.json --out apps/seal/dist/proof.json
seal verify --proof apps/seal/dist/proof.json --input apps/seal/dist/dist-manifest.json --json
seal public-key --json
```

## GitHub Actions

Use the published GitHub Action:

```yaml
- name: Generate Seal artifacts
  uses: samternent/seal-action@v2
  env:
    SEAL_IDENTITY: ${{ secrets.SEAL_IDENTITY }}
  with:
    assets-directory: dist
    package-name: @ternent/seal-cli
    package-version: latest
```

The action is intentionally narrow. Your workflow still needs to:

- check out the repo
- set up Node
- build the static directory you want to sign

Inputs:

- `assets-directory`: built static directory to sign
- `working-directory`: base directory for path resolution
- `manifest-name`: manifest output filename
- `proof-name`: proof output filename
- `public-key-name`: public key output filename
- `package-name`: npm package name to execute when `cli-command` is omitted
- `package-version`: npm version or dist-tag to execute when `cli-command` is omitted
- `cli-command`: command prefix used to invoke Seal

Outputs:

- `manifest-path`
- `proof-path`
- `public-key-path`

The default path is npm-backed: if `cli-command` is empty, the action runs `npm exec --yes --package=<package-name>@<package-version> seal`.

## Schemas

Manifest:

```json
{
  "version": "1",
  "type": "seal-manifest",
  "root": "dist",
  "files": {
    "assets/index.js": "sha256:..."
  }
}
```

Proof:

```json
{
  "version": "2",
  "type": "seal-proof",
  "algorithm": "Ed25519",
  "createdAt": "2026-03-13T00:00:00.000Z",
  "subject": {
    "kind": "manifest",
    "path": "dist-manifest.json",
    "hash": "sha256:..."
  },
  "signer": {
    "publicKey": "BASE64URL-RAW-ED25519-PUBLIC-KEY",
    "keyId": "..."
  },
  "signature": "..."
}
```

Public key:

```json
{
  "version": "2",
  "type": "seal-public-key",
  "algorithm": "Ed25519",
  "publicKey": "BASE64URL-RAW-ED25519-PUBLIC-KEY",
  "keyId": "..."
}
```

## Frontend Contract

`apps/seal` verifies published artifacts by fetching:

- `/dist-manifest.json`
- `/proof.json`
- `/public-key.json` (optional)

Browser verification reuses `@ternent/seal-cli/proof`, `@ternent/seal-cli/crypto`, `@ternent/identity`, and `ternent-utils`.

Validation rules:

- parse `seal-proof`
- recompute the fetched manifest hash from raw bytes
- verify the embedded signature
- verify `signer.keyId`
- if `/public-key.json` exists, require its `publicKey` and `keyId` to match the proof signer

## Exit Codes

- `0` success
- `1` general failure
- `2` subject hash mismatch
- `3` signature invalid
- `4` invalid proof
- `5` key or config error
