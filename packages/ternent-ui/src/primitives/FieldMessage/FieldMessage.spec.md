# FieldMessage

## Purpose

Supporting field copy primitive for descriptions, hints, and validation messages.

## Category

Primitive

## Public API

Props:

- `id`: string
- `size`: `sm | md | lg`
- `tone`: `muted | critical`

## Accessibility

- uses a simple text container
- critical messages use `role="alert"`
- designed to be referenced from controls via `aria-describedby`

## Examples

```vue
<FieldMessage id="email-help">We will never share your email.</FieldMessage>
```

```vue
<FieldMessage id="email-error" tone="critical">
  Enter a valid email address.
</FieldMessage>
```
