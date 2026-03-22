# `@ternent/pixpax-concord` Specification

`@ternent/pixpax-concord` owns the Pixbook replay plugin and command ergonomics.

Hard invariants:

- `pixbook.claim-pack` is the ownership root
- `pixbook.record-pack-opened` never affects ownership or completion
- derived card instance ids are stable per claim entry plus slot index
- replay ignores invalid duplicate claims and records them as ledger-health issues
