---
"ternent-api": patch
"concord": patch
---

Stabilize PixPax account identity behavior and migration cutover paths, add deterministic switch/read flows, and improve redeem code operations.

- Add explicit account-scoped identity/pixbook refresh on identity switch and remove implicit auto-selection behavior.
- Move PixPax creator/admin/analytics views into main layout while preserving route auth guards.
- Improve redeem UX with explicit expired/revoked error messaging.
- Increase redeem token max TTL policy (configurable; default 10 years) and default admin issuance to 1 year.
- Add admin code revocation endpoint and UI controls, including redeem-time revoked enforcement.
