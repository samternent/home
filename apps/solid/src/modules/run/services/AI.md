# AI Rules - Shared Services Layer

- If a feature explains ledger truth rather than domain meaning, it belongs here.
- Build reusable service contracts first, then small UI adapters on top.
- Avoid reimplementing history, verify, compare, or open-with per app.
- Keep services app-agnostic and workspace-aware.
- Service APIs should return enough metadata for explorer, dashboard, terminal, and Tasks surfaces.
- Trust policy and verification summaries should be explicit inputs and outputs, never hidden booleans.
- The default trust policy is verified-only.
- Terminal language belongs here as a runtime/service concern so different UIs, including `xterm.js`, can reuse the same command semantics.
- Follow `/Users/sam/dev/samternent/home/apps/solid/docs/run.shared-services-spec.md` as the canonical service spec.
- Prefer service state plus service actions over helper functions with hidden side effects.
- Explorer, terminal, dashboard, and Tasks must not invent parallel verification or history logic.
