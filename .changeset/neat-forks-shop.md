---
"@ternent/seal-cli": patch
---

Fix the package runtime dependency graph by shipping `@ternent/identity` and `ternent-utils` as production dependencies. This prevents browser consumers that bundle Seal proof helpers from source from failing to resolve `@ternent/identity` during app builds.
