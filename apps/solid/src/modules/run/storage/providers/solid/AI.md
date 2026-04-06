# AI Guidance

- Keep Solid isolated as one provider plugin.
- Do not move new explorer, terminal, or core logic into this folder.
- Provider-specific extras are allowed here only when they are needed for transitional compatibility.
- When extracting more seams, prefer shrinking the legacy compatibility surface rather than expanding it.
