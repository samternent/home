# CLAUDE.md

Tasks module guidance:
- Base on system users + permissions; do not implement separate in-module membership.
- For restricted tasks, use ledger-native protected entries (`protection: recipients`), not custom encrypted fields inside plain payloads.
- Enforce command-side checks: actor matches signer, audience access, assignee eligibility.
- Keep list and board as consistent projections over the same task records.
- Generate IDs; do not rely on user-provided or title-derived IDs.
