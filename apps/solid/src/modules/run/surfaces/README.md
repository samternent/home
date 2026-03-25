# Surface Layer

Purpose:

- compose workspace state into user-facing interaction surfaces

Initial surfaces:

- explorer
- terminal

Surface rule:

- surfaces are lenses over the same workspace runtime
- they do not define truth
- they should stay thin over workspace and shared services
- they must not mutate state directly

Terminal contract:

```ts
type Command = {
  name: string;
  args: string[];
  execute(ctx: WorkspaceState): CommandResult | Promise<CommandResult>;
};

type CommandResult = {
  output: string[];
  projectionId?: string;
  resourceIds?: string[];
};
```

Implementation note:

- terminal UI should stay separate from terminal language
- `xterm.js` or any future terminal renderer should adapt to the same command-language service rather than owning command semantics
