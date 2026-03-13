# Migration strategy

## High-level approach

Do not attempt a line-by-line rewrite of legacy `S*` components.
Treat the current repo as having two systems:

- legacy `S*` components
- v2 primitive seed under `src/primitives`

The goal is not to drag the legacy system forward.
The goal is to mine it for behavior and usage lessons while intentionally rebuilding the future surface.

## Rules

1. freeze legacy for new reusable work
2. rebuild v2 primitives intentionally
3. use legacy only as behavior reference
4. validate v2 in at least one real consumer early
5. add compatibility wrappers only if they reduce migration pain without polluting the v2 API

## Classification first

Before rebuilding any legacy component, classify it.

### Primitive candidates

- `SButton`
- `SInput`
- `STextarea`
- `SAlert` possibly split into primitive and pattern concerns
- `SBadge`
- `SCard`
- `SSpinner`
- `SSkeleton`
- `SDialog`
- `STabs`
- `SMenu`
- `SDisclosure`
- `SRadioGroup`

### Likely pattern candidates

- `SBreadcrumbs`
- `SNavTabs`
- `SNavBar`
- `SSidebar`
- `SHeader`
- `SBrandHeader`
- `SFooter`
- `SListButton`

### Needs separate judgment

- `STreeView`
- `SResizablePanels`
- `SResizer`
- `SFileInput`
- `SSegmentedControl`
- `SDrawerLeft`
- `SDrawerRight`

Some of these may become primitives, some patterns, and some may not belong in the shared system at all.

## Suggested migration order

1. Button
2. Input
3. Textarea
4. Label and field support
5. Checkbox / RadioGroup / Switch
6. Badge / Card / Spinner / Skeleton / Separator
7. Dialog / Drawer / Tooltip / Popover
8. Tabs / Accordion / Menu
9. advanced selection and patterns

## Consumer validation

After the first wave of primitives, migrate one real consumer screen or app area.
Do this before building the whole world.
Real usage will reveal API and token gaps much faster than isolated component work.

## Deletion strategy

Do not delete legacy components immediately.
Only remove them when:

- a real v2 replacement exists
- at least one consumer has been updated or a clear compatibility path exists
- the replacement has a documented API and states

## Success condition

Migration is succeeding when:

- new work lands only in `src/primitives` and `src/patterns`
- token usage becomes more consistent
- the system feels visually related across themes
- consumer apps can rebuild UI from v2 primitives without depending on legacy `S*`
