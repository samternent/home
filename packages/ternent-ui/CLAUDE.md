# CLAUDE.md

`ternent-ui` is shared UI infrastructure, not app-specific product logic.

- Prefer `primitives` and `patterns`; treat legacy `components` as compatibility layer.
- Keep APIs accessible, composable, and theme-token driven.
- Do not embed Concord app rules or ledger assumptions into UI primitives.
- Maintain SSR-safe and testable behavior for interactive components.
