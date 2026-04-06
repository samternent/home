# AI Rules - Workspace Layer

- This is the system layer above replay, not a dumping ground for everything.
- Keep active context, selection, open surfaces, and routing state explicit.
- `WorkspaceState` is the canonical shared state contract. Extend it; do not fork it.
- Workspace services may coordinate storage, ledger, replay, and schema modules, but should not reimplement them.
- Route components should read from this layer instead of rebuilding orchestration logic inline.
- Preserve trust boundaries instead of hiding them behind convenience state.
- Do not treat Solid as the workspace substrate. Workspace orchestrates provider-backed mounts; providers own their own implementation details.
