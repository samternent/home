Implement the first overlay and disclosure primitives for `ternent-ui` using the design-system rules.

Build:

- `Dialog`
- `Drawer`
- `Tooltip`
- `Popover`

Requirements:

- use Ark UI where appropriate for accessibility and state management
- keep APIs restrained and composable
- support token-driven theming only
- avoid per-theme component branching
- ensure focus behavior and keyboard handling are documented
- add `*.spec.md` files

Use the existing legacy components only as behavior reference where useful.
Do not reproduce old APIs blindly.

Where there is overlap between `Dialog` and `Drawer`, prefer shared patterns in structure and state naming without over-abstracting too early.
