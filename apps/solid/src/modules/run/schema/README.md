# Schema Layer

Purpose:

- define the command and replay contracts that make ledgers meaningful

Phase 1 packaging rule:

- plugins contain schemas

Plugin package contents:

- schemas
- apps
- commands
- inspectors

Own here:

- schema manifests
- command kinds and payload contracts
- reducer and projector registration
- compatibility metadata
- migration and version information

Do not own here:

- storage mechanics
- workspace routing
- surface composition
