# PixPax Beta Release Checklist

## Domain and project

- Vercel project created for `apps/pixpax`
- production domain attached: `beta.pixpax.xyz`
- repo secret set: `VERCEL_PIXPAX_PROJECT_ID`
- repo secret set: `VERCEL_ORG_ID`
- repo secret set: `VERCEL_TOKEN`

## PixPax app env

- `VITE_TERNENT_API_URL=https://api.ternent.dev`
  - optional in code, but set it explicitly for beta

## PixPax app config

- `apps/pixpax/app.yaml` host is `beta.pixpax.xyz`
- generated app config resolves `defaultHost` to `beta.pixpax.xyz`

## API base env

- `AUTH_SECRET`
- `AUTH_BASE_URL=https://api.ternent.dev/v1/auth`
- `DATABASE_URL`
- `CORS_ALLOW_ORIGINS=https://beta.pixpax.xyz`
- `AUTH_TRUSTED_ORIGINS=https://beta.pixpax.xyz`

## Passkeys and account auth

- `AUTH_PASSKEY_RP_ID=beta.pixpax.xyz`
- `AUTH_PASSKEY_RP_NAME=PixPax Beta`
- `AUTH_PASSKEY_ORIGINS=https://beta.pixpax.xyz`

## OTP delivery

Use one of:

- `RESEND_API_KEY`
- `RESEND_FROM`
- optional `RESEND_REPLY_TO`

Or SMTP:

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`
- optional `SMTP_SECURE`

## PixPax v2 release env

- `PIX_PAX_PUBLIC_APP_URL=https://beta.pixpax.xyz`
- `PIX_PAX_V2_AVAILABLE_COLLECTIONS=<live-book-id@version>`
- `PIX_PAX_ADMIN_TOKEN=<strong-admin-token>`
- `SEAL_IDENTITY=<issuer-identity-json>`
  - or `SEAL_IDENTITY_FILE`

## PixPax content and ledger env

- `LEDGER_S3_ENDPOINT`
- `LEDGER_CONTENT_BUCKET`
  - or `LEDGER_BUCKET`
- `LEDGER_CONTENT_PREFIX`
- `LEDGER_REGION`
- `LEDGER_ACCESS_KEY_ID`
- `LEDGER_SECRET_ACCESS_KEY`
- optional `LEDGER_S3_FORCE_PATH_STYLE`

## Pixbook cloud storage env

- `PIXBOOK_LEDGER_BUCKET`
  - optional if reusing content bucket
- `PIXBOOK_LEDGER_PREFIX`
- `PIXBOOK_RECEIPTS_PREFIX`

## Recommended rate limiting

- `RATE_LIMIT_PIXPAX_REDEEM_WINDOW_MS=60000`
- `RATE_LIMIT_PIXPAX_REDEEM_MAX=20`

## GitHub Actions deploy secrets

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PIXPAX_PROJECT_ID`
- `SEAL_IDENTITY`

## Live smoke flow

1. Open `https://beta.pixpax.xyz`
2. Start family sign-in with OTP
3. Add passkey on beta domain
4. Redeem a designated pack
5. Open pack and confirm Pixbook update
6. Create a swap from a duplicate
7. Accept the swap from a second Pixbook
8. Complete the sent swap on the sender side
