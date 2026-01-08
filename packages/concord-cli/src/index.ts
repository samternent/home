import { readFileSync } from "node:fs";
import { resolve } from "node:path";
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

function readLedger(path?: string) {
  if (!path) {
    throw new Error("Missing --ledger path");
  }
  const raw = readFileSync(resolve(path), "utf8");
  return JSON.parse(raw);
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

function outputError(
  message: string,
  exitCode: number,
  json: boolean
): never {
  if (json) {
    process.stderr.write(
      `${JSON.stringify({ ok: false, error: message, code: exitCode }, null, 2)}\n`
    );
  } else {
    process.stderr.write(`${message}\n`);
  }
  process.exit(exitCode);
}

function main() {
  const parsed = parseArgs(process.argv.slice(2));
  const [command, subcommand, action] = parsed._;
  const json = parsed.flags.json === true;
  const quiet = parsed.flags.quiet === true;
  const configPath = getFlag(parsed.flags, "config");
  const config = loadConfig(configPath);

  if (!command) {
    outputError("Missing command", EXIT_PROTOCOL, json);
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
      const author = getFlag(parsed.flags, "author") ?? principalId;
      if (author !== principalId) {
        outputError("Author must match principalId", EXIT_SEMANTIC, json);
      }
      const ageRecipients = getFlagList(parsed.flags, "age");
      const displayName = getFlag(parsed.flags, "name");
      const entry = createIdentityUpsertEntry(
        {
          principalId,
          author,
          displayName,
          ageRecipients,
        },
        new Date().toISOString()
      );
      outputResult(entry, json, quiet);
      return;
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
      if (!principalId || !scope || !actionName) {
        outputError("Missing --as, --scope, or --action", EXIT_SEMANTIC, json);
      }
      const allowed = canPerform(state, principalId, actionName, scope);
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
        outputError("Missing --as, --scope, --cap, or --to", EXIT_SEMANTIC, json);
      }
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
      outputResult(entry, json, quiet);
      return;
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
        outputError("Missing --as, --scope, --cap, or --from", EXIT_SEMANTIC, json);
      }
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
      outputResult(entry, json, quiet);
      return;
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
        if (warnings.length > 0 && !json && !quiet) {
          process.stderr.write(`${warnings.join("; ")}\n`);
        }
        outputResult({ entry, warnings }, json, quiet);
        return;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Rotate failed";
        const code = message === "UNAUTHORIZED_ROTATE" ? EXIT_AUTH : EXIT_SEMANTIC;
        outputError(message, code, json);
      }
    }

    if (subcommand === "wrap") {
      const scope = getFlag(parsed.flags, "scope");
      const epoch = Number(getFlag(parsed.flags, "epoch"));
      const principalId = getFlag(parsed.flags, "to");
      const author = getFlag(parsed.flags, "as");
      const overrideRecipients = getFlagList(parsed.flags, "age");
      if (!scope || !author || !principalId || Number.isNaN(epoch)) {
        outputError("Missing --scope, --epoch, --to, or --as", EXIT_SEMANTIC, json);
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
        if (!hasRecipients) {
          outputError("Missing age recipients", EXIT_ENCRYPTION, json);
        }
        if (warnings.length > 0 && !json && !quiet) {
          process.stderr.write(`${warnings.join("; ")}\n`);
        }
        outputResult({ entry, warnings }, json, quiet);
        return;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Wrap failed";
        const code =
          message === "UNAUTHORIZED_WRAP"
            ? EXIT_AUTH
            : message === "INELIGIBLE_TARGET"
              ? EXIT_SEMANTIC
              : EXIT_SEMANTIC;
        outputError(message, code, json);
      }
    }

    if (subcommand === "decrypt") {
      const principalId = getFlag(parsed.flags, "as");
      if (!principalId) {
        outputError("Missing --as", EXIT_SEMANTIC, json);
      }
      const checks = checkDecryptable(ledger, principalId, rootAdmins);
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

main();
