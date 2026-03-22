---
"ternent-api": patch
"@ternent/pixpax-issuer": patch
"@ternent/seal-cli": patch
---

Fix ternent-api deploy packaging by building the proof-only Seal surface used by PixPax issuer and including the missing runtime package outputs in the image build.
