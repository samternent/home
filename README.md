## The personal infrastructure for samternent.

All apis, apps and packages are managed through changesets.

### APIs

APIs are published upon release to dockerhub and deployed to a kubenertes cluster through the .ops scripts.

TODOs

- [ ] deploy all APIs to their respective domains, in full working order with ssl.
- [x] deploy APIs using GHA

### Apps

Apps are deployed upon release to Vercel through the vercel cli.

### Packages

Packages are node modules, published upon release to npm.
