Implement the first Ark-backed choice controls for `ternent-ui`.

Build:

- `Checkbox`
- `RadioGroup`
- `Switch`

Requirements:

- use Ark UI as the accessibility and state foundation
- expose a clean system-level API on top
- keep styling token-driven using existing `--ui-*` tokens
- keep class logic separate from render logic when practical
- include `*.spec.md` files
- document keyboard and accessibility behavior clearly
- do not introduce app-specific opinions into the primitives

Before implementing, inspect existing legacy components only for behavior or usage cues if useful.
Do not port line by line.

Also verify:

- consistent size handling
- consistent invalid and disabled handling where applicable
- consistent focus-visible treatment with Button and Input
