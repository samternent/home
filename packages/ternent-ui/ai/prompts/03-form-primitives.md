Using the hardened v2 Button as the canonical primitive template, implement the first form primitives.

Build:

- `Input`
- `Textarea`
- `Label`
- `FieldMessage`
- `FormField`

Placement:

- `Input`, `Textarea`, `Label`, and `FieldMessage` go in `src/primitives`
- `FormField` may go in `src/patterns` if that is the cleaner boundary

Requirements:

- token-only styling
- no raw Tailwind color utilities
- no arbitrary spacing or radius values
- keep APIs restrained and composable
- support disabled, focus-visible, and invalid states where relevant
- document each component with a spec markdown file
- use legacy components only as behavior reference where needed
- do not depend on legacy `S*` components

Also:

- ensure field composition patterns are consistent
- prefer a real form-system foundation rather than one-off input wrappers
- state any assumptions clearly
