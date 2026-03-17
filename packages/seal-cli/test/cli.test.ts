import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createIdentity, serializeIdentity } from "@ternent/identity";
import { runCli } from "../src/cli";

async function createSigningEnv() {
  const identity = await createIdentity();
  return {
    SEAL_IDENTITY: serializeIdentity(identity, false).trim(),
  };
}

async function createTempFile(name: string, content: string): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), "seal-cli-"));
  const filePath = join(root, name);
  await writeFile(filePath, content, "utf8");
  return filePath;
}

function createWriter() {
  let stdout = "";
  let stderr = "";
  return {
    writer: {
      stdout: (value: string) => {
        stdout += value;
      },
      stderr: (value: string) => {
        stderr += value;
      },
    },
    read: () => ({ stdout, stderr }),
  };
}

describe("seal cli", () => {
  it("verifies a proof successfully", async () => {
    const env = await createSigningEnv();
    const subjectPath = await createTempFile("sample.txt", "sample file\n");
    const proofPath = await createTempFile("proof.json", "");
    const writer = createWriter();

    const signExit = await runCli(
      ["sign", "--input", subjectPath, "--out", proofPath],
      { env, writer: writer.writer }
    );
    const verifyExit = await runCli(
      ["verify", "--proof", proofPath, "--input", subjectPath, "--json"],
      { env, writer: writer.writer }
    );

    expect(signExit).toBe(0);
    expect(verifyExit).toBe(0);
    expect(writer.read().stdout).toContain('"valid": true');
  });

  it("creates an identity file", async () => {
    const identityPath = await createTempFile("identity.json", "");
    const writer = createWriter();

    const exitCode = await runCli(
      ["identity", "create", "--out", identityPath, "--json"],
      { writer: writer.writer }
    );

    expect(exitCode).toBe(0);
    expect(writer.read().stdout).toContain('"format": "ternent-identity"');
    expect(await readFile(identityPath, "utf8")).toContain('"material"');
  });

  it("creates a mnemonic-backed identity and writes the seed phrase", async () => {
    const identityPath = await createTempFile("identity.json", "");
    const mnemonicPath = await createTempFile("seed.txt", "");
    const writer = createWriter();

    const exitCode = await runCli(
      [
        "identity",
        "create",
        "--out",
        identityPath,
        "--words",
        "24",
        "--mnemonic-out",
        mnemonicPath,
        "--json",
      ],
      { writer: writer.writer }
    );

    expect(exitCode).toBe(0);
    expect(writer.read().stdout).toContain('"mnemonic"');
    expect(await readFile(identityPath, "utf8")).toContain('"format": "ternent-identity"');
    expect(await readFile(mnemonicPath, "utf8")).toContain("Seal seed phrase backup");
  });

  it("returns exit code 2 for a hash mismatch", async () => {
    const env = await createSigningEnv();
    const subjectPath = await createTempFile("sample.txt", "sample file\n");
    const mismatchPath = await createTempFile("different.txt", "different\n");
    const proofPath = await createTempFile("proof.json", "");

    await runCli(["sign", "--input", subjectPath, "--out", proofPath], { env });
    const exitCode = await runCli(
      ["verify", "--proof", proofPath, "--input", mismatchPath],
      { env }
    );

    expect(exitCode).toBe(2);
  });

  it("returns exit code 3 for an invalid signature", async () => {
    const env = await createSigningEnv();
    const otherEnv = await createSigningEnv();
    const subjectPath = await createTempFile("sample.txt", "sample file\n");
    const proofPath = await createTempFile("proof.json", "");

    await runCli(["sign", "--input", subjectPath, "--out", proofPath], {
      env: otherEnv,
    });

    const rawProof = await readFile(proofPath, "utf8");
    const parsed = JSON.parse(rawProof) as Record<string, unknown>;
    parsed.signer = {
      ...(parsed.signer as Record<string, unknown>),
      keyId: "bad-key-id",
    };
    await writeFile(proofPath, `${JSON.stringify(parsed, null, 2)}\n`, "utf8");

    const exitCode = await runCli(
      ["verify", "--proof", proofPath, "--input", subjectPath],
      { env }
    );

    expect(exitCode).toBe(3);
  });

  it("returns exit code 4 for schema invalid proof", async () => {
    const env = await createSigningEnv();
    const subjectPath = await createTempFile("sample.txt", "sample file\n");
    const proofPath = await createTempFile("proof.json", '{"type":"bad"}');

    const exitCode = await runCli(
      ["verify", "--proof", proofPath, "--input", subjectPath],
      { env }
    );

    expect(exitCode).toBe(4);
  });

  it("returns exit code 5 for key mismatch", async () => {
    const writer = createWriter();

    const exitCode = await runCli(["public-key"], {
      env: {},
      writer: writer.writer,
    });

    expect(exitCode).toBe(5);
  });
});
