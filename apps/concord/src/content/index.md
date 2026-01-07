---
title: Concord
description: A verifiable, local-first ledger format for the browser.
route: /
nav: false
---

# Concord

Concord is a browser-native ledger format for data that needs integrity, authorship, and replayable history without servers or accounts.
It treats application state as a portable file: append entries, commit them into history, and replay that history to rebuild state.

## What Concord gives you

- A durable file format with a clear contract and versioning
- Deterministic history that can be verified offline
- Authorship via signatures without requiring a network
- A minimal runtime model that can be embedded in apps

## How it works, in brief

1. **Entries** capture a single change with an author, timestamp, and payload.
2. **Commits** group entries and link to a parent commit by hash.
3. **Ledgers** store ordered commits plus format metadata.
4. **Replay** rebuilds application state by processing entries deterministically.

The format is intentionally small. Sync, storage, and merge are handled above the ledger.

## Where it fits

Concord is for applications that need to ship a file that can be verified later:

- Local-first apps that export/import data
- Auditable logs for small teams
- Offline-first tools and field devices
- Personal knowledge bases that need provenance

## What it is not

Concord is not a network protocol, a consensus system, or a hosted platform.
It does not define how data moves between machines.

## Start here

- [Overview](/overview)
- [File format](/format)
- [Status](/status)
- [About](/about)
