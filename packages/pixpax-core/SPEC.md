# `@ternent/pixpax-core` Specification

`@ternent/pixpax-core` owns PixPax v2 domain contracts and deterministic derivation.

Hard invariants:

- card instance ids are deterministic for claim entry id plus slot index
- deterministic issuance inputs are canonicalized and versioned
- `record-pack-opened` never affects ownership
- ownership derives from claim and transfer replay only
- this package contains no Concord-specific runtime abstractions
