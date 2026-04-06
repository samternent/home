# AI Guidance

- This provider exists so the app works locally without backend registration.
- Keep persistence simple and browser-local unless a wider migration is requested.
- Provider-specific serialization belongs here; workspace/runtime logic does not.
- If you extend local persistence, preserve stable keys and backward-compatible reads.
