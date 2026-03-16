# seal

Seal web app.

## Development

```bash
pnpm sync:ternent-app -- --app apps/seal
pnpm --filter seal dev
pnpm --filter seal test:unit
pnpm build:seal
```

Landing-page copy, theme selection, and marketing snippets live in `app.yaml`.

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

All browser crypto uses shared helpers from `@ternent/seal-cli/proof`, `ternent-identity`, and `ternent-utils`.
