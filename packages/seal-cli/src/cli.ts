import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createManifestArtifact } from "./commands/manifest";
import { createIdentityArtifact } from "./commands/identity";
import { createProofArtifact, createRecipientArtifact } from "./commands/sign";
import { createPublicKeyArtifact } from "./commands/publicKey";
import { verifyArtifactProof, verifyProofArtifact } from "./commands/verify";
import { resolveSealIdentityFromEnv } from "./node";
import {
  EXIT_FAILURE,
  EXIT_HASH_MISMATCH,
  EXIT_INVALID_PROOF,
  EXIT_KEY_CONFIG,
  EXIT_SIGNATURE_INVALID,
  EXIT_SUCCESS,
  SealCliError,
  getExitCode,
} from "./errors";

type ProcessEnvLike = Record<string, string | undefined>;

declare const process: {
  argv: string[];
  env: ProcessEnvLike;
  stdout: { write: (value: string) => void };
  stderr: { write: (value: string) => void };
  exitCode?: number;
};

type ParsedArgs = {
  _: string[];
  flags: Record<string, string | boolean | string[]>;
};

type OutputWriter = {
  stdout: (value: string) => void;
  stderr: (value: string) => void;
};

function parseArgs(argv: string[]): ParsedArgs {
  const result: ParsedArgs = { _: [], flags: {} };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) {
      result._.push(arg);
      continue;
    }

    const [rawKey, inlineValue] = arg.slice(2).split("=");
    const key = rawKey.trim();
    const next = argv[index + 1];
    const hasNextValue = inlineValue === undefined && next && !next.startsWith("--");
    const value = inlineValue ?? (hasNextValue ? next : undefined);

    if (hasNextValue) {
      index += 1;
    }

    if (value === undefined) {
      result.flags[key] = true;
      continue;
    }

    const existing = result.flags[key];
    if (existing === undefined) {
      result.flags[key] = value;
      continue;
    }

    if (Array.isArray(existing)) {
      existing.push(value);
      result.flags[key] = existing;
      continue;
    }

    result.flags[key] = [String(existing), value];
  }

  return result;
}

function getFlag(flags: ParsedArgs["flags"], key: string): string | undefined {
  const value = flags[key];
  if (Array.isArray(value)) {
    return value[value.length - 1];
  }
  return typeof value === "string" ? value : undefined;
}

function getFlags(flags: ParsedArgs["flags"], key: string): string[] {
  const value = flags[key];
  if (Array.isArray(value)) {
    return value.map(String);
  }
  if (typeof value === "string") {
    return [value];
  }
  return [];
}

function hasFlag(flags: ParsedArgs["flags"], key: string): boolean {
  return flags[key] === true;
}

function requireFlag(flags: ParsedArgs["flags"], key: string): string {
  const value = getFlag(flags, key);
  if (!value) {
    throw new SealCliError(`Missing --${key}`, EXIT_FAILURE);
  }
  return value;
}

function parseMnemonicWordCount(
  flags: ParsedArgs["flags"]
): 12 | 24 | undefined {
  const words = getFlag(flags, "words");
  if (!words) {
    return undefined;
  }
  if (words === "12" || words === "24") {
    return Number(words) as 12 | 24;
  }
  throw new SealCliError("Mnemonic word count must be 12 or 24.", EXIT_FAILURE);
}

async function writeOutputFile(filePath: string, content: string): Promise<void> {
  const resolvedPath = resolve(filePath);
  await mkdir(dirname(resolvedPath), { recursive: true });
  await writeFile(resolvedPath, content, "utf8");
}

function outputResult(
  writer: OutputWriter,
  json: boolean,
  quiet: boolean,
  value: unknown
): void {
  if (quiet) {
    return;
  }

  if (typeof value === "string") {
    writer.stdout(`${value}\n`);
    return;
  }

  if (json) {
    writer.stdout(`${JSON.stringify(value, null, 2)}\n`);
    return;
  }

  writer.stdout(`${JSON.stringify(value, null, 2)}\n`);
}

function outputError(
  writer: OutputWriter,
  json: boolean,
  error: unknown
): number {
  const exitCode = getExitCode(error);
  const message = error instanceof Error ? error.message : String(error);
  if (json) {
    writer.stderr(
      `${JSON.stringify({ error: message, exitCode }, null, 2)}\n`
    );
  } else {
    writer.stderr(`${message}\n`);
  }
  return exitCode;
}

export async function runCli(
  argv: string[],
  params: {
    env?: ProcessEnvLike;
    writer?: OutputWriter;
  } = {}
): Promise<number> {
  const parsed = parseArgs(argv);
  const env = params.env ?? process.env;
  const writer: OutputWriter = params.writer ?? {
    stdout: (value) => process.stdout.write(value),
    stderr: (value) => process.stderr.write(value),
  };
  const json = hasFlag(parsed.flags, "json");
  const quiet = hasFlag(parsed.flags, "quiet");

  try {
    const [command, subcommand] = parsed._;

    if (command === "identity" && subcommand === "create") {
      const mnemonicOutPath = getFlag(parsed.flags, "mnemonic-out");
      const artifact = await createIdentityArtifact({
        withMnemonic: Boolean(mnemonicOutPath),
        words: parseMnemonicWordCount(parsed.flags),
        passphrase: getFlag(parsed.flags, "passphrase"),
      });
      const outPath = getFlag(parsed.flags, "out");
      if (outPath) {
        await writeOutputFile(outPath, artifact.content);
      }
      if (mnemonicOutPath) {
        await writeOutputFile(mnemonicOutPath, artifact.mnemonicContent || "");
      }

      if (outPath) {
        outputResult(
          writer,
          json,
          quiet,
          json
            ? artifact.mnemonic
              ? {
                  identity: artifact.identity,
                  mnemonic: artifact.mnemonic,
                  mnemonicFile: mnemonicOutPath || null,
                }
              : artifact.identity
            : outPath
        );
      } else {
        outputResult(
          writer,
          true,
          quiet,
          artifact.mnemonic
            ? {
                identity: artifact.identity,
                mnemonic: artifact.mnemonic,
                mnemonicFile: mnemonicOutPath || null,
              }
            : artifact.identity
        );
      }
      return EXIT_SUCCESS;
    }

    if (command === "manifest" && subcommand === "create") {
      const artifact = await createManifestArtifact(requireFlag(parsed.flags, "input"));
      const outPath = getFlag(parsed.flags, "out");
      if (outPath) {
        await writeOutputFile(outPath, artifact.content);
        outputResult(writer, json, quiet, json ? artifact.manifest : outPath);
      } else {
        outputResult(writer, true, quiet, artifact.manifest);
      }
      return EXIT_SUCCESS;
    }

    if (command === "sign") {
      const identity = await resolveSealIdentityFromEnv(env);
      const recipients = getFlags(parsed.flags, "recipient");
      const inputPath = requireFlag(parsed.flags, "input");
      const outPath = getFlag(parsed.flags, "out");
      if (recipients.length > 0) {
        const artifact = await createRecipientArtifact({
          inputPath,
          identity,
          recipients,
        });
        if (outPath) {
          await writeOutputFile(outPath, artifact.content);
          outputResult(writer, json, quiet, json ? artifact.artifact : outPath);
        } else {
          outputResult(writer, true, quiet, artifact.artifact);
        }
      } else {
        const artifact = await createProofArtifact({
          inputPath,
          identity,
        });
        if (outPath) {
          await writeOutputFile(outPath, artifact.content);
          outputResult(writer, json, quiet, json ? artifact.proof : outPath);
        } else {
          outputResult(writer, true, quiet, artifact.proof);
        }
      }
      return EXIT_SUCCESS;
    }

    if (command === "verify") {
      const artifactPath = getFlag(parsed.flags, "artifact");
      if (artifactPath) {
        const { result } = await verifyArtifactProof({ artifactPath });
        outputResult(
          writer,
          json,
          quiet,
          json
            ? result
            : [
                `valid=${result.valid}`,
                `hashMatch=${result.hashMatch}`,
                `signatureValid=${result.signatureValid}`,
                `encrypted=${result.encrypted}`,
                `payloadScheme=${result.payloadScheme}`,
                `payloadMode=${result.payloadMode}`,
                `keyId=${result.keyId}`,
                `algorithm=${result.algorithm}`,
                `subjectHash=${result.subjectHash}`,
              ].join("\n")
        );

        if (!result.hashMatch) {
          return EXIT_HASH_MISMATCH;
        }
        if (!result.signatureValid) {
          return EXIT_SIGNATURE_INVALID;
        }
        return EXIT_SUCCESS;
      }

      const proofPath = requireFlag(parsed.flags, "proof");
      const inputPath = requireFlag(parsed.flags, "input");
      const { result } = await verifyProofArtifact({ proofPath, inputPath });
      outputResult(
        writer,
        json,
        quiet,
        json
          ? result
          : [
              `valid=${result.valid}`,
              `hashMatch=${result.hashMatch}`,
              `signatureValid=${result.signatureValid}`,
              `keyId=${result.keyId}`,
              `algorithm=${result.algorithm}`,
              `subjectHash=${result.subjectHash}`,
            ].join("\n")
      );

      if (!result.hashMatch) {
        return EXIT_HASH_MISMATCH;
      }
      if (!result.signatureValid) {
        return EXIT_SIGNATURE_INVALID;
      }
      return EXIT_SUCCESS;
    }

    if (command === "public-key") {
      const artifact = await createPublicKeyArtifact({
        identity: await resolveSealIdentityFromEnv(env),
      });
      outputResult(writer, true, quiet, artifact);
      return EXIT_SUCCESS;
    }

    throw new SealCliError(
      "Usage: seal identity create [--out <path>] [--words 12|24] [--passphrase <value>] [--mnemonic-out <path>] [--json] [--quiet]\n" +
        "       seal manifest create --input <path> [--out <path>] [--json] [--quiet]\n" +
        "       seal sign --input <path> [--recipient <age...>] [--out <path>] [--json] [--quiet]\n" +
        "       seal verify --proof <proof.json> --input <path> [--json] [--quiet]\n" +
        "       seal verify --artifact <artifact.json> [--json] [--quiet]\n" +
        "       seal public-key [--json] [--quiet]",
      EXIT_FAILURE
    );
  } catch (error) {
    if (error instanceof Error && error.message.includes("Proof")) {
      return outputError(
        writer,
        json,
        new SealCliError(error.message, EXIT_INVALID_PROOF)
      );
    }
    if (
      error instanceof Error &&
      (error.message.includes("public key") ||
        error.message.includes("SEAL_IDENTITY") ||
        error.message.includes("identity"))
    ) {
      return outputError(
        writer,
        json,
        new SealCliError(error.message, EXIT_KEY_CONFIG)
      );
    }
    return outputError(writer, json, error);
  }
}

const isDirectRun =
  typeof process !== "undefined" &&
  process.argv[1] &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1]);

if (isDirectRun) {
  runCli(process.argv.slice(2)).then((exitCode) => {
    process.exitCode = exitCode;
  });
}
