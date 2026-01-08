import { readFileSync, writeFileSync, renameSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import {
  appendCommitStrict,
  appendEntry,
  ConcordProtocolError,
  createCommit,
  createLedger,
  type Entry,
  type LedgerContainer,
} from "@ternent/concord-protocol";
import {
  createIdentityUpsertEntry,
  getIdentity,
  listIdentities,
} from "./commands/identity";
import { inspectLedger } from "./commands/inspect";
import {
  canPerform,
  createGrantEntry,
  createRevokeEntry,
  replayPermissionState,
} from "./commands/permissions";
import {
  checkDecryptable,
  createRotateEntry,
  createWrapEntry,
} from "./commands/encryption";
import { verifyProtocol, verifySemantic } from "./commands/verify";
import { loadConfig } from "./config";

const EXIT_PROTOCOL = 1;
const EXIT_SEMANTIC = 2;
const EXIT_AUTH = 3;
const EXIT_ENCRYPTION = 4;

type ParsedArgs = {
  _: string[];
  flags: Record<string, string | boolean | string[]>;
};

function parseArgs(argv: string[]): ParsedArgs {
  const result: ParsedArgs = { _: [], flags: {} };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith("--")) {
      result._.push(arg);
      continue;
    }
    const [rawKey, inlineValue] = arg.slice(2).split("=");
    const key = rawKey.trim();
    const value = inlineValue ?? argv[i + 1];
    if (inlineValue === undefined && value && !value.startsWith("--")) {
      i += 1;
    }
    const resolvedValue = inlineValue !== undefined ? inlineValue : value;
    if (resolvedValue === undefined || resolvedValue.startsWith("--")) {
      result.flags[key] = true;
      continue;
    }
    if (result.flags[key]) {
      const existing = result.flags[key];
      if (Array.isArray(existing)) {
        existing.push(resolvedValue);
        result.flags[key] = existing;
      } else {
        result.flags[key] = [String(existing), resolvedValue];
      }
    } else {
      result.flags[key] = resolvedValue;
    }
  }
  return result;
}

function getFlag(flags: ParsedArgs["flags"], key: string): string | undefined {
  const value = flags[key];
  if (Array.isArray(value)) {
    return value[value.length - 1];
  }
  if (typeof value === "string") {
    return value;
  }
  return undefined;
}

function getFlagList(flags: ParsedArgs["flags"], key: string): string[] {
  const value = flags[key];
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value.flatMap((item) => String(item).split(",")).filter(Boolean);
  }
  if (typeof value === "string") {
    return value.split(",").filter(Boolean);
  }
  return [];
}

function stripUndefinedDeep<T>(value: T): T {
  if (value === null) return value;
  if (value === undefined) return value;

  if (Array.isArray(value)) {
    // Preserve order; drop undefined entries
    return value
      .map((item) => stripUndefinedDeep(item))
      .filter((item) => item !== undefined) as unknown as T;
  }

  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      if (v === undefined) continue;
      const cleaned = stripUndefinedDeep(v);
      if (cleaned === undefined) continue;
      out[k] = cleaned;
    }
    return out as unknown as T;
  }

  return value;
}

function getFlagValues(flags: ParsedArgs["flags"], key: string): string[] {
  const value = flags[key];
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value.map((item) => String(item));
  }
  return [String(value)];
}

function readLedger(path?: string) {
  if (!path) {
    throw new Error("Missing --ledger path");
  }
  const raw = readFileSync(resolve(path), "utf8");
  return JSON.parse(raw);
}

function parseJsonInput(input: string): unknown {
  const value = input.trim();
  if (value.startsWith("@")) {
    const filePath = resolve(value.slice(1));
    const raw = readFileSync(filePath, "utf8");
    return JSON.parse(raw);
  }
  return JSON.parse(value);
}

function writeLedgerFile(path: string, ledger: LedgerContainer) {
  const resolved = resolve(path);
  const dir = dirname(resolved);
  const tempPath = join(
    dir,
    `.concord-ledger.tmp-${process.pid}-${Date.now()}`
  );
  writeFileSync(tempPath, `${JSON.stringify(ledger, null, 2)}\n`, "utf8");
  renameSync(tempPath, resolved);
}

async function appendEntriesToLedger(params: {
  ledgerPath: string;
  entries: Entry[];
  metadata?: Record<string, unknown> | null;
  timestamp?: string;
  outPath?: string;
}): Promise<{
  ledger: LedgerContainer;
  entryIds: string[];
  commitId: string;
}> {
  const ledger = readLedger(params.ledgerPath) as LedgerContainer;
  let nextLedger = ledger;
  const entryIds: string[] = [];

  for (const entry of params.entries) {
    // Safety net: remove any undefined before canonicalization/hashing
    const sanitizedEntry = stripUndefinedDeep(entry) as Entry;

    const appended = await appendEntry(nextLedger, sanitizedEntry);
    nextLedger = appended.ledger;
    entryIds.push(appended.entryId);
  }

  const sanitizedMetadata = params.metadata
    ? (stripUndefinedDeep(params.metadata) as Record<string, unknown>)
    : null;

  const { commitId, commit } = await createCommit({
    ledger: nextLedger,
    entries: entryIds,
    metadata: sanitizedMetadata,
    timestamp: params.timestamp,
  });

  const updated = await appendCommitStrict(nextLedger, commitId, commit);
  writeLedgerFile(params.outPath ?? params.ledgerPath, updated);

  return { ledger: updated, entryIds, commitId };
}

function resolveErrorCode(error: unknown): string | undefined {
  if (!error || typeof error !== "object") {
    return undefined;
  }
  const maybeCode = (error as { code?: unknown }).code;
  if (typeof maybeCode === "string") {
    return maybeCode;
  }
  return undefined;
}

function mapExitCode(error: unknown): number {
  if (error instanceof ConcordProtocolError) {
    return EXIT_PROTOCOL;
  }
  const code = resolveErrorCode(error);
  if (!code) {
    return EXIT_SEMANTIC;
  }
  if (code.startsWith("UNAUTHORIZED")) {
    return EXIT_AUTH;
  }
  if (
    code === "INVALID_EPOCH_TRANSITION" ||
    code === "INVALID_PAYLOAD" ||
    code === "INELIGIBLE_TARGET" ||
    code === "MISSING_RECIPIENTS"
  ) {
    return EXIT_ENCRYPTION;
  }
  return EXIT_SEMANTIC;
}

function handleError(
  error: unknown,
  fallbackMessage: string,
  json: boolean
): never {
  const message = error instanceof Error ? error.message : fallbackMessage;
  const exitCode = mapExitCode(error);
  outputError(message, exitCode, json);
}

function outputResult(data: unknown, json: boolean, quiet: boolean) {
  if (quiet) {
    return;
  }
  if (json) {
    process.stdout.write(`${JSON.stringify(data, null, 2)}\n`);
    return;
  }
  if (typeof data === "string") {
    process.stdout.write(`${data}\n`);
    return;
  }
  process.stdout.write(`${JSON.stringify(data, null, 2)}\n`);
}

function outputError(message: string, exitCode: number, json: boolean): never {
  if (json) {
    process.stderr.write(
      `${JSON.stringify(
        { ok: false, error: message, code: exitCode },
        null,
        2
      )}\n`
    );
  } else {
    process.stderr.write(`${message}\n`);
  }
  process.exit(exitCode);
}

async function main() {
  const parsed = parseArgs(process.argv.slice(2));
  const [command, subcommand, action] = parsed._;
  const json = parsed.flags.json === true;
  const quiet = parsed.flags.quiet === true;
  const configPath = getFlag(parsed.flags, "config");
  const config = loadConfig(configPath);

  if (!command) {
    outputError("Missing command", EXIT_PROTOCOL, json);
  }

  if (command === "init") {
    const outPath = getFlag(parsed.flags, "out");
    if (!outPath) {
      outputError("Missing --out", EXIT_PROTOCOL, json);
    }
    const timestamp = getFlag(parsed.flags, "timestamp");
    try {
      const ledger = await createLedger({}, timestamp ?? undefined);
      writeLedgerFile(outPath, ledger);
      outputResult({ ok: true, head: ledger.head }, json, quiet);
      return;
    } catch (error) {
      handleError(error, "Failed to initialize ledger", json);
    }
  }

  if (command === "entry" && subcommand === "create") {
    const kind = getFlag(parsed.flags, "kind");
    const author = getFlag(parsed.flags, "author");
    const payloadInput = getFlag(parsed.flags, "payload");
    const timestamp =
      getFlag(parsed.flags, "timestamp") ?? new Date().toISOString();
    if (!kind || !author || !payloadInput) {
      outputError(
        "Missing --kind, --author, or --payload",
        EXIT_PROTOCOL,
        json
      );
    }
    try {
      const payload = parseJsonInput(payloadInput);
      const entry: Entry = {
        kind,
        timestamp,
        author,
        payload,
        signature: null,
      };
      const sanitizedEntry = stripUndefinedDeep(entry) as Entry;
      outputResult(sanitizedEntry, json, quiet);
      return;
    } catch (error) {
      handleError(error, "Failed to create entry", json);
    }
  }

  if (command === "append") {
    const ledgerPath = getFlag(parsed.flags, "ledger");
    const entriesInput = getFlagValues(parsed.flags, "entry");
    const metadataInput = getFlag(parsed.flags, "metadata");
    const timestamp = getFlag(parsed.flags, "timestamp");
    const outPath = getFlag(parsed.flags, "out");
    if (!ledgerPath || entriesInput.length === 0) {
      outputError("Missing --ledger or --entry", EXIT_PROTOCOL, json);
    }
    try {
      const entries = entriesInput.map(
        (value) => parseJsonInput(value) as Entry
      );
      const metadata = metadataInput
        ? (parseJsonInput(metadataInput) as Record<string, unknown>)
        : undefined;
      const result = await appendEntriesToLedger({
        ledgerPath,
        entries,
        metadata,
        timestamp: timestamp ?? undefined,
        outPath: outPath ?? undefined,
      });
      outputResult(
        {
          ok: true,
          entryIds: result.entryIds,
          commitId: result.commitId,
          head: result.ledger.head,
        },
        json,
        quiet
      );
      return;
    } catch (error) {
      handleError(error, "Failed to append entries", json);
    }
  }

  if (command === "verify") {
    const ledger = readLedger(getFlag(parsed.flags, "ledger"));
    const result = verifyProtocol(ledger);
    if (!result.ok) {
      outputError(result.errors.join("; "), EXIT_PROTOCOL, json);
    }
    const semantic = parsed.flags.semantic === true;
    if (semantic) {
      const semanticResult = verifySemantic(ledger, config);
      if (!semanticResult.ok) {
        outputError(semanticResult.errors.join("; "), EXIT_SEMANTIC, json);
      }
    }
    outputResult({ ok: true }, json, quiet);
    return;
  }

  if (command === "inspect") {
    const ledger = readLedger(getFlag(parsed.flags, "ledger"));
    const summary = inspectLedger(ledger);
    outputResult(summary, json, quiet);
    return;
  }

  if (command === "identity") {
    if (subcommand === "upsert") {
      const principalId = getFlag(parsed.flags, "principal");
      if (!principalId) {
        outputError("Missing --principal", EXIT_SEMANTIC, json);
      }
      const ageRecipients = getFlagList(parsed.flags, "age");
      const displayName = getFlag(parsed.flags, "name");
      try {
        const entry = createIdentityUpsertEntry(
          {
            principalId,
            displayName,
            ageRecipients,
          },
          new Date().toISOString()
        );
        const sanitizedEntry = stripUndefinedDeep(entry) as Entry;
        const shouldWrite =
          parsed.flags.write === true || parsed.flags.append === true;
        if (shouldWrite) {
          const ledgerPath = getFlag(parsed.flags, "ledger");
          if (!ledgerPath) {
            outputError("Missing --ledger", EXIT_PROTOCOL, json);
          }
          const outPath = getFlag(parsed.flags, "out");
          const result = await appendEntriesToLedger({
            ledgerPath,
            entries: [sanitizedEntry],
            outPath: outPath ?? undefined,
          });
          outputResult(
            {
              ok: true,
              entryIds: result.entryIds,
              commitId: result.commitId,
              head: result.ledger.head,
            },
            json,
            quiet
          );
          return;
        }
        outputResult(sanitizedEntry, json, quiet);
        return;
      } catch (error) {
        handleError(error, "Identity upsert failed", json);
      }
    }

    if (subcommand === "show") {
      const ledger = readLedger(getFlag(parsed.flags, "ledger"));
      const principalId = getFlag(parsed.flags, "principal");
      if (!principalId) {
        outputError("Missing --principal", EXIT_SEMANTIC, json);
      }
      const record = getIdentity(ledger, principalId);
      if (!record) {
        outputError("Principal not found", EXIT_SEMANTIC, json);
      }
      outputResult(record, json, quiet);
      return;
    }

    if (subcommand === "list") {
      const ledger = readLedger(getFlag(parsed.flags, "ledger"));
      const state = listIdentities(ledger);
      outputResult(Object.values(state.principals), json, quiet);
      return;
    }
  }

  if (command === "perms") {
    const ledger = readLedger(getFlag(parsed.flags, "ledger"));
    const rootAdmins = config.rootAdmins ?? [];
    const state = replayPermissionState(ledger, rootAdmins);

    if (subcommand === "can") {
      const principalId = getFlag(parsed.flags, "as");
      const scope = getFlag(parsed.flags, "scope");
      const actionName = getFlag(parsed.flags, "action");
      const nowIso = getFlag(parsed.flags, "now");
      if (!principalId || !scope || !actionName) {
        outputError("Missing --as, --scope, or --action", EXIT_SEMANTIC, json);
      }
      const allowed = canPerform(state, principalId, actionName, scope, nowIso);
      outputResult({ ok: true, allowed }, json, quiet);
      return;
    }

    if (subcommand === "grant") {
      const author = getFlag(parsed.flags, "as");
      const scope = getFlag(parsed.flags, "scope");
      const cap = getFlag(parsed.flags, "cap") as
        | "read"
        | "write"
        | "grant"
        | "admin";
      const to = getFlag(parsed.flags, "to");
      if (!author || !scope || !cap || !to) {
        outputError(
          "Missing --as, --scope, --cap, or --to",
          EXIT_SEMANTIC,
          json
        );
      }
      try {
        const allowed = canPerform(state, author, "perm:grant", scope);
        if (!allowed) {
          outputError("Not authorized to grant", EXIT_AUTH, json);
        }
        const entry = createGrantEntry(
          {
            author,
            scope,
            cap,
            target: {
              type: to.startsWith("group:") ? "group" : "principal",
              id: to,
            },
            expires: getFlag(parsed.flags, "expires"),
          },
          new Date().toISOString()
        );
        const sanitizedEntry = stripUndefinedDeep(entry) as Entry;
        const shouldWrite =
          parsed.flags.write === true || parsed.flags.append === true;
        if (shouldWrite) {
          const ledgerPath = getFlag(parsed.flags, "ledger");
          if (!ledgerPath) {
            outputError("Missing --ledger", EXIT_PROTOCOL, json);
          }
          const outPath = getFlag(parsed.flags, "out");
          const result = await appendEntriesToLedger({
            ledgerPath,
            entries: [sanitizedEntry],
            outPath: outPath ?? undefined,
          });
          outputResult(
            {
              ok: true,
              entryIds: result.entryIds,
              commitId: result.commitId,
              head: result.ledger.head,
            },
            json,
            quiet
          );
          return;
        }
        outputResult(sanitizedEntry, json, quiet);
        return;
      } catch (error) {
        handleError(error, "Grant failed", json);
      }
    }

    if (subcommand === "revoke") {
      const author = getFlag(parsed.flags, "as");
      const scope = getFlag(parsed.flags, "scope");
      const cap = getFlag(parsed.flags, "cap") as
        | "read"
        | "write"
        | "grant"
        | "admin";
      const from = getFlag(parsed.flags, "from");
      if (!author || !scope || !cap || !from) {
        outputError(
          "Missing --as, --scope, --cap, or --from",
          EXIT_SEMANTIC,
          json
        );
      }
      try {
        const allowed = canPerform(state, author, "perm:admin", scope);
        if (!allowed) {
          outputError("Not authorized to revoke", EXIT_AUTH, json);
        }
        const entry = createRevokeEntry(
          {
            author,
            scope,
            cap,
            target: {
              type: from.startsWith("group:") ? "group" : "principal",
              id: from,
            },
            reason: getFlag(parsed.flags, "reason"),
          },
          new Date().toISOString()
        );
        const sanitizedEntry = stripUndefinedDeep(entry) as Entry;
        const shouldWrite =
          parsed.flags.write === true || parsed.flags.append === true;
        if (shouldWrite) {
          const ledgerPath = getFlag(parsed.flags, "ledger");
          if (!ledgerPath) {
            outputError("Missing --ledger", EXIT_PROTOCOL, json);
          }
          const outPath = getFlag(parsed.flags, "out");
          const result = await appendEntriesToLedger({
            ledgerPath,
            entries: [sanitizedEntry],
            outPath: outPath ?? undefined,
          });
          outputResult(
            {
              ok: true,
              entryIds: result.entryIds,
              commitId: result.commitId,
              head: result.ledger.head,
            },
            json,
            quiet
          );
          return;
        }
        outputResult(sanitizedEntry, json, quiet);
        return;
      } catch (error) {
        handleError(error, "Revoke failed", json);
      }
    }
  }

  if (command === "enc") {
    const ledger = readLedger(getFlag(parsed.flags, "ledger"));
    const rootAdmins = config.rootAdmins ?? [];

    if (subcommand === "rotate") {
      const scope = getFlag(parsed.flags, "scope");
      const author = getFlag(parsed.flags, "as");
      if (!scope || !author) {
        outputError("Missing --scope or --as", EXIT_SEMANTIC, json);
      }
      try {
        const { entry, warnings } = createRotateEntry(
          ledger,
          scope,
          author,
          rootAdmins
        );
        const sanitizedEntry = stripUndefinedDeep(entry) as Entry;
        if (warnings.length > 0 && !json && !quiet) {
          process.stderr.write(`${warnings.join("; ")}\n`);
        }
        const shouldWrite =
          parsed.flags.write === true || parsed.flags.append === true;
        if (shouldWrite) {
          const ledgerPath = getFlag(parsed.flags, "ledger");
          if (!ledgerPath) {
            outputError("Missing --ledger", EXIT_PROTOCOL, json);
          }
          const outPath = getFlag(parsed.flags, "out");
          const result = await appendEntriesToLedger({
            ledgerPath,
            entries: [sanitizedEntry],
            outPath: outPath ?? undefined,
          });
          outputResult(
            {
              ok: true,
              entryIds: result.entryIds,
              commitId: result.commitId,
              head: result.ledger.head,
              warnings,
            },
            json,
            quiet
          );
          return;
        }
        outputResult({ entry: sanitizedEntry, warnings }, json, quiet);
        return;
      } catch (error) {
        handleError(error, "Rotate failed", json);
      }
    }

    if (subcommand === "wrap") {
      const scope = getFlag(parsed.flags, "scope");
      const epoch = Number(getFlag(parsed.flags, "epoch"));
      const principalId = getFlag(parsed.flags, "to");
      const author = getFlag(parsed.flags, "as");
      const overrideRecipients = getFlagList(parsed.flags, "age");
      if (!scope || !author || !principalId || Number.isNaN(epoch)) {
        outputError(
          "Missing --scope, --epoch, --to, or --as",
          EXIT_SEMANTIC,
          json
        );
      }
      try {
        const { entry, warnings, hasRecipients } = createWrapEntry(
          ledger,
          scope,
          epoch,
          principalId,
          author,
          rootAdmins,
          overrideRecipients
        );
        const sanitizedEntry = stripUndefinedDeep(entry) as Entry;
        if (!hasRecipients) {
          outputError("Missing age recipients", EXIT_ENCRYPTION, json);
        }
        if (warnings.length > 0 && !json && !quiet) {
          process.stderr.write(`${warnings.join("; ")}\n`);
        }
        const shouldWrite =
          parsed.flags.write === true || parsed.flags.append === true;
        if (shouldWrite) {
          const ledgerPath = getFlag(parsed.flags, "ledger");
          if (!ledgerPath) {
            outputError("Missing --ledger", EXIT_PROTOCOL, json);
          }
          const outPath = getFlag(parsed.flags, "out");
          const result = await appendEntriesToLedger({
            ledgerPath,
            entries: [sanitizedEntry],
            outPath: outPath ?? undefined,
          });
          outputResult(
            {
              ok: true,
              entryIds: result.entryIds,
              commitId: result.commitId,
              head: result.ledger.head,
              warnings,
            },
            json,
            quiet
          );
          return;
        }
        outputResult({ entry: sanitizedEntry, warnings }, json, quiet);
        return;
      } catch (error) {
        handleError(error, "Wrap failed", json);
      }
    }

    if (subcommand === "decrypt") {
      const principalId = getFlag(parsed.flags, "as");
      if (!principalId) {
        outputError("Missing --as", EXIT_SEMANTIC, json);
      }
      const nowIso = getFlag(parsed.flags, "now");
      const mode = (getFlag(parsed.flags, "mode") ??
        "combined") as "combined" | "crypto" | "policy";
      if (!["combined", "crypto", "policy"].includes(mode)) {
        outputError("Invalid --mode (expected combined|crypto|policy)", EXIT_SEMANTIC, json);
      }
      const checks = checkDecryptable(
        ledger,
        principalId,
        rootAdmins,
        nowIso,
        mode
      );
      const failed = checks.filter((check) => !check.ok);
      if (failed.length > 0) {
        outputResult({ ok: false, results: checks }, json, quiet);
        process.exit(EXIT_ENCRYPTION);
      }
      outputResult({ ok: true, results: checks }, json, quiet);
      return;
    }
  }

  outputError("Unknown command", EXIT_PROTOCOL, json);
}

main().catch((error) => {
  handleError(error, "Command failed", false);
});
