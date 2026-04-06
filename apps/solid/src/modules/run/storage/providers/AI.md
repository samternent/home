# AI Guidance

- Treat this folder as provider implementation territory, not workspace orchestration.
- Preserve the shared contract in `run/storage/types.ts` as the source of truth for cross-provider behaviour.
- Keep provider-specific session, auth, and mount discovery local to the provider folder.
- Do not push provider assumptions upward into `run/workspace`, `run/services`, `run/surfaces`, or `run/core`.
- If you add a new provider, also add or update tests around the provider registry and workspace runtime seam.
