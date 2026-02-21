# Prompt — AI Agent (Planning Mode)

You are working in Sam's monorepo (concord + ternent-api).

Implement PixPax Drops with **ECDSA-only v2 signed tokens**. There is no legacy support and no HMAC.

Read and follow these docs (in this folder):
1) `AI.md`
2) `SPEC.md`
3) `PLAN.md`
4) `CHECKLIST.md`

Hard constraints:
- No artificial rarity weighting (no probability tables, no hidden odds)
- No dark patterns
- Kid-safe defaults (no login required to redeem, no PII)
- Honest verification (offline authenticity vs online single-use enforcement)
- Avoid big refactors; implement as additive modules

Deliverables:
- Backend: issuer registry + ECDSA token signing + issuer endpoints + redeem route + receipts
- Fixed-card drops: token commits to cardId; mint bypasses randomness
- Frontend: scan/redeem UX verifies tokens offline
- Tests: signing, verification, idempotency, fixed-card correctness
- Docs: update repo README to point to these specs

Before coding, produce:
- File-level implementation plan referencing exact modules/routes to touch
- Minimal test plan
Then implement in small PR-sized steps.
