# AI Rules - Core Layer

- This is the first delivery slice, not a permanent dumping ground.
- Support multiple ledgers in the workspace, but only one active projection at a time for phase 1.
- Prefer assembling existing workspace, replay, and service contracts here over inventing parallel state.
- Treat `useRunCoreRuntime()` as a route-facing facade, not the only place runtime truth lives.
- `RouteApp.vue` should depend on this layer as the runtime hardens.
- UI should remain minimal until the core contracts feel stable.
