# proof

Seal web app.

## Development

```bash
pnpm --filter proof dev
pnpm --filter proof test:unit
pnpm build:proof
```

## Proof Contract

The app signs and verifies the same Seal artifacts as `packages/seal-cli`.

Fetched published artifacts:

- `/dist-manifest.json`
- `/proof.json`
- `/public-key.json` (optional)

Browser verification checks:

- proof schema
- subject hash
- signature
- signer `keyId`
- algorithm
- optional `/public-key.json` consistency with the proof signer block

All browser crypto uses shared helpers from `seal-cli/proof`, `ternent-identity`, and `ternent-utils`.
