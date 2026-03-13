# Button

## Purpose

Primary interactive action primitive for `ternent-ui` v2.
Use it for clicks, submissions, and lightweight link-style actions that still need the shared system silhouette.

## Category

Primitive

## Anatomy

- root element
- optional `leading` slot
- default label slot
- optional `trailing` slot
- optional loading spinner in the leading position

## Public API

Props:

- `as`: `"button" | "a" | "RouterLink"`; defaults to `"button"`
- `variant`: `primary | secondary | tertiary | critical | plain-primary | plain-secondary | critical-secondary`
- `size`: `micro | xs | sm | md | lg | xl`
- `type`: `button | submit | reset`; only applied when `as="button"`
- `disabled`: boolean
- `loading`: boolean

Slots:

- default: button label or content
- `leading`: leading icon or adornment
- `trailing`: trailing icon or adornment

Events:

- `click`: emitted when the control is activated and not inactive

## API decisions

- The current variant vocabulary is preserved intentionally because it already exists in the v2 seed and maps cleanly to the current token contract.
- The current six-step size scale is preserved intentionally because the repo already uses it in legacy button work and supporting design-system utilities.
- Polymorphism is deliberately restrained to `button`, `a`, and `RouterLink`.
- Link-like behavior should use `as="a"` with standard anchor attrs or `as="RouterLink"` with a `to` attr passed through from the app.

## Variants

- `primary`: main call to action
- `secondary`: neutral tonal emphasis
- `tertiary`: lighter tonal action
- `critical`: destructive primary action
- `plain-primary`: low-emphasis primary text action
- `plain-secondary`: low-emphasis neutral text action
- `critical-secondary`: outlined destructive secondary action

## Sizes

- `micro`: densest utility button
- `xs`: compact action
- `sm`: small control
- `md`: default control
- `lg`: emphasized action
- `xl`: largest standard action

## States

- default
- hover
- active
- focus-visible
- disabled
- loading

Notes:

- `loading` and `disabled` both make the control inactive.
- When `as="a"`, inactive state is enforced with `aria-disabled`, `tabindex="-1"`, and click prevention.

## Accessibility

- Native `<button>` semantics are used by default.
- Native `<a>` semantics are preserved when `as="a"`.
- `RouterLink` is treated as non-button navigation and receives the same inactive protection as anchor-like usage.
- Focus-visible treatment uses the shared `--ui-ring` token.
- Loading state exposes `aria-busy="true"`.
- Icon-only usage must still provide an accessible name via visible text, `aria-label`, or equivalent attrs.

## Token usage

The primitive uses only the current `--ui-*` contract:

- primary and critical action tokens
- tonal surface tokens
- ring token
- radius token
- shadow tokens
- duration and easing tokens
- interaction motion tokens

## Examples

```vue
<Button>Save changes</Button>
```

```vue
<Button variant="critical" type="submit">
  Delete record
</Button>
```

```vue
<Button as="a" href="/settings" variant="plain-secondary">
  Open settings
</Button>
```

```vue
<Button as="RouterLink" to="/app">
  Open app
</Button>
```

```vue
<Button loading>
  Saving
</Button>
```

```vue
<Button variant="secondary">
  <template #leading>
    <IconSearch />
  </template>
  Search
</Button>
```
