# PixPax v2 Beta Release Checklist

## Release Goal

Ship a production-ready, small-audience beta for printed PixPax sticker packs.

Release assumptions:

- one active v2 collection/drop
- QR and redeem-link driven discovery
- local-first Pixbook remains the source of truth
- family backup/recovery is available as convenience, not authority
- no live merge sync

## 1. Technical Architecture

### Concord / ledger

- [ ] Confirm the player app uses `@ternent/concord` and `@ternent/ledger` exclusively through workspace package builds, not source aliases.
- [ ] Confirm the Pixbook runtime only writes through Concord commands in [usePixbookSession.ts](/Users/sam/dev/samternent/home/apps/pixpax/src/modules/pixbook/usePixbookSession.ts).
- [ ] Confirm replay remains the only truth path for ownership and progress.
- [ ] Confirm no cached derived Pixbook state is shown before replay completes.
- [ ] Confirm `pixbook.record-pack-opened` affects reveal/history only and not ownership or completion.

### Package build integrity

- [ ] Rebuild and validate `@ternent/ledger`, `@ternent/concord`, and `@ternent/pixpax-concord` with clean JS output.
- [ ] Resolve the `vite-plugin-dts` `rootDir` issues in [packages/concord](/Users/sam/dev/samternent/home/packages/concord) so the package build is clean and repeatable.
- [ ] Confirm package `exports` point to real built artifacts.
- [ ] Confirm runtime packages declare `"sideEffects": false` where appropriate.

### Bundle / performance

- [ ] Keep route-level lazy loading in [apps/pixpax/src/routes/index.ts](/Users/sam/dev/samternent/home/apps/pixpax/src/routes/index.ts).
- [ ] Keep Concord runtime lazy-loaded from [usePixbookSession.ts](/Users/sam/dev/samternent/home/apps/pixpax/src/modules/pixbook/usePixbookSession.ts).
- [ ] Keep auth/passkey client lazy-loaded from [usePixpaxFamilyAccount.ts](/Users/sam/dev/samternent/home/apps/pixpax/src/modules/family/usePixpaxFamilyAccount.ts).
- [ ] Confirm oversized JS chunks are not forced into PWA precache in [apps/pixpax/vite.config.ts](/Users/sam/dev/samternent/home/apps/pixpax/vite.config.ts).
- [ ] Measure first-load, redeem-load, and Pixbook-load performance on a realistic mobile device.

## 2. Product Reliability

### Identity / persistence

- [ ] Confirm local child identity survives refresh and browser restart.
- [ ] Confirm local Pixbook survives refresh and browser restart.
- [ ] Confirm IndexedDB migration from old `localStorage` snapshots works at least once on a real upgraded browser profile.
- [ ] Confirm adult family session rehydrates automatically on reload.

### Redemption / claim flow

- [ ] Issue a real designated code from `/app/admin`.
- [ ] Open the QR/redeem link in the player app.
- [ ] Claim the pack.
- [ ] Run the full reveal flow in [RouteRedeem.vue](/Users/sam/dev/samternent/home/apps/pixpax/src/routes/redeem/RouteRedeem.vue).
- [ ] Refresh after claim and confirm the stickers are still present.
- [ ] Retry the same code with the same claimant and confirm recoverable behavior.
- [ ] Retry the same code with a different claimant and confirm correct rejection.
- [ ] Confirm hyphenated redeem codes display and accept both hyphenated and non-hyphenated input.

### Family recovery

- [ ] Save a child identity to family backup from [RouteAppSettingsFamily.vue](/Users/sam/dev/samternent/home/apps/pixpax/src/routes/app/settings/RouteAppSettingsFamily.vue).
- [ ] Save a Pixbook snapshot for that child.
- [ ] Recover the same child on a second device/browser.
- [ ] Open the recovered Pixbook and confirm the same claimed stickers appear.
- [ ] Confirm wrong passphrase fails safely.
- [ ] Confirm a local delete does not remove the family-saved copy.

## 3. Admin / Operator Readiness

### Issuance

- [ ] Issue a random designated pack from [RouteAppAdmin.vue](/Users/sam/dev/samternent/home/apps/pixpax/src/routes/app/RouteAppAdmin.vue).
- [ ] Issue a fixed-card designated pack from the same route.
- [ ] Confirm the preview QR links into the player app, not the API.
- [ ] Confirm bulk sheet generation renders correctly for print.

### Code management

- [ ] Confirm recent codes list loads with statuses: `unused`, `claimed`, `revoked`.
- [ ] Confirm filtering by collection/drop works.
- [ ] Confirm revoking a code prevents redemption.
- [ ] Confirm already-claimed codes stay visible with claim metadata.

### Environment / signing

- [ ] Confirm `SEAL_IDENTITY_FILE` is configured correctly for the deployment environment.
- [ ] Confirm v2 admin issuance uses Seal-based signing only.
- [ ] Confirm redeem URLs point to the correct beta app host.

## 4. Design / UX QA

### Player flow

- [ ] Landing page clearly explains what PixPax is in one scan.
- [ ] Main app shell feels like a kid-facing stickerbook, not a dashboard.
- [ ] The main Pixbook page keeps one clear next action.
- [ ] The active identity indicator is lightweight and understandable.
- [ ] Series separators in [StickerbookCollectionScene.vue](/Users/sam/dev/samternent/home/apps/pixpax/src/modules/stickerbook/components/StickerbookCollectionScene.vue) have enough spacing and hierarchy.
- [ ] Card sizing, spacing, shimmer, and shiny treatment feel special and readable on mobile.
- [ ] The reveal flow feels magical but still clear.

### Parent / family tasks

- [ ] Family backup copy is understandable without technical language.
- [ ] Recovery steps are obvious and low-risk.
- [ ] Settings do not dominate the product experience.
- [ ] Any remaining legacy/archive surfaces are either simplified or hidden for beta.

## 5. Release Rehearsal

- [ ] Run one full internal rehearsal with printed test cards.
- [ ] Run one second-device recovery rehearsal.
- [ ] Record final beta environment variables and deployment steps.
- [ ] Freeze the first drop content bundle.
- [ ] Freeze admin operator instructions for issuance, revoke, and recovery support.

## Exit Criteria

Beta release is green only when:

- Concord replay is the only truth path
- redeem/claim/reload/recover all work end-to-end
- family backup works on at least two real devices
- admin issuance and revoke are operationally usable
- the player experience is clear enough for kids and parents without explanation from the dev team
