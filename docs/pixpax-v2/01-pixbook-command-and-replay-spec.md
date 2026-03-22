# PixPax v2 Pixbook Command And Replay Spec

## Commands

### `pixbook.claim-pack`

Records a valid issuer-signed pack artifact into the Pixbook.

Success means:

- a valid issuer proof was presented
- this Pixbook accepted that issuance into its own history
- replay may derive ownership from the claim

It does not imply universal exclusivity. Uniqueness is policy-specific.

### `pixbook.record-pack-opened`

Records reveal/open UX state only.

This command must never affect:

- ownership
- duplicates
- completion
- transfer eligibility

### `pixbook.set-display-profile`

Stores player-facing profile metadata for local product surfaces.

## Replay Rules

- ownership derives from `claim-pack`
- owned card instances derive from `claimEntryId + slotIndex`
- duplicate counts derive from owned card instances
- completion derives from owned card instances plus collection catalog
- opened state derives only from `record-pack-opened`
- invalid duplicate claims are ignored for ownership and logged as ledger-health issues
