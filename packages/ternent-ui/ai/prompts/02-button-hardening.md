Audit the existing `src/primitives/Button/*` implementation and harden it into the canonical primitive template for the design system.

Goals:

- preserve good existing behavior where sensible
- align structure and naming with the design-system docs
- keep styling token-driven
- keep render logic small
- ensure states are explicit and consistent
- create or update `Button.spec.md`

Requirements:

- inspect legacy `src/components/SButton.vue` only for behavioral reference if needed
- do not copy legacy implementation details blindly
- keep the component in `src/primitives/Button`
- review the current variant vocabulary in `Button.types.ts` and either preserve it intentionally or rationalize it clearly
- review whether the current size scale in `Button.types.ts` is justified
- use `Button.props.ts`, `Button.types.ts`, `Button.variants.ts`, `Button.vue`, and `Button.spec.md`
- update exports if needed
- do not assume any primitive `*.spec.md` files already exist; create the first one as part of this task if needed

Output should include:

- summary of what changed
- any API decisions made
- any follow-up recommendations for alignment with future primitives
