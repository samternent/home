# PixPax v2 Beta Punch List

## Blockers

### 1. Concord / ledger packaging is still too heavy

Status:

- route splitting is in place
- app shell is small
- Concord is no longer in the initial shell
- but the Concord/ledger async runtime is still very large because the library dist artifacts are prebundled

Current evidence:

- [packages/ledger-v2/dist](/Users/sam/dev/samternent/home/packages/ledger-v2/dist)
- [packages/concord/dist](/Users/sam/dev/samternent/home/packages/concord/dist)
- [apps/pixpax/vite.config.ts](/Users/sam/dev/samternent/home/apps/pixpax/vite.config.ts)

Needed:

- stop prebundling internal workspace deps into runtime library outputs
- externalize internal deps in library builds where appropriate
- preserve useful ESM boundaries so the app bundler can tree-shake through the graph

Why it matters:

- large async runtime cost on first Pixbook load
- higher failure surface for beta users on weak mobile connections
- undermines local-first performance perception

### 2. `@ternent/concord` package build is not clean

Status:

- JS build emits
- DTS build currently throws `rootDir` issues when the Concord package pulls workspace sources through the library build

Current evidence:

- [packages/concord/package.json](/Users/sam/dev/samternent/home/packages/concord/package.json)
- [packages/concord/vite.config.ts](/Users/sam/dev/samternent/home/packages/concord/vite.config.ts)

Needed:

- clean up build boundaries so package build is reproducible in CI and release

Why it matters:

- release confidence
- package boundary correctness
- avoids future CI regressions

### 3. Full end-to-end beta QA still needs to be run

Status:

- individual fixes have been validated
- full printed-pack beta rehearsal has not yet been completed as one script

Needed:

- issue -> scan -> claim -> reveal -> refresh -> recover on second device

Why it matters:

- this is the real product, not the component tests

## Should Fix Before Beta

### 4. Beta surface should be trimmed harder

Current state:

- the app still includes collection/archive routes and settings surfaces that are broader than the single-drop beta path

Current files:

- [RouteAppCollections.vue](/Users/sam/dev/samternent/home/apps/pixpax/src/routes/app/RouteAppCollections.vue)
- [RouteAppSettingsShell.vue](/Users/sam/dev/samternent/home/apps/pixpax/src/routes/app/settings/RouteAppSettingsShell.vue)

Needed:

- either hide or clearly demote beta-inactive surfaces
- keep the main journey as:
  - scan
  - claim
  - open
  - view book

### 5. Family backup UX needs plain-language polish

Current state:

- the family model is implemented
- the copy still leans too operational in places

Current files:

- [RouteAppSettingsFamily.vue](/Users/sam/dev/samternent/home/apps/pixpax/src/routes/app/settings/RouteAppSettingsFamily.vue)
- [usePixpaxFamilySync.ts](/Users/sam/dev/samternent/home/apps/pixpax/src/modules/family/usePixpaxFamilySync.ts)

Needed:

- simplify copy to child/parent language
- reduce storage jargon
- clarify save vs open vs recover actions

### 6. Printed operator flow should be documented

Current state:

- issuance and revoke exist
- operator workflow is still implicit

Current files:

- [RouteAppAdmin.vue](/Users/sam/dev/samternent/home/apps/pixpax/src/routes/app/RouteAppAdmin.vue)

Needed:

- one operator runbook for:
  - issue batch
  - print batch
  - verify links
  - revoke bad codes
  - support family recovery questions

## Post-Beta

### 7. Invite-based family sharing

Not required for first printed beta.

### 8. True multi-collection shelf UX

Not required while beta is shipping one active v2 collection.

### 9. Live sync / merge

Explicitly deferred.

### 10. Broader analytics / creator tooling

Not needed for the small test group.

## Recommended Immediate Order

1. Fix Concord/ledger library packaging.
2. Clean `@ternent/concord` package build.
3. Run full beta rehearsal.
4. Trim or hide non-beta surfaces.
5. Polish family backup language.
6. Freeze operator runbook and release checklist.
