# ternent-ui v2 roadmap

## Objective

Move `ternent-ui` from a mixed-era UI library into a coherent v2 design-system core built around `src/primitives` and safe for AI-driven expansion.

## Phase 0: freeze and contract

- freeze `src/components/S*` for new reusable work
- land AI governance docs
- confirm token consumption rules
- confirm primitive vs pattern boundary

## Phase 1: establish gold standards

- harden `Button`
- build `Input`
- build `Textarea`
- build `Label`
- build `FieldMessage`
- build `FormField`

Outcome:

A stable form foundation and a canonical primitive implementation pattern.

## Phase 2: choice controls and core feedback

- build `Checkbox`
- build `RadioGroup`
- build `Switch`
- build `Badge`
- build `Card`
- build `Spinner`
- build `Skeleton`
- build `Separator`

Outcome:

A reliable set of common controls and presentational system primitives.

## Phase 3: overlays and navigation

- build `Dialog`
- build `Drawer`
- build `Tooltip`
- build `Popover`
- build `Accordion`
- build `Tabs`
- build `Menu`

Outcome:

A usable interactive system for app chrome and common workflows.

## Phase 4: advanced input and selection

- build `Select`
- build `Combobox`
- evaluate command-style search and listbox patterns

Outcome:

A fuller form and interaction layer.

## Phase 5: patterns

- build `PageHeader`
- build `EmptyState`
- build `SearchField`
- build `FilterBar`
- build `SidebarNav`
- build `AppShell`
- build `CommandMenu`

Outcome:

A reusable layer for real app composition without polluting primitives.

## Phase 6: migration and cleanup

- migrate one real consumer to v2 primitives
- identify gaps from real-world usage
- add compatibility wrappers only where justified
- retire legacy `S*` components gradually

Outcome:

A proven v2 system grounded in actual product usage.
