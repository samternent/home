# Solid Provider

Purpose:

- adapt Solid session and Pod-root discovery into the shared run storage-provider contract
- expose Solid mounts and browse/create capabilities without making Solid the runtime substrate
- keep legacy Solid-specific state available only for transitional code paths

Rules:

- this folder owns Solid auth-adjacent storage discovery, not replay or verification
- Solid may cache identities for bootstrap and recovery, but it must not provision or define the active runtime identity
- provider-agnostic consumers should use `run/workspace` registries and runtime, not import from here directly
- if legacy compatibility is required, route it through `useRunWorkspaceSource.ts` and keep that shim thin
