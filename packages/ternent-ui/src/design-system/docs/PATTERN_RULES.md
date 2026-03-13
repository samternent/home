# PATTERN_RULES

## Goal

Patterns are reusable compositions built from primitives.
They provide common UI arrangements without turning the core primitive layer into an app-specific dumping ground.

## What belongs in `src/patterns`

Patterns should be:

- composed from existing primitives
- reusable across products or screens
- somewhat opinionated in structure
- still independent from business logic

Examples:

- FormField
- SearchField
- PageHeader
- EmptyState
- FilterBar
- SidebarNav
- AppShell
- CommandMenu

## What does not belong in `src/patterns`

Do not place business or domain-specific components here.
Examples of components that do not belong here:

- billing-specific cards
- product-only dashboard widgets
- card reveal flows
- domain-specific tables with business logic built in

## Pattern rules

1. patterns must be composed from primitives first
2. patterns may add layout and grouping opinion
3. patterns must still consume tokens, not raw visual values
4. patterns may not bypass primitive behavior or accessibility contracts
5. patterns should avoid owning business data transformations

## API guidance

Pattern APIs should remain relatively small.
Patterns should expose only the knobs that are likely to matter broadly.
If a pattern needs many highly product-specific switches, it is probably not a pattern.

## Typical pattern structure

```txt
Pattern/
  Pattern.vue
  Pattern.types.ts
  Pattern.spec.md
```

A `Pattern.variants.ts` file is optional if the pattern has enough variant logic to justify it.

## Relationship to app code

Applications should prefer using patterns where they fit.
If a product needs a highly specific composition, build that in the product app rather than force it into the shared package.

## Review checklist

Before adding a pattern, confirm:

- is it composed from primitives?
- is it still product-agnostic?
- does it belong above primitives but below app code?
- is its API restrained?
- is it documented?
