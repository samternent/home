# CHECKLIST — PR / Review Gate

## Must-pass checks
- [ ] HMAC code signing removed entirely
- [ ] Token format is v2 ECDSA-only
- [ ] Issuer registry + endpoints exist
- [ ] Client verifies token authenticity offline
- [ ] Server enforces single-use idempotently
- [ ] Redemption returns a signed receipt
- [ ] Fixed-card redeem bypasses randomness completely
- [ ] No probability weighting tables added
- [ ] No PII added / required for redemption
- [ ] Pending vs final states are honest
- [ ] Docs are linked from repo root README

## Nice-to-haves (later)
- [ ] CBOR payload encoding
- [ ] Secure NFC tags
- [ ] Series progress UI
- [ ] Printable PDF booklet generator
