# AI Rules - Surface Layer

- Surfaces are not the foundation of the product.
- Library should answer: what is here, what is mounted, what can open this, and can I trust it.
- Terminal should answer: what happened, what is the replay state, and can I verify or compose it.
- Keep surface components compositional. Put durable logic in workspace or shared services.
- Do not build separate truth models per surface.
- Never mutate shared state from a surface except through commands.
