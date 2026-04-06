# Local Provider

Purpose:

- provide a zero-backend workspace mount that persists in the current browser
- keep the runtime usable before any external provider is connected
- act as the default local persistence layer for early workspace flows

Rules:

- persist only provider-owned browse data here
- do not treat local storage as ledger truth; it is still storage, not replay truth
- keep the provider contract aligned with `run/storage/types.ts`
- avoid leaking browser-storage details upward into workspace, services, or surfaces
