# Design-system PR checklist

## Summary

What was added or changed?

## Classification

- [ ] Primitive
- [ ] Pattern
- [ ] Token change
- [ ] Docs only
- [ ] Refactor

## Checks

- [ ] New reusable UI was added in `src/primitives` or `src/patterns`, not legacy `S*`
- [ ] Styling uses existing semantic `--ui-*` tokens only
- [ ] No raw Tailwind color utilities were introduced in primitives
- [ ] No arbitrary visual values were introduced without updating the contract
- [ ] Variants and sizes are documented
- [ ] Accessibility expectations are documented
- [ ] Relevant exports were updated
- [ ] `*.spec.md` files were added or updated
- [ ] The change is product-agnostic if placed in the shared design-system layer

## Notes for reviewers

Document any API decisions, migration notes, or token gaps discovered.
