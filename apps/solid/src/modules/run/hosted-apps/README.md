# Hosted Apps Layer

Purpose:

- contain domain-specific experiences that consume workspace projections and emit commands

Hosted app manifest rule:

```ts
type AppManifest = {
  id: string;
  label: string;
  supports: {
    schemaIds?: string[];
    resourceTypes?: ResourceType[];
    capabilities: Capability[];
  };
};
```

Own here:

- hosted app registry
- app manifests
- app-specific view models
- domain UI

Do not own here:

- generic history and verification UI
- mount discovery
- replay engine internals
