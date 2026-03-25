# AI Rules - Storage Layer

- Keep this layer ignorant of routes, components, and domain schemas.
- Model resources in terms of mounts, paths, handles, and metadata.
- Solid-specific implementation details should stop at this boundary.
- Return stable, serializable resource descriptors that upper layers can reason about.
- Never put replay reducers, command builders, or app capability logic here.
