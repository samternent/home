Continue building out the design-system v2 layer using the established component template and docs.

Build next:

- `Accordion`
- `Tabs`
- `Menu`
- `Badge`
- `Card`
- `Spinner`
- `Skeleton`
- `Separator`

Requirements:

- use Ark UI for `Accordion`, `Tabs`, and `Menu` where appropriate
- keep `Badge`, `Card`, `Spinner`, `Skeleton`, and `Separator` simple and token-driven
- avoid forcing Ark UI into purely presentational components
- keep APIs small and consistent
- add or update exports intentionally
- add `*.spec.md` files

Also:

- identify any places where a future `Pattern` layer is the better home than `src/primitives`
- call out any token gaps discovered during implementation
