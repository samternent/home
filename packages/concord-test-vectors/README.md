# Concord Test Vectors

Shared, protocol-grade fixtures for Concord implementations.

## Vector Schema

Each entry in `vectors.json` uses this structure:

```json
{
  "name": "entry-basic",
  "type": "entry",
  "input": { "...": "..." },
  "expect": { "...": "..." }
}
```

### Special Input Tokens

To model non-JSON inputs in a JSON file, the vector runner replaces objects with a
`__concord_type` marker:

- `{ "__concord_type": "undefined" }` → `undefined`
- `{ "__concord_type": "nan" }` → `NaN`
- `{ "__concord_type": "infinity" }` → `Infinity`
- `{ "__concord_type": "circular" }` → circular object reference
