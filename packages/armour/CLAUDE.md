# CLAUDE.md

`@ternent/armour` bridges identity-derived keys and rage encryption APIs.

- Keep scope narrow: encryption/decryption helpers only.
- Do not add app/domain policy logic here.
- Do not mix signing concerns into armour APIs.
- For Concord apps, prefer ledger-native protected entries first; use armour directly only when runtime-layer artifacts require it.
