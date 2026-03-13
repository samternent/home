# FormField

## Purpose

Composable field pattern that binds label, control, description, and message content without turning `Input` or `Textarea` into one-off wrappers.

## Category

Pattern

## Public API

Props:

- `id`: explicit base id for the field
- `label`: string
- `description`: string
- `message`: string
- `invalid`: boolean
- `disabled`: boolean
- `required`: boolean
- `size`: `sm | md | lg`

Default slot props:

- `id`
- `describedBy`
- `invalid`
- `disabled`
- `required`

Named slots:

- `label`
- `description`
- `message`

## Behavior

- generates a stable fallback id when one is not provided
- composes `Label` and `FieldMessage` primitives
- exposes `describedBy` so the control can wire `aria-describedby`
- uses `critical` tone for the message when `invalid` is true

## Example

```vue
<FormField
  id="email"
  label="Email"
  description="We will never share your email."
  :message="emailError"
  :invalid="Boolean(emailError)"
>
  <template #default="{ id, describedBy, invalid }">
    <Input
      :id="id"
      v-model="email"
      type="email"
      :invalid="invalid"
      :aria-describedby="describedBy"
    />
  </template>
</FormField>
```
