# @ternent/concord-plugin-task

Replay task state from a Concord ledger and expose the first hosted-app domain contract for `run`.

## Scope

- personal task management first
- task-only or empty ledgers only in v1
- read-only replay works without identity
- interactive task mutation goes through Concord commands

## Install

```bash
pnpm add @ternent/concord-plugin-task
```

## Usage

```ts
import {
  taskPlugin,
  supportsTaskProjection,
  type TaskProjection,
} from "@ternent/concord-plugin-task";

const plugins = [taskPlugin()];
const compatibility = supportsTaskProjection(container);
```

## API

- `taskPlugin()`
- `supportsTaskProjection(container)`
- `createEmptyTaskProjection()`
- task domain types:
  - `TaskId`
  - `TaskStatus`
  - `TaskPriority`
  - `TaskRecord`
  - `TaskProjection`
